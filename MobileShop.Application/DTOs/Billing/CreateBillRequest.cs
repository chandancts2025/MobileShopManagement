namespace MobileShop.Application.DTOs.Billing;

public class CreateBillRequest
{
    public Guid OrderId { get; set; }
    public string? BillNumber { get; set; }
    public DateTime? DueAtUtc { get; set; }
    public string? Notes { get; set; }
    public List<BillItemRequest> Items { get; set; } = new();
    public decimal? TaxAmount { get; set; }
    public decimal? DiscountAmount { get; set; }
}
