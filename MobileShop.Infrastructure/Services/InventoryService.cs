using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Inventory;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class InventoryService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : IInventoryService
{
    public async Task<PagedResult<InventoryStockDto>> GetStocksAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.InventoryStocks
            .Include(x => x.Product)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.Product.Name.Contains(queryParameters.Search) || x.Product.Sku.Contains(queryParameters.Search));
        }

        query = queryParameters.SortBy?.ToLowerInvariant() switch
        {
            "quantityonhand" => queryParameters.SortDescending ? query.OrderByDescending(x => x.QuantityOnHand) : query.OrderBy(x => x.QuantityOnHand),
            "reorderlevel" => queryParameters.SortDescending ? query.OrderByDescending(x => x.ReorderLevel) : query.OrderBy(x => x.ReorderLevel),
            _ => queryParameters.SortDescending ? query.OrderByDescending(x => x.Product.Name) : query.OrderBy(x => x.Product.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new InventoryStockDto
            {
                ProductId = x.ProductId,
                ProductName = x.Product.Name,
                Sku = x.Product.Sku,
                QuantityOnHand = x.QuantityOnHand,
                ReservedQuantity = x.ReservedQuantity,
                ReorderLevel = x.ReorderLevel
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<InventoryStockDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<PagedResult<StockTransactionDto>> GetTransactionsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.StockTransactions
            .Include(x => x.InventoryStock)
            .ThenInclude(x => x.Product)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x =>
                x.InventoryStock.Product.Name.Contains(queryParameters.Search) ||
                x.InventoryStock.Product.Sku.Contains(queryParameters.Search) ||
                x.Reason.Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new StockTransactionDto
            {
                Id = x.Id,
                ProductId = x.InventoryStock.ProductId,
                ProductName = x.InventoryStock.Product.Name,
                Sku = x.InventoryStock.Product.Sku,
                TransactionType = x.TransactionType,
                Quantity = x.Quantity,
                Reason = x.Reason,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<StockTransactionDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public Task<bool> ReceiveStockAsync(StockReceiveRequest request, string performedBy, CancellationToken cancellationToken = default) =>
        ApplyStockChangeAsync(request.ProductId, request.Quantity, StockTransactionType.Purchase, $"Receive: {request.SupplierReference}", performedBy, cancellationToken);

    public Task<bool> AdjustStockAsync(StockAdjustmentRequest request, string performedBy, CancellationToken cancellationToken = default) =>
        ApplyStockChangeAsync(request.ProductId, request.Quantity, StockTransactionType.Adjustment, request.Reason, performedBy, cancellationToken);

    private async Task<bool> ApplyStockChangeAsync(Guid productId, int quantity, StockTransactionType transactionType, string reason, string performedBy, CancellationToken cancellationToken)
    {
        var stock = await dbContext.InventoryStocks.Include(x => x.Product).FirstOrDefaultAsync(x => x.ProductId == productId, cancellationToken);
        if (stock is null)
        {
            return false;
        }

        stock.QuantityOnHand += quantity;
        stock.UpdatedAtUtc = DateTime.UtcNow;
        stock.UpdatedBy = performedBy;
        dbContext.StockTransactions.Add(new StockTransaction
        {
            InventoryStockId = stock.Id,
            Quantity = quantity,
            TransactionType = transactionType,
            Reason = reason,
            CreatedBy = performedBy
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(InventoryStock), transactionType.ToString(), performedBy, $"{stock.Product.Name}:{quantity}", cancellationToken);
        return true;
    }
}
