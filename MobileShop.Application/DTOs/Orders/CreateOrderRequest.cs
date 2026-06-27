namespace MobileShop.Application.DTOs.Orders;

public class CreateOrderRequest
{
    public Guid? CustomerProfileId { get; set; }
    public string? PromoCode { get; set; }
    public List<OrderItemRequest> Items { get; set; } = new();
}
