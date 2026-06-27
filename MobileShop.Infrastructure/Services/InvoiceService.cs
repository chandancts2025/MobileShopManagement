using Microsoft.EntityFrameworkCore;
using MobileShop.Application.DTOs.Payments;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class InvoiceService(MobileShopDbContext dbContext) : IInvoiceService
{
    public async Task<InvoiceDto?> GetInvoiceByOrderIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Invoices
            .Where(x => x.OrderId == orderId)
            .Select(x => new InvoiceDto
            {
                Id = x.Id,
                OrderId = x.OrderId,
                InvoiceNumber = x.InvoiceNumber,
                IssuedAtUtc = x.IssuedAtUtc
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<InvoiceDto?> GetInvoiceByOrderKeyAsync(string orderKey, CancellationToken cancellationToken = default)
    {
        if (Guid.TryParse(orderKey, out var orderId))
        {
            return await GetInvoiceByOrderIdAsync(orderId, cancellationToken);
        }

        return await dbContext.Invoices
            .Where(x => x.Order.OrderNumber == orderKey)
            .Select(x => new InvoiceDto
            {
                Id = x.Id,
                OrderId = x.OrderId,
                InvoiceNumber = x.InvoiceNumber,
                IssuedAtUtc = x.IssuedAtUtc
            })
            .FirstOrDefaultAsync(cancellationToken);
    }
}
