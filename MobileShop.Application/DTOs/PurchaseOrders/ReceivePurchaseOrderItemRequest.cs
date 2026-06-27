namespace MobileShop.Application.DTOs.PurchaseOrders;

public class ReceivePurchaseOrderItemRequest
{
    public Guid ProductId { get; set; }
    public int QuantityReceived { get; set; }
}
