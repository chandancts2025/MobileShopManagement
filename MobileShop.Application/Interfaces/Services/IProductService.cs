using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;

namespace MobileShop.Application.Interfaces.Services;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetProductsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<ProductDto?> GetProductAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProductDto> CreateProductAsync(UpsertProductRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<ProductDto?> UpdateProductAsync(Guid id, UpsertProductRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default);
}
