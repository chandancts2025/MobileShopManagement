using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class InventoryStock : AuditableEntity
{
    public Guid ProductId { get; set; }
    public int QuantityOnHand { get; set; }
    public int ReorderLevel { get; set; }
    public int ReservedQuantity { get; set; }
    public Product Product { get; set; } = null!;
    public ICollection<StockTransaction> Transactions { get; set; } = new List<StockTransaction>();
}
