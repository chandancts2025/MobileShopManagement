using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Common;

public class NotificationDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ReadAtUtc { get; set; }
}

public class SendNotificationRequest
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }
    public Dictionary<string, string>? Metadata { get; set; }
}

public class NotificationSummaryDto
{
    public int TotalUnread { get; set; }
    public int TotalNotifications { get; set; }
    public Dictionary<NotificationType, int> NotificationsByType { get; set; } = new();
}
