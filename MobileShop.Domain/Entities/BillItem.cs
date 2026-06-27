using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class BillItem : AuditableEntity
{
    public Guid BillId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalAmount { get; set; }

    public Bill Bill { get; set; } = null!;
}
