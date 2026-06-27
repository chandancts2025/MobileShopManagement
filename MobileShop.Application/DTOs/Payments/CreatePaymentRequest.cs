using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Payments;

public class CreatePaymentRequest
{
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; } = PaymentStatus.Paid;
    public string? TransactionReference { get; set; }
}
