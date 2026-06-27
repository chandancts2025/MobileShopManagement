namespace MobileShop.Application.DTOs.PurchaseOrders;

public class PurchaseOrderItemRequest
{
    public Guid ProductId { get; set; }
    public int QuantityOrdered { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TaxPercentage { get; set; }
}
