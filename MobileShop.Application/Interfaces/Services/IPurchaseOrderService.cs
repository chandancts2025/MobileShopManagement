using MobileShop.Application.Common;
using MobileShop.Application.DTOs.PurchaseOrders;

namespace MobileShop.Application.Interfaces.Services;

public interface IPurchaseOrderService
{
    Task<PagedResult<PurchaseOrderDto>> GetPurchaseOrdersAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> GetPurchaseOrderAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<PurchaseOrderDto?> ReceivePurchaseOrderAsync(Guid id, ReceivePurchaseOrderRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> CancelPurchaseOrderAsync(Guid id, string performedBy, CancellationToken cancellationToken = default);
}
