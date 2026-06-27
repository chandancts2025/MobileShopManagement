using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class ReviewService(MobileShopDbContext dbContext) : IReviewService
{
    public async Task<PagedResult<ProductReviewDto>> GetProductReviewsAsync(Guid productId, QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        IQueryable<ProductReview> query = dbContext.ProductReviews
            .Include(r => r.Product)
            .Include(r => r.CustomerProfile)
            .ThenInclude(c => c.User)
            .Where(r => r.ProductId == productId && r.IsApproved)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(r => r.Title.Contains(queryParameters.Search) || r.Comment.Contains(queryParameters.Search));
        }

        query = queryParameters.SortBy?.ToLowerInvariant() switch
        {
            "rating" => queryParameters.SortDescending ? query.OrderByDescending(r => r.Rating) : query.OrderBy(r => r.Rating),
            "helpful" => queryParameters.SortDescending ? query.OrderByDescending(r => r.HelpfulCount) : query.OrderBy(r => r.HelpfulCount),
            _ => queryParameters.SortDescending ? query.OrderByDescending(r => r.CreatedAtUtc) : query.OrderBy(r => r.CreatedAtUtc)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(r => MapToDto(r))
            .ToListAsync(cancellationToken);

        return new PagedResult<ProductReviewDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<PagedResult<ProductReviewDto>> GetCustomerReviewsAsync(Guid customerProfileId, QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        IQueryable<ProductReview> query = dbContext.ProductReviews
            .Include(r => r.Product)
            .Include(r => r.CustomerProfile)
            .ThenInclude(c => c.User)
            .Where(r => r.CustomerProfileId == customerProfileId)
            .AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(r => MapToDto(r))
            .ToListAsync(cancellationToken);

        return new PagedResult<ProductReviewDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<ProductReviewDto?> GetReviewAsync(Guid reviewId, CancellationToken cancellationToken)
    {
        return await dbContext.ProductReviews
            .Include(r => r.Product)
            .Include(r => r.CustomerProfile)
            .ThenInclude(c => c.User)
            .Include(r => r.Images)
            .Where(r => r.Id == reviewId)
            .Select(r => MapToDto(r))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<ProductReviewDto> CreateReviewAsync(CreateReviewRequest request, Guid customerProfileId, string performedBy, CancellationToken cancellationToken)
    {
        var product = await dbContext.Products.FindAsync(new object?[] { request.ProductId }, cancellationToken);
        if (product == null)
            throw new ArgumentException("Product not found");

        var review = new ProductReview
        {
            ProductId = request.ProductId,
            CustomerProfileId = customerProfileId,
            Rating = request.Rating,
            Title = request.Title,
            Comment = request.Comment,
            IsVerifiedPurchase = await IsVerifiedPurchaseAsync(customerProfileId, request.ProductId, cancellationToken),
            IsApproved = false,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = performedBy
        };

        if (request.ImageUrls?.Any() == true)
        {
            foreach (var imageUrl in request.ImageUrls)
            {
                review.Images.Add(new ReviewImage
                {
                    ImageUrl = imageUrl,
                    CreatedAtUtc = DateTime.UtcNow,
                    CreatedBy = performedBy
                });
            }
        }

        dbContext.ProductReviews.Add(review);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetReviewAsync(review.Id, cancellationToken)
            ?? throw new InvalidOperationException("Failed to retrieve created review");
    }

    public async Task<ProductReviewDto?> UpdateReviewAsync(Guid reviewId, UpdateReviewRequest request, Guid customerProfileId, string performedBy, CancellationToken cancellationToken)
    {
        var review = await dbContext.ProductReviews
            .Include(r => r.Images)
            .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

        if (review == null || review.CustomerProfileId != customerProfileId)
            return null;

        review.Rating = request.Rating;
        review.Title = request.Title;
        review.Comment = request.Comment;
        review.UpdatedAtUtc = DateTime.UtcNow;
        review.UpdatedBy = performedBy;

        // Update images
        dbContext.ReviewImages.RemoveRange(review.Images);

        if (request.ImageUrls?.Any() == true)
        {
            foreach (var imageUrl in request.ImageUrls)
            {
                review.Images.Add(new ReviewImage
                {
                    ImageUrl = imageUrl,
                    CreatedAtUtc = DateTime.UtcNow,
                    CreatedBy = performedBy
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetReviewAsync(reviewId, cancellationToken);
    }

    public async Task<bool> DeleteReviewAsync(Guid reviewId, Guid customerProfileId, string performedBy, CancellationToken cancellationToken)
    {
        var review = await dbContext.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.CustomerProfileId == customerProfileId, cancellationToken);

        if (review == null)
            return false;

        dbContext.ProductReviews.Remove(review);
        await dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<ReviewSummaryDto> GetReviewSummaryAsync(Guid productId, CancellationToken cancellationToken)
    {
        var reviews = await dbContext.ProductReviews
            .Where(r => r.ProductId == productId && r.IsApproved)
            .ToListAsync(cancellationToken);

        if (!reviews.Any())
            return new ReviewSummaryDto();

        var ratingDistribution = new Dictionary<int, int>();
        for (int i = 1; i <= 5; i++)
            ratingDistribution[i] = reviews.Count(r => r.Rating == i);

        return new ReviewSummaryDto
        {
            AverageRating = (decimal)Math.Round(reviews.Average(r => r.Rating), 2),
            TotalReviews = reviews.Count,
            VerifiedPurchaseCount = reviews.Count(r => r.IsVerifiedPurchase),
            RatingDistribution = ratingDistribution
        };
    }

    public async Task<bool> MarkHelpfulAsync(Guid reviewId, CancellationToken cancellationToken)
    {
        var review = await dbContext.ProductReviews.FindAsync(new object?[] { reviewId }, cancellationToken);
        if (review == null)
            return false;

        review.HelpfulCount++;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> MarkUnhelpfulAsync(Guid reviewId, CancellationToken cancellationToken)
    {
        var review = await dbContext.ProductReviews.FindAsync(new object?[] { reviewId }, cancellationToken);
        if (review == null)
            return false;

        review.UnhelpfulCount++;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ApproveReviewAsync(Guid reviewId, string performedBy, CancellationToken cancellationToken)
    {
        var review = await dbContext.ProductReviews.FindAsync(new object?[] { reviewId }, cancellationToken);
        if (review == null)
            return false;

        review.IsApproved = true;
        review.UpdatedBy = performedBy;
        review.UpdatedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RejectReviewAsync(Guid reviewId, string performedBy, CancellationToken cancellationToken)
    {
        var review = await dbContext.ProductReviews.FindAsync(new object?[] { reviewId }, cancellationToken);
        if (review == null)
            return false;

        dbContext.ProductReviews.Remove(review);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<bool> IsVerifiedPurchaseAsync(Guid customerProfileId, Guid productId, CancellationToken cancellationToken)
    {
        return await dbContext.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.CustomerProfileId == customerProfileId)
            .AnyAsync(o => o.Items.Any(oi => oi.ProductId == productId), cancellationToken);
    }

    private static ProductReviewDto MapToDto(ProductReview r)
    {
        return new ProductReviewDto
        {
            Id = r.Id,
            ProductId = r.ProductId,
            ProductName = r.Product.Name,
            CustomerProfileId = r.CustomerProfileId,
            CustomerName = r.CustomerProfile.User.FirstName + " " + r.CustomerProfile.User.LastName,
            Rating = r.Rating,
            Title = r.Title,
            Comment = r.Comment,
            IsVerifiedPurchase = r.IsVerifiedPurchase,
            HelpfulCount = r.HelpfulCount,
            UnhelpfulCount = r.UnhelpfulCount,
            IsApproved = r.IsApproved,
            ImageUrls = r.Images.Select(i => i.ImageUrl).ToList(),
            CreatedAtUtc = r.CreatedAtUtc
        };
    }
}
