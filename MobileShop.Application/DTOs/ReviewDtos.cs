namespace MobileShop.Application.DTOs.Products;

public class ProductReviewDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid CustomerProfileId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public bool IsVerifiedPurchase { get; set; }
    public int HelpfulCount { get; set; }
    public int UnhelpfulCount { get; set; }
    public bool IsApproved { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateReviewRequest
{
    public Guid ProductId { get; set; }
    public int Rating { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public List<string>? ImageUrls { get; set; }
}

public class UpdateReviewRequest
{
    public int Rating { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public List<string>? ImageUrls { get; set; }
}

public class ReviewSummaryDto
{
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int VerifiedPurchaseCount { get; set; }
    public Dictionary<int, int> RatingDistribution { get; set; } = new();
}
