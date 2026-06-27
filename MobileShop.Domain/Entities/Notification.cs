using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class Notification : AuditableEntity
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAtUtc { get; set; }
    public string? Metadata { get; set; }
    public User User { get; set; } = null!;
}

public class NotificationTemplate : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string EmailSubject { get; set; } = string.Empty;
    public string EmailBody { get; set; } = string.Empty;
    public string? SmsBody { get; set; }
    public bool IsActive { get; set; } = true;
    public string? PlaceholderVariables { get; set; }
}
