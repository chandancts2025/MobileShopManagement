using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Orders;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
