using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class LoyaltyAccount : AuditableEntity
{
    public Guid CustomerProfileId { get; set; }
    public decimal CurrentPoints { get; set; } = 0;
    public LoyaltyTier Tier { get; set; } = LoyaltyTier.Bronze;
    public decimal TierMultiplier { get; set; } = 1.0m;
    public decimal TotalPointsEarned { get; set; } = 0;
    public decimal TotalPointsRedeemed { get; set; } = 0;
    public DateTime? LastPointsActivityUtc { get; set; }
    public DateTime JoinedUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public CustomerProfile CustomerProfile { get; set; } = null!;
    public ICollection<LoyaltyTransaction> Transactions { get; set; } = new List<LoyaltyTransaction>();
}

public class LoyaltyTransaction : AuditableEntity
{
    public Guid LoyaltyAccountId { get; set; }
    public LoyaltyTransactionType TransactionType { get; set; }
    public decimal PointsAmount { get; set; }
    public string Description { get; set; } = string.Empty;
    public Guid? RelatedOrderId { get; set; }
    public Guid? RelatedRedemptionId { get; set; }
    public LoyaltyAccount LoyaltyAccount { get; set; } = null!;
}

public class LoyaltyRedemption : AuditableEntity
{
    public Guid LoyaltyAccountId { get; set; }
    public decimal PointsRedeemed { get; set; }
    public decimal DiscountAmount { get; set; }
    public Guid? OrderId { get; set; }
    public LoyaltyRedemptionStatus Status { get; set; } = LoyaltyRedemptionStatus.Pending;
    public DateTime? ExpiresAtUtc { get; set; }
    public LoyaltyAccount LoyaltyAccount { get; set; } = null!;
}
