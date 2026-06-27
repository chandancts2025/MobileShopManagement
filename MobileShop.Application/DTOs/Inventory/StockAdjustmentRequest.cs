namespace MobileShop.Application.DTOs.Inventory;

public class StockAdjustmentRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
}
