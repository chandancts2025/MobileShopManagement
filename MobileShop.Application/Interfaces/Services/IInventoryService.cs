using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Inventory;

namespace MobileShop.Application.Interfaces.Services;

public interface IInventoryService
{
    Task<PagedResult<InventoryStockDto>> GetStocksAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<PagedResult<StockTransactionDto>> GetTransactionsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<bool> ReceiveStockAsync(StockReceiveRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> AdjustStockAsync(StockAdjustmentRequest request, string performedBy, CancellationToken cancellationToken = default);
}
