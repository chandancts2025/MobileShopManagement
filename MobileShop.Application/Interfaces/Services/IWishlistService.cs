using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Orders;

namespace MobileShop.Application.Interfaces.Services;

public interface IWishlistService
{
    Task<PagedResult<WishlistItemDto>> GetCustomerWishlistAsync(Guid customerProfileId, QueryParameters queryParameters, CancellationToken cancellationToken);
    Task<WishlistItemDto?> GetWishlistItemAsync(Guid wishlistItemId, CancellationToken cancellationToken);
    Task<WishlistItemDto> AddToWishlistAsync(Guid customerProfileId, AddToWishlistRequest request, string performedBy, CancellationToken cancellationToken);
    Task<bool> RemoveFromWishlistAsync(Guid wishlistItemId, Guid customerProfileId, string performedBy, CancellationToken cancellationToken);
    Task<WishlistItemDto?> UpdateWishlistItemAsync(Guid wishlistItemId, UpdateWishlistItemRequest request, Guid customerProfileId, string performedBy, CancellationToken cancellationToken);
    Task<bool> IsProductInWishlistAsync(Guid customerProfileId, Guid productId, CancellationToken cancellationToken);
    Task<WishlistSummaryDto> GetWishlistSummaryAsync(Guid customerProfileId, CancellationToken cancellationToken);
    Task ClearWishlistAsync(Guid customerProfileId, string performedBy, CancellationToken cancellationToken);
    Task CheckAndNotifyPriceDropsAsync(CancellationToken cancellationToken);
}
