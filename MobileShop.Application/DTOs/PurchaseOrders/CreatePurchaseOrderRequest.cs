namespace MobileShop.Application.DTOs.PurchaseOrders;

public class CreatePurchaseOrderRequest
{
    public Guid SupplierId { get; set; }
    public DateTime? ExpectedAtUtc { get; set; }
    public string? Notes { get; set; }
    public List<PurchaseOrderItemRequest> Items { get; set; } = new();
}
