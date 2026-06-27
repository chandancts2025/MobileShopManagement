namespace MobileShop.Application.DTOs.PurchaseOrders;

public class PurchaseOrderItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int QuantityOrdered { get; set; }
    public int QuantityReceived { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TaxPercentage { get; set; }
    public decimal LineTotal { get; set; }
}
