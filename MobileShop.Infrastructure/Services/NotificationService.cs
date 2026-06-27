using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class NotificationService(MobileShopDbContext dbContext) : INotificationService
{
    public async Task<PagedResult<NotificationDto>> GetUserNotificationsAsync(Guid userId, QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        IQueryable<Notification> query = dbContext.Notifications
            .Where(n => n.UserId == userId)
            .AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(n => MapToDto(n))
            .ToListAsync(cancellationToken);

        return new PagedResult<NotificationDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<NotificationDto?> GetNotificationAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        return await dbContext.Notifications
            .Where(n => n.Id == notificationId)
            .Select(n => MapToDto(n))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<NotificationDto> SendNotificationAsync(SendNotificationRequest request, CancellationToken cancellationToken)
    {
        var notification = new Notification
        {
            UserId = request.UserId,
            Type = request.Type,
            Title = request.Title,
            Message = request.Message,
            ActionUrl = request.ActionUrl,
            Metadata = request.Metadata != null ? System.Text.Json.JsonSerializer.Serialize(request.Metadata) : null,
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        dbContext.Notifications.Add(notification);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapToDto(notification);
    }

    public async Task<bool> MarkAsReadAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        var notification = await dbContext.Notifications.FindAsync(new object?[] { notificationId }, cancellationToken);
        if (notification == null)
            return false;

        notification.IsRead = true;
        notification.ReadAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken)
    {
        var notifications = await dbContext.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAtUtc = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteNotificationAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        var notification = await dbContext.Notifications.FindAsync(new object?[] { notificationId }, cancellationToken);
        if (notification == null)
            return false;

        dbContext.Notifications.Remove(notification);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<NotificationSummaryDto> GetNotificationSummaryAsync(Guid userId, CancellationToken cancellationToken)
    {
        var notifications = await dbContext.Notifications
            .Where(n => n.UserId == userId)
            .ToListAsync(cancellationToken);

        var notificationsByType = new Dictionary<NotificationType, int>();
        foreach (NotificationType type in Enum.GetValues(typeof(NotificationType)))
        {
            notificationsByType[type] = notifications.Count(n => n.Type == type);
        }

        return new NotificationSummaryDto
        {
            TotalUnread = notifications.Count(n => !n.IsRead),
            TotalNotifications = notifications.Count,
            NotificationsByType = notificationsByType
        };
    }

    public async Task SendLowStockAlertAsync(Guid productId, string productName, int currentStock, string performedBy, CancellationToken cancellationToken)
    {
        var admins = await dbContext.Users
            .Where(u => u.Role == UserRoleType.Admin || u.Role == UserRoleType.SuperAdmin)
            .ToListAsync(cancellationToken);

        foreach (var admin in admins)
        {
            await SendNotificationAsync(new SendNotificationRequest
            {
                UserId = admin.Id,
                Type = NotificationType.LowStockAlert,
                Title = $"Low Stock Alert - {productName}",
                Message = $"Product '{productName}' is running low. Current stock: {currentStock} units.",
                ActionUrl = $"/inventory?product={productId}"
            }, cancellationToken);
        }
    }

    public async Task SendOrderStatusUpdateAsync(Guid customerId, Guid orderId, string orderNumber, string status, CancellationToken cancellationToken)
    {
        await SendNotificationAsync(new SendNotificationRequest
        {
            UserId = customerId,
            Type = NotificationType.OrderConfirmed,
            Title = $"Order {orderNumber} Updated",
            Message = $"Your order status has been updated to: {status}",
            ActionUrl = $"/orders/{orderId}"
        }, cancellationToken);
    }

    public async Task SendPriceAlertAsync(Guid customerId, Guid productId, string productName, decimal newPrice, decimal oldPrice, CancellationToken cancellationToken)
    {
        var discount = ((oldPrice - newPrice) / oldPrice * 100);

        await SendNotificationAsync(new SendNotificationRequest
        {
            UserId = customerId,
            Type = NotificationType.PriceAlert,
            Title = $"Price Drop - {productName}",
            Message = $"The price of '{productName}' has dropped from {oldPrice:C} to {newPrice:C} ({discount:F0}% off)!",
            ActionUrl = $"/products/{productId}"
        }, cancellationToken);
    }

    private static NotificationDto MapToDto(Notification n)
    {
        return new NotificationDto
        {
            Id = n.Id,
            UserId = n.UserId,
            Type = n.Type,
            Title = n.Title,
            Message = n.Message,
            ActionUrl = n.ActionUrl,
            IsRead = n.IsRead,
            CreatedAtUtc = n.CreatedAtUtc,
            ReadAtUtc = n.ReadAtUtc
        };
    }
}
