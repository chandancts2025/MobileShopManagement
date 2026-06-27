using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class CustomerProfile : AuditableEntity
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public User User { get; set; } = null!;
    public ICollection<Address> Addresses { get; set; } = new List<Address>();
    public ICollection<RepairTicket> RepairTickets { get; set; } = new List<RepairTicket>();
    public ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();
    public ICollection<ProductReview> ProductReviews { get; set; } = new List<ProductReview>();
    public LoyaltyAccount? LoyaltyAccount { get; set; }
}
