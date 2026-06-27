using MobileShop.Application.DTOs.Payments;

namespace MobileShop.Application.Interfaces.Services;

public interface IInvoiceService
{
    Task<InvoiceDto?> GetInvoiceByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<InvoiceDto?> GetInvoiceByOrderKeyAsync(string orderKey, CancellationToken cancellationToken = default);
}
