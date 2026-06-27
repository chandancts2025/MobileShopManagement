using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class ProductReview : AuditableEntity
{
    public Guid ProductId { get; set; }
    public Guid CustomerProfileId { get; set; }
    public int Rating { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public bool IsVerifiedPurchase { get; set; }
    public int HelpfulCount { get; set; } = 0;
    public int UnhelpfulCount { get; set; } = 0;
    public bool IsApproved { get; set; } = false;
    public Product Product { get; set; } = null!;
    public CustomerProfile CustomerProfile { get; set; } = null!;
    public ICollection<ReviewImage> Images { get; set; } = new List<ReviewImage>();
}

public class ReviewImage : AuditableEntity
{
    public Guid ReviewId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public ProductReview Review { get; set; } = null!;
}
