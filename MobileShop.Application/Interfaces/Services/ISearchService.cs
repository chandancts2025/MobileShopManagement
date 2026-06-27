using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;

namespace MobileShop.Application.Interfaces.Services;

public interface ISearchService
{
    Task<PagedResult<ProductDto>> SearchProductsAsync(
        string searchTerm,
        Guid? categoryId,
        Guid? brandId,
        decimal? minPrice,
        decimal? maxPrice,
        decimal? minRating,
        QueryParameters queryParameters,
        CancellationToken cancellationToken);

    Task<List<string>> GetSearchSuggestionsAsync(string term, int count = 10, CancellationToken cancellationToken = default);

    Task<Dictionary<string, int>> GetCategoryFiltersAsync(CancellationToken cancellationToken);

    Task<Dictionary<string, int>> GetBrandFiltersAsync(CancellationToken cancellationToken);

    Task<List<decimal>> GetPriceRangesAsync(CancellationToken cancellationToken);
}
