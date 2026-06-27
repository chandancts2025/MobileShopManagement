namespace MobileShop.Application.DTOs.Orders;

public class OrderItemRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}
