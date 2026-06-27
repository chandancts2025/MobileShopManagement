using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class Invoice : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssuedAtUtc { get; set; } = DateTime.UtcNow;
    public Order Order { get; set; } = null!;
}
