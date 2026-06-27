using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Orders;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class OrderService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : IOrderService
{
    public async Task<PagedResult<OrderDto>> GetOrdersAsync(QueryParameters queryParameters, Guid? customerProfileId = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Orders
            .Include(x => x.CustomerProfile)
            .Include(x => x.Payments)
            .AsNoTracking();

        if (customerProfileId.HasValue)
        {
            query = query.Where(x => x.CustomerProfileId == customerProfileId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.OrderNumber.Contains(queryParameters.Search) || x.CustomerProfile.FullName.Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new OrderDto
            {
                Id = x.Id,
                OrderNumber = x.OrderNumber,
                CustomerName = x.CustomerProfile.FullName,
                TotalAmount = x.TotalAmount,
                PaidAmount = x.Payments.Sum(p => p.Amount),
                BalanceAmount = x.TotalAmount - x.Payments.Sum(p => p.Amount),
                TaxAmount = x.TaxAmount,
                DiscountAmount = x.DiscountAmount,
                Status = x.Status,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<OrderDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var productIds = request.Items.Select(i => i.ProductId).ToList();
        var products = await dbContext.Products
            .Include(x => x.InventoryStock)
            .Where(x => productIds.Contains(x.Id))
            .ToListAsync(cancellationToken);

        if (products.Count != request.Items.Count)
        {
            throw new InvalidOperationException("One or more products were not found.");
        }

        decimal subtotal = 0m;
        decimal taxAmount = 0m;
        decimal discountAmount = 0m;
        var orderItems = new List<OrderItem>();
        var orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}";

        foreach (var item in request.Items)
        {
            var product = products.Single(x => x.Id == item.ProductId);
            if (product.InventoryStock is null || product.InventoryStock.QuantityOnHand < item.Quantity)
            {
                throw new InvalidOperationException($"Insufficient stock for {product.Name}.");
            }

            var lineSubtotal = product.Price * item.Quantity;
            var lineTax = lineSubtotal * (product.TaxPercentage / 100m);
            var lineDiscount = product.DiscountAmount * item.Quantity;

            subtotal += lineSubtotal;
            taxAmount += lineTax;
            discountAmount += lineDiscount;

            product.InventoryStock.QuantityOnHand -= item.Quantity;
            product.InventoryStock.UpdatedAtUtc = DateTime.UtcNow;
            product.InventoryStock.UpdatedBy = performedBy;
            dbContext.StockTransactions.Add(new StockTransaction
            {
                InventoryStock = product.InventoryStock,
                Quantity = -item.Quantity,
                TransactionType = StockTransactionType.Sale,
                Reason = $"Order {orderNumber}",
                CreatedBy = performedBy
            });

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                UnitCost = product.CostPrice,
                TaxAmount = lineTax,
                DiscountAmount = lineDiscount,
                CreatedBy = performedBy
            });
        }

        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var now = DateTime.UtcNow;
            var promo = await dbContext.PromoCodes.FirstOrDefaultAsync(x =>
                x.Code == request.PromoCode &&
                x.IsActive &&
                x.ValidFromUtc <= now &&
                x.ValidToUtc >= now,
                cancellationToken);

            if (promo is null)
            {
                throw new InvalidOperationException("Promo code is invalid or expired.");
            }

            var discountBase = Math.Max(0m, subtotal - discountAmount);
            var promoDiscount = promo.DiscountAmount;
            if (promo.DiscountPercentage.HasValue)
            {
                promoDiscount += discountBase * (promo.DiscountPercentage.Value / 100m);
            }

            discountAmount += Math.Min(promoDiscount, discountBase);
        }

        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerProfileId = request.CustomerProfileId!.Value,
            Subtotal = subtotal,
            TaxAmount = taxAmount,
            DiscountAmount = discountAmount,
            TotalAmount = subtotal + taxAmount - discountAmount,
            Status = OrderStatus.Pending,
            Items = orderItems,
            CreatedBy = performedBy
        };

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Order), "Create", performedBy, order.OrderNumber, cancellationToken);

        // Create an associated bill for the order so billing is generated when an order is placed
        var bill = new Bill
        {
            OrderId = order.Id,
            CustomerProfileId = order.CustomerProfileId,
            BillNumber = $"BILL-{DateTime.UtcNow:yyyyMMddHHmmss}",
            IssuedAtUtc = DateTime.UtcNow,
            DueAtUtc = DateTime.UtcNow.AddDays(30),
            Subtotal = order.Subtotal,
            TaxAmount = order.TaxAmount,
            DiscountAmount = order.DiscountAmount,
            TotalAmount = order.TotalAmount,
            BalanceDue = order.TotalAmount,
            Status = BillStatus.Issued,
            CreatedBy = performedBy
        };

        // Map order items to bill items using the earlier loaded products for descriptions/pricing
        foreach (var reqItem in request.Items)
        {
            var product = products.SingleOrDefault(p => p.Id == reqItem.ProductId);
            bill.Items.Add(new BillItem
            {
                Description = product?.Name ?? reqItem.ProductId.ToString(),
                Quantity = reqItem.Quantity,
                UnitPrice = product?.Price ?? 0m,
                TotalAmount = (product?.Price ?? 0m) * reqItem.Quantity,
                CreatedBy = performedBy
            });
        }

        dbContext.Bills.Add(bill);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Bill), "Create", performedBy, bill.BillNumber, cancellationToken);

        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerName = string.Empty,
            TotalAmount = order.TotalAmount,
            PaidAmount = 0m,
            BalanceAmount = order.TotalAmount,
            TaxAmount = order.TaxAmount,
            DiscountAmount = order.DiscountAmount,
            Status = order.Status,
            CreatedAtUtc = order.CreatedAtUtc
        };
    }

    public async Task<bool> UpdateStatusAsync(Guid orderId, OrderStatus status, string performedBy, CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .ThenInclude(x => x.InventoryStock)
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);
        if (order is null)
        {
            return false;
        }

        if (status == OrderStatus.Cancelled && order.Status != OrderStatus.Cancelled)
        {
            foreach (var item in order.Items)
            {
                if (item.Product.InventoryStock is null)
                {
                    continue;
                }

                item.Product.InventoryStock.QuantityOnHand += item.Quantity;
                item.Product.InventoryStock.UpdatedAtUtc = DateTime.UtcNow;
                item.Product.InventoryStock.UpdatedBy = performedBy;
                dbContext.StockTransactions.Add(new StockTransaction
                {
                    InventoryStockId = item.Product.InventoryStock.Id,
                    Quantity = item.Quantity,
                    TransactionType = StockTransactionType.ReturnIn,
                    Reason = $"Cancelled order {order.OrderNumber}",
                    CreatedBy = performedBy
                });
            }
        }

        order.Status = status;
        order.UpdatedAtUtc = DateTime.UtcNow;
        order.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Order), status.ToString(), performedBy, order.OrderNumber, cancellationToken);
        return true;
    }
}
