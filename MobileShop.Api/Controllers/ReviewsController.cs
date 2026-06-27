using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileShop.Api.Extensions;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController(IReviewService reviewService, MobileShopDbContext dbContext) : ControllerBase
{
    [HttpGet("product/{productId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProductReviews(Guid productId, [FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        return Ok(await reviewService.GetProductReviewsAsync(productId, queryParameters, cancellationToken));
    }

    [HttpGet("customer")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> GetCustomerReviews([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        var customerProfile = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfile == null)
            return BadRequest("Customer profile not found");

        return Ok(await reviewService.GetCustomerReviewsAsync(customerProfile.Value, queryParameters, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReview(Guid id, CancellationToken cancellationToken)
    {
        var review = await reviewService.GetReviewAsync(id, cancellationToken);
        return review is null ? NotFound() : Ok(review);
    }

    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request, CancellationToken cancellationToken)
    {
        var customerProfile = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfile == null)
            return BadRequest("Customer profile not found");

        var performedBy = User.Identity?.Name ?? "api";
        var result = await reviewService.CreateReviewAsync(request, customerProfile.Value, performedBy, cancellationToken);
        return CreatedAtAction(nameof(GetReview), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> UpdateReview(Guid id, [FromBody] UpdateReviewRequest request, CancellationToken cancellationToken)
    {
        var customerProfile = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfile == null)
            return BadRequest("Customer profile not found");

        var performedBy = User.Identity?.Name ?? "api";
        var result = await reviewService.UpdateReviewAsync(id, request, customerProfile.Value, performedBy, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> DeleteReview(Guid id, CancellationToken cancellationToken)
    {
        var customerProfile = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfile == null)
            return BadRequest("Customer profile not found");

        var performedBy = User.Identity?.Name ?? "api";
        return await reviewService.DeleteReviewAsync(id, customerProfile.Value, performedBy, cancellationToken) ? NoContent() : NotFound();
    }

    [HttpGet("summary/{productId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReviewSummary(Guid productId, CancellationToken cancellationToken)
    {
        return Ok(await reviewService.GetReviewSummaryAsync(productId, cancellationToken));
    }

    [HttpPost("{id:guid}/helpful")]
    [AllowAnonymous]
    public async Task<IActionResult> MarkHelpful(Guid id, CancellationToken cancellationToken)
    {
        return await reviewService.MarkHelpfulAsync(id, cancellationToken) ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/unhelpful")]
    [AllowAnonymous]
    public async Task<IActionResult> MarkUnhelpful(Guid id, CancellationToken cancellationToken)
    {
        return await reviewService.MarkUnhelpfulAsync(id, cancellationToken) ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> ApproveReview(Guid id, CancellationToken cancellationToken)
    {
        var performedBy = User.Identity?.Name ?? "api";
        return await reviewService.ApproveReviewAsync(id, performedBy, cancellationToken) ? Ok() : NotFound();
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> RejectReview(Guid id, CancellationToken cancellationToken)
    {
        var performedBy = User.Identity?.Name ?? "api";
        return await reviewService.RejectReviewAsync(id, performedBy, cancellationToken) ? Ok() : NotFound();
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
