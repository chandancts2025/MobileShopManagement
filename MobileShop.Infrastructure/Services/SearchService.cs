using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class SearchService(MobileShopDbContext dbContext) : ISearchService
{
    public async Task<PagedResult<ProductDto>> SearchProductsAsync(
        string searchTerm,
        Guid? categoryId,
        Guid? brandId,
        decimal? minPrice,
        decimal? maxPrice,
        decimal? minRating,
        QueryParameters queryParameters,
        CancellationToken cancellationToken)
    {
        IQueryable<Product> query = dbContext.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .Include(p => p.InventoryStock)
            .Include(p => p.Reviews)
            .AsNoTracking();

        // Text search
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowerTerm = searchTerm.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(lowerTerm) ||
                (p.Description != null && p.Description.ToLower().Contains(lowerTerm)) ||
                p.Sku.ToLower().Contains(lowerTerm));
        }

        // Category filter
        if (categoryId.HasValue && categoryId != Guid.Empty)
        {
            query = query.Where(p => p.CategoryId == categoryId);
        }

        // Brand filter
        if (brandId.HasValue && brandId != Guid.Empty)
        {
            query = query.Where(p => p.BrandId == brandId);
        }

        // Price range filter
        if (minPrice.HasValue)
        {
            query = query.Where(p => p.Price >= minPrice);
        }

        if (maxPrice.HasValue)
        {
            query = query.Where(p => p.Price <= maxPrice);
        }

        // Filter by rating
        if (minRating.HasValue && minRating > 0)
        {
            query = query.Where(p =>
                p.Reviews.Any() &&
                p.Reviews.Average(r => (decimal)r.Rating) >= minRating);
        }

        // Only active products
        query = query.Where(p => p.IsActive);

        // Sorting
        query = queryParameters.SortBy?.ToLowerInvariant() switch
        {
            "price" => queryParameters.SortDescending ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
            "name" => queryParameters.SortDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "rating" => queryParameters.SortDescending
                ? query.OrderByDescending(p => p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0)
                : query.OrderBy(p => p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0),
            "newest" => query.OrderByDescending(p => p.CreatedAtUtc),
            _ => query.OrderBy(p => p.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Sku = p.Sku,
                Name = p.Name,
                Description = p.Description,
                ProductType = p.ProductType,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                BrandId = p.BrandId,
                BrandName = p.Brand.Name,
                Price = p.Price,
                CostPrice = p.CostPrice,
                TaxPercentage = p.TaxPercentage,
                DiscountAmount = p.DiscountAmount,
                PromoCode = p.PromoCode,
                QuantityOnHand = p.InventoryStock != null ? p.InventoryStock.QuantityOnHand : 0,
                ReorderLevel = p.InventoryStock != null ? p.InventoryStock.ReorderLevel : 0
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<ProductDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<List<string>> GetSearchSuggestionsAsync(string term, int count = 10, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(term) || term.Length < 2)
            return new List<string>();

        var lowerTerm = term.ToLower();

        var suggestions = await dbContext.Products
            .AsNoTracking()
            .Where(p => p.Name.ToLower().Contains(lowerTerm) && p.IsActive)
            .Select(p => p.Name)
            .Distinct()
            .Take(count)
            .ToListAsync(cancellationToken);

        return suggestions;
    }

    public async Task<Dictionary<string, int>> GetCategoryFiltersAsync(CancellationToken cancellationToken)
    {
        var categories = await dbContext.Products
            .AsNoTracking()
            .Where(p => p.IsActive)
            .GroupBy(p => p.Category.Name)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return categories.ToDictionary(x => x.Name, x => x.Count);
    }

    public async Task<Dictionary<string, int>> GetBrandFiltersAsync(CancellationToken cancellationToken)
    {
        var brands = await dbContext.Products
            .AsNoTracking()
            .Where(p => p.IsActive)
            .GroupBy(p => p.Brand.Name)
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return brands.ToDictionary(x => x.Name, x => x.Count);
    }

    public async Task<List<decimal>> GetPriceRangesAsync(CancellationToken cancellationToken)
    {
        var prices = await dbContext.Products
            .AsNoTracking()
            .Where(p => p.IsActive)
            .Select(p => p.Price)
            .OrderBy(p => p)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (!prices.Any())
            return new List<decimal>();

        // Return price ranges: min, 25%, 50%, 75%, max
        var result = new List<decimal>
        {
            prices.First(),
            prices[prices.Count / 4],
            prices[prices.Count / 2],
            prices[prices.Count * 3 / 4],
            prices.Last()
        };

        return result.Distinct().ToList();
    }
}
