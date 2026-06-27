using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Billing;
using MobileShop.Application.DTOs.Customers;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class BillingService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : IBillingService
{
    private static readonly Expression<Func<Bill, BillDto>> BillProjection = bill => new BillDto
    {
        Id = bill.Id,
        BillNumber = bill.BillNumber,
        OrderId = bill.OrderId,
        OrderNumber = bill.Order.OrderNumber,
        CustomerName = bill.Order.CustomerProfile.FullName,
        IssuedAtUtc = bill.IssuedAtUtc,
        DueAtUtc = bill.DueAtUtc,
        Subtotal = bill.Subtotal,
        TaxAmount = bill.TaxAmount,
        DiscountAmount = bill.DiscountAmount,
        TotalAmount = bill.TotalAmount,
        BalanceDue = bill.BalanceDue,
        Notes = bill.Notes,
        Status = bill.Status,
        StatusText = bill.Status.ToString(),
        ShippingAddress = bill.Order.CustomerProfile.Addresses
            .Where(address => address.Type == AddressType.Shipping)
            .Select(address => new AddressDto
            {
                Type = address.Type,
                Line1 = address.Line1,
                Line2 = address.Line2,
                City = address.City,
                State = address.State,
                Country = address.Country,
                PostalCode = address.PostalCode
            })
            .FirstOrDefault(),
        DeliveryAddress = bill.Order.CustomerProfile.Addresses
            .Where(address => address.Type == AddressType.Primary || address.Type == AddressType.Shipping)
            .OrderBy(address => address.Type == AddressType.Primary ? 0 : 1)
            .Select(address => new AddressDto
            {
                Type = address.Type,
                Line1 = address.Line1,
                Line2 = address.Line2,
                City = address.City,
                State = address.State,
                Country = address.Country,
                PostalCode = address.PostalCode
            })
            .FirstOrDefault(),
        Items = bill.Items.Select(item => new BillItemDto
        {
            Id = item.Id,
            Description = item.Description,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            TotalAmount = item.TotalAmount
        }).ToList()
    };

    private readonly MobileShopDbContext dbContext = dbContext;
    private readonly IAuditLogService auditLogService = auditLogService;

    public async Task<PagedResult<BillDto>> GetBillsAsync(QueryParameters queryParameters, Guid? customerProfileId = null, CancellationToken cancellationToken = default)
    {
        IQueryable<Bill> query = dbContext.Bills
            .Include(x => x.Order)
            .ThenInclude(x => x.CustomerProfile)
            .ThenInclude(x => x.Addresses)
            .Include(x => x.Order)
            .ThenInclude(x => x.CustomerProfile)
            .ThenInclude(x => x.User)
            .AsNoTracking();

        if (customerProfileId.HasValue)
        {
            query = query.Where(x => x.CustomerProfileId == customerProfileId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            var search = queryParameters.Search.Trim().ToLowerInvariant();
            query = query.Where(x => x.BillNumber.ToLower().Contains(search)
                || x.Order.OrderNumber.ToLower().Contains(search)
                || x.Order.CustomerProfile.FullName.ToLower().Contains(search));
        }

        query = queryParameters.SortBy?.ToLowerInvariant() switch
        {
            "billnumber" => queryParameters.SortDescending ? query.OrderByDescending(x => x.BillNumber) : query.OrderBy(x => x.BillNumber),
            "duedate" => queryParameters.SortDescending ? query.OrderByDescending(x => x.DueAtUtc) : query.OrderBy(x => x.DueAtUtc),
            "status" => queryParameters.SortDescending ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
            "totalamount" => queryParameters.SortDescending ? query.OrderByDescending(x => x.TotalAmount) : query.OrderBy(x => x.TotalAmount),
            _ => queryParameters.SortDescending ? query.OrderByDescending(x => x.IssuedAtUtc) : query.OrderBy(x => x.IssuedAtUtc)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(BillProjection)
            .ToListAsync(cancellationToken);

        return new PagedResult<BillDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<BillDto?> GetBillAsync(Guid billId, Guid? customerProfileId = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Bills
            .Include(x => x.Order)
            .ThenInclude(x => x.CustomerProfile)
            .ThenInclude(x => x.Addresses)
            .Include(x => x.Order)
            .ThenInclude(x => x.CustomerProfile)
            .ThenInclude(x => x.User)
            .Include(x => x.Items)
            .AsNoTracking()
            .Where(x => x.Id == billId);

        if (customerProfileId.HasValue)
        {
            query = query.Where(x => x.CustomerProfileId == customerProfileId.Value);
        }

        return await query
            .Select(BillProjection)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<BillDto?> EnsureBillForOrderAsync(Guid orderId, Guid? customerProfileId, string performedBy, CancellationToken cancellationToken = default)
    {
        var existingQuery = dbContext.Bills
            .AsNoTracking()
            .Where(x => x.OrderId == orderId);

        if (customerProfileId.HasValue)
        {
            existingQuery = existingQuery.Where(x => x.CustomerProfileId == customerProfileId.Value);
        }

        var existingBillId = await existingQuery
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingBillId.HasValue)
        {
            return await GetBillAsync(existingBillId.Value, customerProfileId, cancellationToken);
        }

        var orderQuery = dbContext.Orders
            .Include(x => x.CustomerProfile)
            .ThenInclude(x => x.Addresses)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .Where(x => x.Id == orderId);

        if (customerProfileId.HasValue)
        {
            orderQuery = orderQuery.Where(x => x.CustomerProfileId == customerProfileId.Value);
        }

        var order = await orderQuery.FirstOrDefaultAsync(cancellationToken);
        if (order is null)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        var bill = new Bill
        {
            OrderId = order.Id,
            CustomerProfileId = order.CustomerProfileId,
            BillNumber = $"BILL-{now:yyyyMMddHHmmssfff}",
            IssuedAtUtc = now,
            DueAtUtc = now.AddDays(30),
            Subtotal = order.Subtotal,
            TaxAmount = order.TaxAmount,
            DiscountAmount = order.DiscountAmount,
            TotalAmount = order.TotalAmount,
            BalanceDue = order.TotalAmount,
            Status = BillStatus.Issued,
            CreatedBy = performedBy
        };

        foreach (var item in order.Items)
        {
            bill.Items.Add(new BillItem
            {
                Description = item.Product.Name,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalAmount = item.UnitPrice * item.Quantity,
                CreatedBy = performedBy
            });
        }

        dbContext.Bills.Add(bill);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Bill), "Create", performedBy, bill.BillNumber, cancellationToken);

        return await GetBillAsync(bill.Id, customerProfileId, cancellationToken);
    }

    public async Task<BillDto> CreateBillAsync(CreateBillRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders
            .Include(x => x.CustomerProfile)
            .FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        var subtotal = request.Items.Any() ? request.Items.Sum(x => x.Quantity * x.UnitPrice) : order.Subtotal;
        var tax = request.TaxAmount ?? order.TaxAmount;
        var discount = request.DiscountAmount ?? order.DiscountAmount;
        var total = subtotal + tax - discount;

        var bill = new Bill
        {
            OrderId = order.Id,
            CustomerProfileId = order.CustomerProfileId,
            BillNumber = string.IsNullOrWhiteSpace(request.BillNumber)
                ? $"BILL-{DateTime.UtcNow:yyyyMMddHHmmss}"
                : request.BillNumber.Trim(),
            IssuedAtUtc = DateTime.UtcNow,
            DueAtUtc = request.DueAtUtc ?? DateTime.UtcNow.AddDays(30),
            Subtotal = subtotal,
            TaxAmount = tax,
            DiscountAmount = discount,
            TotalAmount = total,
            BalanceDue = total,
            Status = BillStatus.Issued,
            Notes = request.Notes,
            CreatedBy = performedBy
        };

        if (request.Items.Any())
        {
            foreach (var item in request.Items)
            {
                bill.Items.Add(new BillItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.Quantity * item.UnitPrice,
                    CreatedBy = performedBy
                });
            }
        }

        dbContext.Bills.Add(bill);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetBillAsync(bill.Id, null, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve created bill.");
    }

    public async Task<BillDto?> UpdateBillAsync(Guid billId, UpdateBillRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var bill = await dbContext.Bills
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == billId, cancellationToken);

        if (bill == null || bill.Status == BillStatus.Paid || bill.Status == BillStatus.Cancelled)
        {
            return null;
        }

        bill.DueAtUtc = request.DueAtUtc ?? bill.DueAtUtc;
        bill.Notes = request.Notes ?? bill.Notes;
        bill.TaxAmount = request.TaxAmount ?? bill.TaxAmount;
        bill.DiscountAmount = request.DiscountAmount ?? bill.DiscountAmount;

        if (request.Items.Any())
        {
            bill.Items.Clear();
            foreach (var item in request.Items)
            {
                bill.Items.Add(new BillItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.Quantity * item.UnitPrice,
                    CreatedBy = performedBy
                });
            }

            bill.Subtotal = bill.Items.Sum(x => x.TotalAmount);
        }

        bill.TotalAmount = bill.Subtotal + bill.TaxAmount - bill.DiscountAmount;
        bill.BalanceDue = bill.TotalAmount;
        bill.UpdatedAtUtc = DateTime.UtcNow;
        bill.UpdatedBy = performedBy;

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetBillAsync(bill.Id, null, cancellationToken);
    }

    public async Task<bool> MarkBillPaidAsync(Guid billId, string performedBy, CancellationToken cancellationToken = default)
    {
        var bill = await dbContext.Bills
            .Include(x => x.Order)
            .FirstOrDefaultAsync(x => x.Id == billId, cancellationToken);

        if (bill == null)
        {
            return false;
        }

        bill.Status = BillStatus.Paid;
        bill.BalanceDue = 0;
        bill.UpdatedAtUtc = DateTime.UtcNow;
        bill.UpdatedBy = performedBy;

        if (bill.Order != null && bill.Order.Status != OrderStatus.Confirmed)
        {
            bill.Order.Status = OrderStatus.Confirmed;
            bill.Order.UpdatedAtUtc = DateTime.UtcNow;
            bill.Order.UpdatedBy = performedBy;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Bill), "MarkPaid", performedBy, bill.BillNumber, cancellationToken);

        return true;
    }

    public async Task<bool> DeleteBillAsync(Guid billId, CancellationToken cancellationToken = default)
    {
        var bill = await dbContext.Bills.FindAsync(new object?[] { billId }, cancellationToken);
        if (bill == null)
        {
            return false;
        }

        dbContext.Bills.Remove(bill);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
