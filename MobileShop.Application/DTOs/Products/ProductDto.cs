using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Products;

public class ProductDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProductType ProductType { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public Guid BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal CostPrice { get; set; }
    public decimal TaxPercentage { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? PromoCode { get; set; }
    public int QuantityOnHand { get; set; }
    public int ReorderLevel { get; set; }
}
