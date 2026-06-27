using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Orders;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class WishlistService(MobileShopDbContext dbContext) : IWishlistService
{
    public async Task<PagedResult<WishlistItemDto>> GetCustomerWishlistAsync(Guid customerProfileId, QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        IQueryable<WishlistItem> query = dbContext.WishlistItems
            .Include(w => w.Product)
            .Where(w => w.CustomerProfileId == customerProfileId)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(w => w.Product.Name.Contains(queryParameters.Search) || w.Product.Sku.Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(w => w.CreatedAtUtc)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(w => MapToDto(w))
            .ToListAsync(cancellationToken);

        return new PagedResult<WishlistItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<WishlistItemDto?> GetWishlistItemAsync(Guid wishlistItemId, CancellationToken cancellationToken)
    {
        return await dbContext.WishlistItems
            .Include(w => w.Product)
            .Where(w => w.Id == wishlistItemId)
            .Select(w => MapToDto(w))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<WishlistItemDto> AddToWishlistAsync(Guid customerProfileId, AddToWishlistRequest request, string performedBy, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.FindAsync(new object?[] { request.ProductId }, cancellationToken);
        if (product == null)
            throw new ArgumentException("Product not found");

        var existingItem = await dbContext.WishlistItems
            .Include(w => w.Product)
            .FirstOrDefaultAsync(w => w.CustomerProfileId == customerProfileId && w.ProductId == request.ProductId, cancellationToken);

        if (existingItem != null)
            return MapToDto(existingItem);

        var wishlistItem = new WishlistItem
        {
            CustomerProfileId = customerProfileId,
            ProductId = request.ProductId,
            PriceWhenAdded = product.Price,
            NotifyAtPrice = request.NotifyAtPrice,
            ShouldNotifyOnPriceChange = request.ShouldNotifyOnPriceChange,
            Product = product,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = performedBy
        };

        dbContext.WishlistItems.Add(wishlistItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        return MapToDto(wishlistItem);
    }

    public async Task<bool> RemoveFromWishlistAsync(Guid wishlistItemId, Guid customerProfileId, string performedBy, CancellationToken cancellationToken)
    {
        var item = await dbContext.WishlistItems
            .Include(w => w.Product)
            .FirstOrDefaultAsync(w => w.Id == wishlistItemId && w.CustomerProfileId == customerProfileId, cancellationToken);

        if (item == null)
            return false;

        dbContext.WishlistItems.Remove(item);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<WishlistItemDto?> UpdateWishlistItemAsync(Guid wishlistItemId, UpdateWishlistItemRequest request, Guid customerProfileId, string performedBy, CancellationToken cancellationToken)
    {
        var item = await dbContext.WishlistItems
            .FirstOrDefaultAsync(w => w.Id == wishlistItemId && w.CustomerProfileId == customerProfileId, cancellationToken);

        if (item == null)
            return null;

        item.NotifyAtPrice = request.NotifyAtPrice;
        item.ShouldNotifyOnPriceChange = request.ShouldNotifyOnPriceChange;
        item.UpdatedBy = performedBy;
        item.UpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return MapToDto(item);
    }

    public async Task<bool> IsProductInWishlistAsync(Guid customerProfileId, Guid productId, CancellationToken cancellationToken)
    {
        return await dbContext.WishlistItems
            .AnyAsync(w => w.CustomerProfileId == customerProfileId && w.ProductId == productId, cancellationToken);
    }

    public async Task<WishlistSummaryDto> GetWishlistSummaryAsync(Guid customerProfileId, CancellationToken cancellationToken)
    {
        var items = await dbContext.WishlistItems
            .Include(w => w.Product)
            .Where(w => w.CustomerProfileId == customerProfileId)
            .ToListAsync(cancellationToken);

        var totalValue = items.Sum(w => w.Product.Price);
        var itemsWithPriceDrop = items.Count(w => w.Product.Price < w.PriceWhenAdded);

        return new WishlistSummaryDto
        {
            TotalItems = items.Count,
            TotalValue = totalValue,
            ItemsWithPriceDrop = itemsWithPriceDrop
        };
    }

    public async Task ClearWishlistAsync(Guid customerProfileId, string performedBy, CancellationToken cancellationToken)
    {
        var items = await dbContext.WishlistItems
            .Where(w => w.CustomerProfileId == customerProfileId)
            .ToListAsync(cancellationToken);

        dbContext.WishlistItems.RemoveRange(items);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task CheckAndNotifyPriceDropsAsync(CancellationToken cancellationToken)
    {
        var wishlistItems = await dbContext.WishlistItems
            .Include(w => w.Product)
            .Include(w => w.CustomerProfile)
            .Where(w => w.ShouldNotifyOnPriceChange && w.Product.Price < w.PriceWhenAdded)
            .ToListAsync(cancellationToken);

        // This would integrate with notification service in real implementation
        foreach (var item in wishlistItems)
        {
            item.PriceWhenAdded = item.Product.Price;
            item.UpdatedAtUtc = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static WishlistItemDto MapToDto(WishlistItem w)
    {
        return new WishlistItemDto
        {
            Id = w.Id,
            ProductId = w.ProductId,
            ProductName = w.Product.Name,
            Sku = w.Product.Sku,
            CurrentPrice = w.Product.Price,
            PriceWhenAdded = w.PriceWhenAdded,
            NotifyAtPrice = w.NotifyAtPrice,
            ShouldNotifyOnPriceChange = w.ShouldNotifyOnPriceChange,
            ViewCount = w.ViewCount,
            LastViewedUtc = w.LastViewedUtc,
            AddedAtUtc = w.CreatedAtUtc
        };
    }
}
