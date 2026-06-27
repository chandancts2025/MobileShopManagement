using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class TaxRule : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public decimal Percentage { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
}
