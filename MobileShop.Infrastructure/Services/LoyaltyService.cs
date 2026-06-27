using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class LoyaltyService(MobileShopDbContext dbContext) : ILoyaltyService
{
    private static readonly Dictionary<LoyaltyTier, (decimal PointsMultiplier, decimal DiscountPercentage, int PointsForUpgrade)> TierBenefits =
        new()
        {
            { LoyaltyTier.Bronze, (1.0m, 0, 0) },
            { LoyaltyTier.Silver, (1.25m, 5, 1000) },
            { LoyaltyTier.Gold, (1.5m, 10, 2500) },
            { LoyaltyTier.Platinum, (2.0m, 15, 5000) }
        };

    public async Task<LoyaltyAccountDto?> GetLoyaltyAccountAsync(Guid customerProfileId, CancellationToken cancellationToken)
    {
        return await dbContext.LoyaltyAccounts
            .Where(la => la.CustomerProfileId == customerProfileId)
            .Select(la => MapToDto(la))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<LoyaltyAccountDto> CreateLoyaltyAccountAsync(Guid customerProfileId, string performedBy, CancellationToken cancellationToken)
    {
        var existing = await dbContext.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.CustomerProfileId == customerProfileId, cancellationToken);

        if (existing != null)
            return MapToDto(existing);

        var loyaltyAccount = new LoyaltyAccount
        {
            CustomerProfileId = customerProfileId,
            CurrentPoints = 0,
            Tier = LoyaltyTier.Bronze,
            TierMultiplier = 1.0m,
            TotalPointsEarned = 0,
            TotalPointsRedeemed = 0,
            JoinedUtc = DateTime.UtcNow,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = performedBy
        };

        dbContext.LoyaltyAccounts.Add(loyaltyAccount);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapToDto(loyaltyAccount);
    }

    public async Task<bool> AddPointsAsync(Guid customerProfileId, decimal points, string description, Guid? relatedOrderId, string performedBy, CancellationToken cancellationToken)
    {
        var account = await dbContext.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.CustomerProfileId == customerProfileId, cancellationToken);

        if (account == null)
            return false;

        var adjustedPoints = points * account.TierMultiplier;
        account.CurrentPoints += adjustedPoints;
        account.TotalPointsEarned += adjustedPoints;
        account.LastPointsActivityUtc = DateTime.UtcNow;

        var transaction = new LoyaltyTransaction
        {
            LoyaltyAccountId = account.Id,
            TransactionType = LoyaltyTransactionType.PointsEarned,
            PointsAmount = adjustedPoints,
            Description = description,
            RelatedOrderId = relatedOrderId,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = performedBy
        };

        dbContext.LoyaltyTransactions.Add(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> RedeemPointsAsync(Guid customerProfileId, RedeemPointsRequest request, string performedBy, CancellationToken cancellationToken)
    {
        var account = await dbContext.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.CustomerProfileId == customerProfileId, cancellationToken);

        if (account == null || account.CurrentPoints < request.PointsToRedeem)
            return false;

        account.CurrentPoints -= request.PointsToRedeem;
        account.TotalPointsRedeemed += request.PointsToRedeem;
        account.LastPointsActivityUtc = DateTime.UtcNow;

        var redemption = new LoyaltyRedemption
        {
            LoyaltyAccountId = account.Id,
            PointsRedeemed = request.PointsToRedeem,
            DiscountAmount = request.PointsToRedeem * 0.01m,
            OrderId = request.OrderId,
            Status = LoyaltyRedemptionStatus.Applied,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = performedBy
        };

        var transaction = new LoyaltyTransaction
        {
            LoyaltyAccountId = account.Id,
            TransactionType = LoyaltyTransactionType.PointsRedeemed,
            PointsAmount = request.PointsToRedeem,
            Description = $"Redeemed {request.PointsToRedeem} points for discount",
            RelatedRedemptionId = redemption.Id,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = performedBy
        };

        dbContext.LoyaltyRedemptions.Add(redemption);
        dbContext.LoyaltyTransactions.Add(transaction);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<PagedResult<LoyaltyTransactionDto>> GetTransactionHistoryAsync(Guid customerProfileId, QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        var account = await dbContext.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.CustomerProfileId == customerProfileId, cancellationToken);

        if (account == null)
            return new PagedResult<LoyaltyTransactionDto> { Items = Array.Empty<LoyaltyTransactionDto>(), TotalCount = 0, PageNumber = 1, PageSize = 10 };

        var query = dbContext.LoyaltyTransactions
            .Where(t => t.LoyaltyAccountId == account.Id)
            .AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(t => t.CreatedAtUtc)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(t => MapTransactionToDto(t))
            .ToListAsync(cancellationToken);

        return new PagedResult<LoyaltyTransactionDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<LoyaltyTierProgressDto> GetTierProgressAsync(Guid customerProfileId, CancellationToken cancellationToken)
    {
        var account = await dbContext.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.CustomerProfileId == customerProfileId, cancellationToken);

        if (account == null)
            return BuildTierProgress(LoyaltyTier.Bronze, 0m);

        return BuildTierProgress(account.Tier, account.CurrentPoints);
    }

    private static LoyaltyTierProgressDto BuildTierProgress(LoyaltyTier tier, decimal currentPoints)
    {
        var nextTier = tier == LoyaltyTier.Platinum ? null : (LoyaltyTier?)(tier + 1);
        var nextTierPoints = nextTier.HasValue ? TierBenefits[nextTier.Value].Item3 : currentPoints;
        var progressPercentage = nextTierPoints > 0
            ? Math.Min(100m, currentPoints / nextTierPoints * 100m)
            : 100m;

        return new LoyaltyTierProgressDto
        {
            CurrentTier = tier,
            CurrentPoints = currentPoints,
            PointsForNextTier = nextTierPoints,
            PointsProgressPercentage = progressPercentage,
            NextTier = nextTier
        };
    }

    public async Task<LoyaltyBenefitsDto> GetTierBenefitsAsync(LoyaltyTier tier, CancellationToken cancellationToken)
    {
        var (multiplier, discount, pointsRequired) = TierBenefits[tier];

        var description = tier switch
        {
            LoyaltyTier.Bronze => "Welcome to our loyalty program! Earn points on every purchase.",
            LoyaltyTier.Silver => "Enjoy 1.25x points multiplier and 5% discount on all purchases.",
            LoyaltyTier.Gold => "Premium member! 1.5x points multiplier and 10% discount.",
            LoyaltyTier.Platinum => "Elite member! 2x points multiplier and 15% discount on all purchases.",
            _ => "Unknown tier"
        };

        return new LoyaltyBenefitsDto
        {
            Tier = tier,
            PointsMultiplier = multiplier,
            DiscountPercentage = discount,
            Description = description,
            PointsRequiredForUpgrade = pointsRequired
        };
    }

    public async Task EvaluateAndUpgradeTierAsync(Guid customerProfileId, string performedBy, CancellationToken cancellationToken)
    {
        var account = await dbContext.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.CustomerProfileId == customerProfileId, cancellationToken);

        if (account == null)
            return;

        var newTier = account.CurrentPoints switch
        {
            >= 5000 => LoyaltyTier.Platinum,
            >= 2500 => LoyaltyTier.Gold,
            >= 1000 => LoyaltyTier.Silver,
            _ => LoyaltyTier.Bronze
        };

        if (newTier != account.Tier)
        {
            account.Tier = newTier;
            var (multiplier, _, _) = TierBenefits[newTier];
            account.TierMultiplier = multiplier;

            var transaction = new LoyaltyTransaction
            {
                LoyaltyAccountId = account.Id,
                TransactionType = LoyaltyTransactionType.TierUpgrade,
                PointsAmount = 0,
                Description = $"Tier upgraded to {newTier}",
                CreatedAtUtc = DateTime.UtcNow,
                CreatedBy = performedBy
            };

            dbContext.LoyaltyTransactions.Add(transaction);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<decimal> CalculatePointsForOrderAsync(Guid customerProfileId, decimal orderTotal, CancellationToken cancellationToken)
    {
        var account = await dbContext.LoyaltyAccounts
            .FirstOrDefaultAsync(la => la.CustomerProfileId == customerProfileId, cancellationToken);

        if (account == null)
            return orderTotal * 10; // 1 point per every 0.1 currency

        return orderTotal * 10 * account.TierMultiplier;
    }

    public async Task ProcessMonthlyTierExpiriesAsync(string performedBy, CancellationToken cancellationToken)
    {
        // Placeholder for monthly tier expiry processing
        await Task.CompletedTask;
    }

    private static LoyaltyAccountDto MapToDto(LoyaltyAccount la)
    {
        return new LoyaltyAccountDto
        {
            Id = la.Id,
            CustomerProfileId = la.CustomerProfileId,
            CurrentPoints = la.CurrentPoints,
            Tier = la.Tier,
            TierMultiplier = la.TierMultiplier,
            TotalPointsEarned = la.TotalPointsEarned,
            TotalPointsRedeemed = la.TotalPointsRedeemed,
            JoinedUtc = la.JoinedUtc,
            IsActive = la.IsActive
        };
    }

    private static LoyaltyTransactionDto MapTransactionToDto(LoyaltyTransaction t)
    {
        return new LoyaltyTransactionDto
        {
            Id = t.Id,
            TransactionType = t.TransactionType,
            PointsAmount = t.PointsAmount,
            Description = t.Description,
            CreatedAtUtc = t.CreatedAtUtc
        };
    }
}
