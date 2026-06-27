using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Payments;

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; }
    public string? TransactionReference { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
