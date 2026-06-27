using MobileShop.Application.DTOs.Customers;

namespace MobileShop.Application.DTOs.Billing;

public class BillDto
{
    public Guid Id { get; set; }
    public string BillNumber { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public DateTime IssuedAtUtc { get; set; }
    public DateTime DueAtUtc { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal BalanceDue { get; set; }
    public string? Notes { get; set; }
    public Domain.Enums.BillStatus Status { get; set; } = Domain.Enums.BillStatus.Draft;
    public string StatusText { get; set; } = string.Empty;
    public AddressDto? ShippingAddress { get; set; }
    public AddressDto? DeliveryAddress { get; set; }
    public List<BillItemDto> Items { get; set; } = new();
}
