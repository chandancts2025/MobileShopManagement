namespace MobileShop.Application.DTOs.Payments;

public class InvoiceDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssuedAtUtc { get; set; }
}
