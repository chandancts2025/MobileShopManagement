using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class WishlistItem : AuditableEntity
{
    public Guid CustomerProfileId { get; set; }
    public Guid ProductId { get; set; }
    public decimal? NotifyAtPrice { get; set; }
    public bool ShouldNotifyOnPriceChange { get; set; } = true;
    public decimal PriceWhenAdded { get; set; }
    public int ViewCount { get; set; } = 0;
    public DateTime? LastViewedUtc { get; set; }
    public Product Product { get; set; } = null!;
    public CustomerProfile CustomerProfile { get; set; } = null!;
}
