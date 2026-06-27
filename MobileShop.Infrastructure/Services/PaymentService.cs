using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Payments;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class PaymentService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : IPaymentService
{
    public async Task<PagedResult<PaymentDto>> GetPaymentsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Payments.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.PaymentMethod.Contains(queryParameters.Search) || (x.TransactionReference ?? string.Empty).Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.CreatedAtUtc)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new PaymentDto
            {
                Id = x.Id,
                OrderId = x.OrderId,
                Amount = x.Amount,
                PaymentMethod = x.PaymentMethod,
                Status = x.Status,
                TransactionReference = x.TransactionReference,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<PaymentDto> { Items = items, TotalCount = totalCount, PageNumber = queryParameters.PageNumber, PageSize = queryParameters.PageSize };
    }

    public async Task<PaymentDto> CreatePaymentAsync(CreatePaymentRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var order = await dbContext.Orders
            .Include(x => x.Invoice)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == request.OrderId, cancellationToken)
            ?? throw new InvalidOperationException("Order not found.");

        var paidAmount = order.Payments
            .Where(x => x.Status == PaymentStatus.Paid || x.Status == PaymentStatus.Authorized)
            .Sum(x => x.Amount);

        if (request.Status is PaymentStatus.Paid or PaymentStatus.Authorized && paidAmount + request.Amount > order.TotalAmount)
        {
            throw new InvalidOperationException("Payment exceeds order balance.");
        }

        var payment = new Payment
        {
            OrderId = request.OrderId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            Status = request.Status,
            TransactionReference = request.TransactionReference,
            CreatedBy = performedBy
        };

        dbContext.Payments.Add(payment);

        if (order.Invoice is null)
        {
            dbContext.Invoices.Add(new Invoice
            {
                OrderId = order.Id,
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMddHHmmss}",
                CreatedBy = performedBy
            });
        }

        if (request.Status == PaymentStatus.Paid && paidAmount + request.Amount >= order.TotalAmount)
        {
            order.Status = OrderStatus.Confirmed;
            order.UpdatedAtUtc = DateTime.UtcNow;
            order.UpdatedBy = performedBy;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Payment), "Create", performedBy, payment.TransactionReference, cancellationToken);

        return new PaymentDto
        {
            Id = payment.Id,
            OrderId = payment.OrderId,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            Status = payment.Status,
            TransactionReference = payment.TransactionReference,
            CreatedAtUtc = payment.CreatedAtUtc
        };
    }
}
