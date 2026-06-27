using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;

namespace MobileShop.Application.Interfaces.Services;

public interface IReviewService
{
    Task<PagedResult<ProductReviewDto>> GetProductReviewsAsync(Guid productId, QueryParameters queryParameters, CancellationToken cancellationToken);
    Task<PagedResult<ProductReviewDto>> GetCustomerReviewsAsync(Guid customerProfileId, QueryParameters queryParameters, CancellationToken cancellationToken);
    Task<ProductReviewDto?> GetReviewAsync(Guid reviewId, CancellationToken cancellationToken);
    Task<ProductReviewDto> CreateReviewAsync(CreateReviewRequest request, Guid customerProfileId, string performedBy, CancellationToken cancellationToken);
    Task<ProductReviewDto?> UpdateReviewAsync(Guid reviewId, UpdateReviewRequest request, Guid customerProfileId, string performedBy, CancellationToken cancellationToken);
    Task<bool> DeleteReviewAsync(Guid reviewId, Guid customerProfileId, string performedBy, CancellationToken cancellationToken);
    Task<ReviewSummaryDto> GetReviewSummaryAsync(Guid productId, CancellationToken cancellationToken);
    Task<bool> MarkHelpfulAsync(Guid reviewId, CancellationToken cancellationToken);
    Task<bool> MarkUnhelpfulAsync(Guid reviewId, CancellationToken cancellationToken);
    Task<bool> ApproveReviewAsync(Guid reviewId, string performedBy, CancellationToken cancellationToken);
    Task<bool> RejectReviewAsync(Guid reviewId, string performedBy, CancellationToken cancellationToken);
}
