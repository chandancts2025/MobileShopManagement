using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Returns;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class ReturnService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : IReturnService
{
    public async Task<PagedResult<ReturnRequestDto>> GetReturnsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.ReturnRequests.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.Reason.Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.CreatedAtUtc)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new ReturnRequestDto
            {
                Id = x.Id,
                OrderId = x.OrderId,
                Reason = x.Reason,
                Status = x.Status,
                RefundAmount = x.RefundAmount,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<ReturnRequestDto> { Items = items, TotalCount = totalCount, PageNumber = queryParameters.PageNumber, PageSize = queryParameters.PageSize };
    }

    public async Task<ReturnRequestDto> CreateReturnAsync(CreateReturnRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        var returnRequest = new ReturnRequest
        {
            OrderId = request.OrderId,
            Reason = request.Reason,
            RefundAmount = request.RefundAmount,
            Status = ReturnStatus.Requested,
            CreatedBy = performedBy
        };

        order.Status = OrderStatus.Returned;
        dbContext.ReturnRequests.Add(returnRequest);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(ReturnRequest), "Create", performedBy, request.Reason, cancellationToken);

        return new ReturnRequestDto
        {
            Id = returnRequest.Id,
            OrderId = returnRequest.OrderId,
            Reason = returnRequest.Reason,
            Status = returnRequest.Status,
            RefundAmount = returnRequest.RefundAmount,
            CreatedAtUtc = returnRequest.CreatedAtUtc
        };
    }

    public async Task<ReturnRequestDto?> UpdateReturnStatusAsync(Guid id, UpdateReturnStatusRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var returnRequest = await dbContext.ReturnRequests
            .Include(x => x.Order)
            .ThenInclude(x => x.Items)
            .ThenInclude(x => x.Product)
            .ThenInclude(x => x.InventoryStock)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (returnRequest is null)
        {
            return null;
        }

        if (request.Status == ReturnStatus.Completed && returnRequest.Status != ReturnStatus.Completed)
        {
            foreach (var item in returnRequest.Order.Items)
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
                    Reason = $"Return {returnRequest.Id}",
                    CreatedBy = performedBy
                });
            }
        }

        returnRequest.Status = request.Status;
        returnRequest.UpdatedAtUtc = DateTime.UtcNow;
        returnRequest.UpdatedBy = performedBy;
        returnRequest.Order.Status = request.Status == ReturnStatus.Completed ? OrderStatus.Returned : returnRequest.Order.Status;
        returnRequest.Order.UpdatedAtUtc = DateTime.UtcNow;
        returnRequest.Order.UpdatedBy = performedBy;

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(ReturnRequest), request.Status.ToString(), performedBy, returnRequest.Id.ToString(), cancellationToken);

        return new ReturnRequestDto
        {
            Id = returnRequest.Id,
            OrderId = returnRequest.OrderId,
            Reason = returnRequest.Reason,
            Status = returnRequest.Status,
            RefundAmount = returnRequest.RefundAmount,
            CreatedAtUtc = returnRequest.CreatedAtUtc
        };
    }
}
