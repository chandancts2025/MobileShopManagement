namespace MobileShop.Application.DTOs.Orders;

public class WishlistItemDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal CurrentPrice { get; set; }
    public decimal PriceWhenAdded { get; set; }
    public decimal? NotifyAtPrice { get; set; }
    public bool ShouldNotifyOnPriceChange { get; set; }
    public int ViewCount { get; set; }
    public DateTime? LastViewedUtc { get; set; }
    public DateTime AddedAtUtc { get; set; }
    public bool IsPriceDropped => CurrentPrice < PriceWhenAdded;
}

public class AddToWishlistRequest
{
    public Guid ProductId { get; set; }
    public decimal? NotifyAtPrice { get; set; }
    public bool ShouldNotifyOnPriceChange { get; set; } = true;
}

public class UpdateWishlistItemRequest
{
    public decimal? NotifyAtPrice { get; set; }
    public bool ShouldNotifyOnPriceChange { get; set; }
}

public class WishlistSummaryDto
{
    public int TotalItems { get; set; }
    public decimal TotalValue { get; set; }
    public int ItemsWithPriceDrop { get; set; }
}
