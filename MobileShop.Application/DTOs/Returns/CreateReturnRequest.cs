namespace MobileShop.Application.DTOs.Returns;

public class CreateReturnRequest
{
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
}
