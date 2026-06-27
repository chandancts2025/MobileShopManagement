using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class SearchController(ISearchService searchService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string search = "",
        [FromQuery] Guid? categoryId = null,
        [FromQuery] Guid? brandId = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] decimal? minRating = null,
        [FromQuery] QueryParameters queryParameters = null,
        CancellationToken cancellationToken = default)
    {
        queryParameters ??= new QueryParameters();
        var result = await searchService.SearchProductsAsync(
            search, categoryId, brandId, minPrice, maxPrice, minRating, queryParameters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("suggestions")]
    public async Task<IActionResult> GetSuggestions(
        [FromQuery] string term,
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(term))
            return Ok(new List<string>());

        var suggestions = await searchService.GetSearchSuggestionsAsync(term, count, cancellationToken);
        return Ok(suggestions);
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
