using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;

namespace MobileShop.Application.Interfaces.Services;

public interface INotificationService
{
    Task<PagedResult<NotificationDto>> GetUserNotificationsAsync(Guid userId, QueryParameters queryParameters, CancellationToken cancellationToken);
    Task<NotificationDto?> GetNotificationAsync(Guid notificationId, CancellationToken cancellationToken);
    Task<NotificationDto> SendNotificationAsync(SendNotificationRequest request, CancellationToken cancellationToken);
    Task<bool> MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken);
    Task<bool> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken);
    Task<bool> DeleteNotificationAsync(Guid notificationId, CancellationToken cancellationToken);
    Task<NotificationSummaryDto> GetNotificationSummaryAsync(Guid userId, CancellationToken cancellationToken);
    Task SendLowStockAlertAsync(Guid productId, string productName, int currentStock, string performedBy, CancellationToken cancellationToken);
    Task SendOrderStatusUpdateAsync(Guid customerId, Guid orderId, string orderNumber, string status, CancellationToken cancellationToken);
    Task SendPriceAlertAsync(Guid customerId, Guid productId, string productName, decimal newPrice, decimal oldPrice, CancellationToken cancellationToken);
}
