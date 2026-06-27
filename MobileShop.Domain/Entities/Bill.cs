using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class Bill : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid CustomerProfileId { get; set; }
    public string BillNumber { get; set; } = string.Empty;
    public DateTime IssuedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime DueAtUtc { get; set; } = DateTime.UtcNow.AddDays(30);
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal BalanceDue { get; set; }
    public BillStatus Status { get; set; } = BillStatus.Draft;
    public string? Notes { get; set; }

    public Order Order { get; set; } = null!;
    public CustomerProfile CustomerProfile { get; set; } = null!;
    public ICollection<BillItem> Items { get; set; } = new List<BillItem>();
}
