using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class SearchController(ISearchService searchService, ILookupService lookupService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string search = "",
        [FromQuery] Guid? categoryId = null,
        [FromQuery] Guid? brandId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] decimal? minRating = null,
        [FromQuery] QueryParameters? queryParameters = null,
        CancellationToken cancellationToken = default)
    {
        queryParameters ??= new QueryParameters();
        var result = await searchService.SearchProductsAsync(
            search, categoryId, brandId, minPrice, maxPrice, minRating, queryParameters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions(
        [FromQuery] string? term = null,
        [FromQuery] string? query = null,
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var searchTerm = !string.IsNullOrWhiteSpace(term) ? term : query ?? string.Empty;
        if (string.IsNullOrWhiteSpace(searchTerm))
            return Ok(new List<string>());

        var suggestions = await searchService.GetSearchSuggestionsAsync(searchTerm, count, cancellationToken);
        return Ok(suggestions);
    }

    [HttpGet("filter-options")]
    [HttpGet("filters")]
    public async Task<IActionResult> GetFilterOptions(CancellationToken cancellationToken)
    {
        var categoriesResult = await lookupService.GetCategoriesAsync(new QueryParameters { PageSize = 100 }, cancellationToken);
        var brandsResult = await lookupService.GetBrandsAsync(new QueryParameters { PageSize = 100 }, cancellationToken);

        return Ok(new
        {
            categories = categoriesResult.Items.Select(c => new { id = c.Id.ToString(), name = c.Name }),
            brands = brandsResult.Items.Select(b => new { id = b.Id.ToString(), name = b.Name })
        });
    }

    [HttpGet("filters/categories")]
    public async Task<IActionResult> GetCategoryFilters(CancellationToken cancellationToken)
    {
        var filters = await searchService.GetCategoryFiltersAsync(cancellationToken);
        return Ok(filters);
    }

    [HttpGet("filters/brands")]
    public async Task<IActionResult> GetBrandFilters(CancellationToken cancellationToken)
    {
        var filters = await searchService.GetBrandFiltersAsync(cancellationToken);
        return Ok(filters);
    }

    [HttpGet("filters/prices")]
    public async Task<IActionResult> GetPriceFilters(CancellationToken cancellationToken)
    {
        var prices = await searchService.GetPriceRangesAsync(cancellationToken);
        return Ok(prices);
    }
}
