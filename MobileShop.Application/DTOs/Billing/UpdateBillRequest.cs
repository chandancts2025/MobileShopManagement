namespace MobileShop.Application.DTOs.Billing;

public class UpdateBillRequest
{
    public DateTime? DueAtUtc { get; set; }
    public string? Notes { get; set; }
    public List<BillItemRequest> Items { get; set; } = new();
    public decimal? TaxAmount { get; set; }
    public decimal? DiscountAmount { get; set; }
}
