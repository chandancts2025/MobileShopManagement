using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Orders;
using MobileShop.Domain.Enums;

namespace MobileShop.Application.Interfaces.Services;

public interface IOrderService
{
    Task<PagedResult<OrderDto>> GetOrdersAsync(QueryParameters queryParameters, Guid? customerProfileId = null, CancellationToken cancellationToken = default);
    Task<OrderDto> CreateOrderAsync(CreateOrderRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> UpdateStatusAsync(Guid orderId, OrderStatus status, string performedBy, CancellationToken cancellationToken = default);
}
