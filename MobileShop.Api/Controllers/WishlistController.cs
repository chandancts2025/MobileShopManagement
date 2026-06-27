using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileShop.Api.Extensions;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Orders;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class WishlistController(IWishlistService wishlistService, MobileShopDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetWishlist([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        return Ok(await wishlistService.GetCustomerWishlistAsync(customerProfileId.Value, queryParameters, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWishlistItem(Guid id, CancellationToken cancellationToken)
    {
        var item = await wishlistService.GetWishlistItemAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> AddToWishlist([FromBody] AddToWishlistRequest request, CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        var performedBy = User.Identity?.Name ?? "api";
        var result = await wishlistService.AddToWishlistAsync(customerProfileId.Value, request, performedBy, cancellationToken);
        return CreatedAtAction(nameof(GetWishlistItem), new { id = result.Id }, result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> RemoveFromWishlist(Guid id, CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        var performedBy = User.Identity?.Name ?? "api";
        return await wishlistService.RemoveFromWishlistAsync(id, customerProfileId.Value, performedBy, cancellationToken) ? NoContent() : NotFound();
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateWishlistItem(Guid id, [FromBody] UpdateWishlistItemRequest request, CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        var performedBy = User.Identity?.Name ?? "api";
        var result = await wishlistService.UpdateWishlistItemAsync(id, request, customerProfileId.Value, performedBy, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("check/{productId:guid}")]
    public async Task<IActionResult> IsInWishlist(Guid productId, CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        var isInWishlist = await wishlistService.IsProductInWishlistAsync(customerProfileId.Value, productId, cancellationToken);
        return Ok(new { isInWishlist });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetWishlistSummary(CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        return Ok(await wishlistService.GetWishlistSummaryAsync(customerProfileId.Value, cancellationToken));
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> ClearWishlist(CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        var performedBy = User.Identity?.Name ?? "api";
        await wishlistService.ClearWishlistAsync(customerProfileId.Value, performedBy, cancellationToken);
        return NoContent();
    }

    private async Task<Guid?> GetCustomerProfileIdAsync(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId.HasValue)
        {
            var profileId = await dbContext.CustomerProfiles
                .AsNoTracking()
                .Where(x => x.UserId == userId.Value && !x.IsDeleted)
                .Select(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (profileId != Guid.Empty)
            {
                return profileId;
            }
        }

        var email = User.GetEmail();
        if (!string.IsNullOrWhiteSpace(email))
        {
            var profileId = await dbContext.CustomerProfiles
                .AsNoTracking()
                .Where(x => x.User.Email == email && !x.IsDeleted)
                .Select(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (profileId != Guid.Empty)
            {
                return profileId;
            }
        }

        return null;
    }
}
