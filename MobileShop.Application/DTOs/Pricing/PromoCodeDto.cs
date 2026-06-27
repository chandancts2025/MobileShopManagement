namespace MobileShop.Application.DTOs.Pricing;

public class PromoCodeDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public DateTime ValidFromUtc { get; set; }
    public DateTime ValidToUtc { get; set; }
    public bool IsActive { get; set; }
}
