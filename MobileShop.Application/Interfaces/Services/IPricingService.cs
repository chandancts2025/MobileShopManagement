using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Pricing;

namespace MobileShop.Application.Interfaces.Services;

public interface IPricingService
{
    Task<PagedResult<TaxRuleDto>> GetTaxRulesAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<TaxRuleDto> CreateTaxRuleAsync(UpsertTaxRuleRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<TaxRuleDto?> UpdateTaxRuleAsync(Guid id, UpsertTaxRuleRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteTaxRuleAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<PromoCodeDto>> GetPromoCodesAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<PromoCodeDto> CreatePromoCodeAsync(UpsertPromoCodeRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<PromoCodeDto?> UpdatePromoCodeAsync(Guid id, UpsertPromoCodeRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeletePromoCodeAsync(Guid id, CancellationToken cancellationToken = default);
}
