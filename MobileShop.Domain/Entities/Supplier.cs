using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class Supplier : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? TaxRegistrationNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
}
