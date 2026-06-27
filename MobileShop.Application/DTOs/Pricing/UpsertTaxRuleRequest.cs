namespace MobileShop.Application.DTOs.Pricing;

public class UpsertTaxRuleRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal Percentage { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
}
