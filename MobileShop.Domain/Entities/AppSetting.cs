using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class AppSetting : AuditableEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}
