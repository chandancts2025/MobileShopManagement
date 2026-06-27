using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Billing;

namespace MobileShop.Application.Interfaces.Services;

public interface IBillingService
{
    Task<PagedResult<BillDto>> GetBillsAsync(QueryParameters queryParameters, Guid? customerProfileId = null, CancellationToken cancellationToken = default);
    Task<BillDto?> GetBillAsync(Guid billId, Guid? customerProfileId = null, CancellationToken cancellationToken = default);
    Task<BillDto?> EnsureBillForOrderAsync(Guid orderId, Guid? customerProfileId, string performedBy, CancellationToken cancellationToken = default);
    Task<BillDto> CreateBillAsync(CreateBillRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<BillDto?> UpdateBillAsync(Guid billId, UpdateBillRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> MarkBillPaidAsync(Guid billId, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteBillAsync(Guid billId, CancellationToken cancellationToken = default);
}
