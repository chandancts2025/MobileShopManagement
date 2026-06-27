using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Common;

public class LoyaltyAccountDto
{
    public Guid Id { get; set; }
    public Guid CustomerProfileId { get; set; }
    public decimal CurrentPoints { get; set; }
    public LoyaltyTier Tier { get; set; }
    public decimal TierMultiplier { get; set; }
    public decimal TotalPointsEarned { get; set; }
    public decimal TotalPointsRedeemed { get; set; }
    public DateTime JoinedUtc { get; set; }
    public bool IsActive { get; set; }
}

public class LoyaltyTransactionDto
{
    public Guid Id { get; set; }
    public LoyaltyTransactionType TransactionType { get; set; }
    public decimal PointsAmount { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class RedeemPointsRequest
{
    public decimal PointsToRedeem { get; set; }
    public Guid? OrderId { get; set; }
}

public class LoyaltyBenefitsDto
{
    public LoyaltyTier Tier { get; set; }
    public decimal PointsMultiplier { get; set; }
    public decimal DiscountPercentage { get; set; }
    public string Description { get; set; } = string.Empty;
    public int PointsRequiredForUpgrade { get; set; }
}

public class LoyaltyTierProgressDto
{
    public LoyaltyTier CurrentTier { get; set; }
    public decimal CurrentPoints { get; set; }
    public decimal PointsForNextTier { get; set; }
    public decimal PointsProgressPercentage { get; set; }
    public LoyaltyTier? NextTier { get; set; }
}
