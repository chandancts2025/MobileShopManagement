namespace MobileShop.Application.DTOs.Inventory;

public class StockReceiveRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public string SupplierReference { get; set; } = string.Empty;
}
