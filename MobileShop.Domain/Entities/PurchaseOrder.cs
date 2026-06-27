using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class PurchaseOrder : AuditableEntity
{
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public DateTime? ExpectedAtUtc { get; set; }
    public DateTime? ReceivedAtUtc { get; set; }
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Ordered;
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public Supplier Supplier { get; set; } = null!;
    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
}
