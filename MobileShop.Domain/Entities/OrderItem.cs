using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class OrderItem : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
