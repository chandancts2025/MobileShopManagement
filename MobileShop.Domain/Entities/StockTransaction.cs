using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class StockTransaction : AuditableEntity
{
    public Guid InventoryStockId { get; set; }
    public StockTransactionType TransactionType { get; set; }
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public InventoryStock InventoryStock { get; set; } = null!;
}
