using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class Product : AuditableEntity
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProductType ProductType { get; set; }
    public Guid CategoryId { get; set; }
    public Guid BrandId { get; set; }
    public decimal Price { get; set; }
    public decimal CostPrice { get; set; }
    public decimal TaxPercentage { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? PromoCode { get; set; }
    public string? Color { get; set; }
    public string? Storage { get; set; }
    public bool IsActive { get; set; } = true;
    public Brand Brand { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public InventoryStock? InventoryStock { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
    public ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
}
