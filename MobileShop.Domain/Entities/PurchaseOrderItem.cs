using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class PurchaseOrderItem : AuditableEntity
{
    public Guid PurchaseOrderId { get; set; }
    public Guid ProductId { get; set; }
    public int QuantityOrdered { get; set; }
    public int QuantityReceived { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TaxPercentage { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
