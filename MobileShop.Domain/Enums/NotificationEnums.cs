namespace MobileShop.Domain.Enums;

public enum NotificationType
{
    OrderCreated = 1,
    OrderConfirmed = 2,
    OrderShipped = 3,
    OrderDelivered = 4,
    PaymentReceived = 5,
    PaymentFailed = 6,
    LowStockAlert = 7,
    PurchaseOrderCreated = 8,
    RepairStatusUpdate = 9,
    ReviewApproved = 10,
    PriceAlert = 11,
    WishlistItemAvailable = 12,
    LoyaltyPointsEarned = 13,
    PromotionAvailable = 14,
    GeneralAlert = 15
}

public enum LoyaltyTier
{
    Bronze = 1,
    Silver = 2,
    Gold = 3,
    Platinum = 4
}

public enum LoyaltyTransactionType
{
    PointsEarned = 1,
    PointsRedeemed = 2,
    PointsAdjustment = 3,
    PointsExpired = 4,
    TierUpgrade = 5
}

public enum LoyaltyRedemptionStatus
{
    Pending = 1,
    Applied = 2,
    Expired = 3,
    Cancelled = 4
}
