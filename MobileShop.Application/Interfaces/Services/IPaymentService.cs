using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Payments;

namespace MobileShop.Application.Interfaces.Services;

public interface IPaymentService
{
    Task<PagedResult<PaymentDto>> GetPaymentsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<PaymentDto> CreatePaymentAsync(CreatePaymentRequest request, string performedBy, CancellationToken cancellationToken = default);
}
