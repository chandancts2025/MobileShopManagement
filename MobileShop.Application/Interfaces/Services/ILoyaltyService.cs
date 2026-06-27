using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;

namespace MobileShop.Application.Interfaces.Services;

public interface ILoyaltyService
{
    Task<LoyaltyAccountDto?> GetLoyaltyAccountAsync(Guid customerProfileId, CancellationToken cancellationToken);
    Task<LoyaltyAccountDto> CreateLoyaltyAccountAsync(Guid customerProfileId, string performedBy, CancellationToken cancellationToken);
    Task<bool> AddPointsAsync(Guid customerProfileId, decimal points, string description, Guid? relatedOrderId, string performedBy, CancellationToken cancellationToken);
    Task<bool> RedeemPointsAsync(Guid customerProfileId, RedeemPointsRequest request, string performedBy, CancellationToken cancellationToken);
    Task<PagedResult<LoyaltyTransactionDto>> GetTransactionHistoryAsync(Guid customerProfileId, QueryParameters queryParameters, CancellationToken cancellationToken);
    Task<LoyaltyTierProgressDto> GetTierProgressAsync(Guid customerProfileId, CancellationToken cancellationToken);
    Task<LoyaltyBenefitsDto> GetTierBenefitsAsync(Domain.Enums.LoyaltyTier tier, CancellationToken cancellationToken);
    Task EvaluateAndUpgradeTierAsync(Guid customerProfileId, string performedBy, CancellationToken cancellationToken);
    Task<decimal> CalculatePointsForOrderAsync(Guid customerProfileId, decimal orderTotal, CancellationToken cancellationToken);
    Task ProcessMonthlyTierExpiriesAsync(string performedBy, CancellationToken cancellationToken);
}
