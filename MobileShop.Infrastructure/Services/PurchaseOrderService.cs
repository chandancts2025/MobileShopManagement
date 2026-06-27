using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.PurchaseOrders;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class PurchaseOrderService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : IPurchaseOrderService
{
    public async Task<PagedResult<PurchaseOrderDto>> GetPurchaseOrdersAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = BaseQuery();

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x =>
                x.PurchaseOrderNumber.Contains(queryParameters.Search) ||
                x.Supplier.Name.Contains(queryParameters.Search));
        }

        query = queryParameters.SortBy?.ToLowerInvariant() switch
        {
            "totalamount" => queryParameters.SortDescending ? query.OrderByDescending(x => x.TotalAmount) : query.OrderBy(x => x.TotalAmount),
            "status" => queryParameters.SortDescending ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
            _ => queryParameters.SortDescending ? query.OrderByDescending(x => x.CreatedAtUtc) : query.OrderBy(x => x.CreatedAtUtc)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var orders = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<PurchaseOrderDto>
        {
            Items = orders.Select(Map).ToList(),
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<PurchaseOrderDto?> GetPurchaseOrderAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await BaseQuery().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return order is null ? null : Map(order);
    }

    public async Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var supplierExists = await dbContext.Suppliers.AnyAsync(x => x.Id == request.SupplierId && x.IsActive && !x.IsDeleted, cancellationToken);
        if (!supplierExists)
        {
            throw new InvalidOperationException("Supplier not found or inactive.");
        }

        var productIds = request.Items.Select(x => x.ProductId).Distinct().ToList();
        var productsCount = await dbContext.Products.CountAsync(x => productIds.Contains(x.Id) && x.IsActive && !x.IsDeleted, cancellationToken);
        if (productsCount != productIds.Count)
        {
            throw new InvalidOperationException("One or more products were not found.");
        }

        var items = request.Items.Select(item =>
        {
            var lineSubtotal = item.UnitCost * item.QuantityOrdered;
            var lineTax = lineSubtotal * (item.TaxPercentage / 100m);
            return new PurchaseOrderItem
            {
                ProductId = item.ProductId,
                QuantityOrdered = item.QuantityOrdered,
                UnitCost = item.UnitCost,
                TaxPercentage = item.TaxPercentage,
                CreatedBy = performedBy
            };
        }).ToList();

        var subtotal = request.Items.Sum(x => x.UnitCost * x.QuantityOrdered);
        var taxAmount = request.Items.Sum(x => x.UnitCost * x.QuantityOrdered * (x.TaxPercentage / 100m));

        var purchaseOrder = new PurchaseOrder
        {
            PurchaseOrderNumber = $"PO-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            SupplierId = request.SupplierId,
            ExpectedAtUtc = request.ExpectedAtUtc,
            Status = PurchaseOrderStatus.Ordered,
            Subtotal = subtotal,
            TaxAmount = taxAmount,
            TotalAmount = subtotal + taxAmount,
            Notes = request.Notes,
            Items = items,
            CreatedBy = performedBy
        };

        dbContext.PurchaseOrders.Add(purchaseOrder);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(PurchaseOrder), "Create", performedBy, purchaseOrder.PurchaseOrderNumber, cancellationToken);

        return await GetPurchaseOrderAsync(purchaseOrder.Id, cancellationToken)
            ?? throw new InvalidOperationException("Purchase order was created but could not be reloaded.");
    }

    public async Task<PurchaseOrderDto?> ReceivePurchaseOrderAsync(Guid id, ReceivePurchaseOrderRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var purchaseOrder = await dbContext.PurchaseOrders
            .Include(x => x.Supplier)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

        if (purchaseOrder is null)
        {
            return null;
        }

        if (purchaseOrder.Status is PurchaseOrderStatus.Cancelled or PurchaseOrderStatus.Received)
        {
            throw new InvalidOperationException("This purchase order cannot be received.");
        }

        foreach (var receivedItem in request.Items)
        {
            var item = purchaseOrder.Items.FirstOrDefault(x => x.ProductId == receivedItem.ProductId);
            if (item is null)
            {
                throw new InvalidOperationException("Received product was not found on this purchase order.");
            }

            var remainingQuantity = item.QuantityOrdered - item.QuantityReceived;
            if (receivedItem.QuantityReceived > remainingQuantity)
            {
                throw new InvalidOperationException($"Received quantity exceeds pending quantity for {item.Product.Name}.");
            }

            item.QuantityReceived += receivedItem.QuantityReceived;
            item.UpdatedAtUtc = DateTime.UtcNow;
            item.UpdatedBy = performedBy;

            var stock = await dbContext.InventoryStocks.FirstOrDefaultAsync(x => x.ProductId == item.ProductId, cancellationToken);
            if (stock is null)
            {
                stock = new InventoryStock
                {
                    ProductId = item.ProductId,
                    QuantityOnHand = 0,
                    ReorderLevel = 0,
                    CreatedBy = performedBy
                };
                dbContext.InventoryStocks.Add(stock);
            }

            stock.QuantityOnHand += receivedItem.QuantityReceived;
            stock.UpdatedAtUtc = DateTime.UtcNow;
            stock.UpdatedBy = performedBy;
            item.Product.CostPrice = item.UnitCost;
            item.Product.UpdatedAtUtc = DateTime.UtcNow;
            item.Product.UpdatedBy = performedBy;

            dbContext.StockTransactions.Add(new StockTransaction
            {
                InventoryStock = stock,
                TransactionType = StockTransactionType.Purchase,
                Quantity = receivedItem.QuantityReceived,
                Reason = $"Purchase order {purchaseOrder.PurchaseOrderNumber}",
                CreatedBy = performedBy
            });
        }

        purchaseOrder.Status = purchaseOrder.Items.All(x => x.QuantityReceived >= x.QuantityOrdered)
            ? PurchaseOrderStatus.Received
            : PurchaseOrderStatus.PartiallyReceived;
        purchaseOrder.ReceivedAtUtc = purchaseOrder.Status == PurchaseOrderStatus.Received ? DateTime.UtcNow : purchaseOrder.ReceivedAtUtc;
        purchaseOrder.UpdatedAtUtc = DateTime.UtcNow;
        purchaseOrder.UpdatedBy = performedBy;

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(PurchaseOrder), "Receive", performedBy, purchaseOrder.PurchaseOrderNumber, cancellationToken);

        return await GetPurchaseOrderAsync(id, cancellationToken);
    }

    public async Task<bool> CancelPurchaseOrderAsync(Guid id, string performedBy, CancellationToken cancellationToken = default)
    {
        var purchaseOrder = await dbContext.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (purchaseOrder is null)
        {
            return false;
        }

        if (purchaseOrder.Status == PurchaseOrderStatus.Received)
        {
            throw new InvalidOperationException("Received purchase orders cannot be cancelled.");
        }

        purchaseOrder.Status = PurchaseOrderStatus.Cancelled;
        purchaseOrder.UpdatedAtUtc = DateTime.UtcNow;
        purchaseOrder.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(PurchaseOrder), "Cancel", performedBy, purchaseOrder.PurchaseOrderNumber, cancellationToken);
        return true;
    }

    private IQueryable<PurchaseOrder> BaseQuery() =>
        dbContext.PurchaseOrders
            .Where(x => !x.IsDeleted)
            .Include(x => x.Supplier)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .AsNoTracking();

    private static PurchaseOrderDto Map(PurchaseOrder purchaseOrder) => new()
    {
        Id = purchaseOrder.Id,
        PurchaseOrderNumber = purchaseOrder.PurchaseOrderNumber,
        SupplierId = purchaseOrder.SupplierId,
        SupplierName = purchaseOrder.Supplier.Name,
        ExpectedAtUtc = purchaseOrder.ExpectedAtUtc,
        ReceivedAtUtc = purchaseOrder.ReceivedAtUtc,
        Status = purchaseOrder.Status,
        Subtotal = purchaseOrder.Subtotal,
        TaxAmount = purchaseOrder.TaxAmount,
        TotalAmount = purchaseOrder.TotalAmount,
        Notes = purchaseOrder.Notes,
        CreatedAtUtc = purchaseOrder.CreatedAtUtc,
        Items = purchaseOrder.Items.Select(x => new PurchaseOrderItemDto
        {
            ProductId = x.ProductId,
            ProductName = x.Product.Name,
            Sku = x.Product.Sku,
            QuantityOrdered = x.QuantityOrdered,
            QuantityReceived = x.QuantityReceived,
            UnitCost = x.UnitCost,
            TaxPercentage = x.TaxPercentage,
            LineTotal = (x.UnitCost * x.QuantityOrdered) + (x.UnitCost * x.QuantityOrdered * (x.TaxPercentage / 100m))
        }).ToList()
    };
}
