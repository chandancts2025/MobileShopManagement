namespace MobileShop.Application.DTOs.Inventory;

public class InventoryStockDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int QuantityOnHand { get; set; }
    public int ReservedQuantity { get; set; }
    public int ReorderLevel { get; set; }
}
