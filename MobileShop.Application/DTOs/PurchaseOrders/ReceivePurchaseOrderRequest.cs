namespace MobileShop.Application.DTOs.PurchaseOrders;

public class ReceivePurchaseOrderRequest
{
    public List<ReceivePurchaseOrderItemRequest> Items { get; set; } = new();
}
