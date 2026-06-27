using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class AuditLog : AuditableEntity
{
    public string EntityName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public string? Payload { get; set; }
}
