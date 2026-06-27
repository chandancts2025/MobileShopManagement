using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;

namespace MobileShop.Application.Interfaces.Services;

public interface ILookupService
{
    Task<PagedResult<LookupDto>> GetCategoriesAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<LookupDto> CreateCategoryAsync(UpsertLookupRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<LookupDto?> UpdateCategoryAsync(Guid id, UpsertLookupRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<LookupDto>> GetBrandsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<LookupDto> CreateBrandAsync(UpsertLookupRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<LookupDto?> UpdateBrandAsync(Guid id, UpsertLookupRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteBrandAsync(Guid id, CancellationToken cancellationToken = default);
}
