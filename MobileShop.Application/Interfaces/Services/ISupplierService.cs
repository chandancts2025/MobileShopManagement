using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Suppliers;

namespace MobileShop.Application.Interfaces.Services;

public interface ISupplierService
{
    Task<PagedResult<SupplierDto>> GetSuppliersAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<SupplierDto?> GetSupplierAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SupplierDto> CreateSupplierAsync(UpsertSupplierRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<SupplierDto?> UpdateSupplierAsync(Guid id, UpsertSupplierRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteSupplierAsync(Guid id, string performedBy, CancellationToken cancellationToken = default);
}
