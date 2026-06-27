using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Returns;

public class ReturnRequestDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ReturnStatus Status { get; set; }
    public decimal RefundAmount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
