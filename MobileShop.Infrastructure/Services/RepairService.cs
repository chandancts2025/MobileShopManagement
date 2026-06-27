using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Repairs;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class RepairService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : IRepairService
{
    public async Task<PagedResult<RepairTicketDto>> GetRepairTicketsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.RepairTickets.Where(x => !x.IsDeleted).AsNoTracking();

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x =>
                x.TicketNumber.Contains(queryParameters.Search) ||
                x.CustomerName.Contains(queryParameters.Search) ||
                x.PhoneNumber.Contains(queryParameters.Search) ||
                (x.ImeiOrSerialNumber ?? string.Empty).Contains(queryParameters.Search));
        }

        query = queryParameters.SortBy?.ToLowerInvariant() switch
        {
            "status" => queryParameters.SortDescending ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
            "expecteddeliveryutc" => queryParameters.SortDescending ? query.OrderByDescending(x => x.ExpectedDeliveryUtc) : query.OrderBy(x => x.ExpectedDeliveryUtc),
            _ => queryParameters.SortDescending ? query.OrderByDescending(x => x.CreatedAtUtc) : query.OrderBy(x => x.CreatedAtUtc)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var tickets = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<RepairTicketDto>
        {
            Items = tickets.Select(Map).ToList(),
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<RepairTicketDto?> GetRepairTicketAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ticket = await dbContext.RepairTickets
            .Where(x => x.Id == id && !x.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
        return ticket is null ? null : Map(ticket);
    }

    public async Task<RepairTicketDto> CreateRepairTicketAsync(CreateRepairTicketRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        if (request.CustomerProfileId.HasValue)
        {
            var customerExists = await dbContext.CustomerProfiles.AnyAsync(x => x.Id == request.CustomerProfileId && !x.IsDeleted, cancellationToken);
            if (!customerExists)
            {
                throw new InvalidOperationException("Customer profile not found.");
            }
        }

        var ticket = new RepairTicket
        {
            TicketNumber = $"REP-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            CustomerProfileId = request.CustomerProfileId,
            CustomerName = request.CustomerName.Trim(),
            PhoneNumber = request.PhoneNumber,
            DeviceBrand = request.DeviceBrand,
            DeviceModel = request.DeviceModel,
            ImeiOrSerialNumber = request.ImeiOrSerialNumber,
            ProblemDescription = request.ProblemDescription,
            TechnicianNotes = request.TechnicianNotes,
            EstimatedCost = request.EstimatedCost,
            AdvanceAmount = request.AdvanceAmount,
            FinalAmount = request.EstimatedCost,
            Status = RepairTicketStatus.Received,
            ExpectedDeliveryUtc = request.ExpectedDeliveryUtc,
            CreatedBy = performedBy
        };

        dbContext.RepairTickets.Add(ticket);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(RepairTicket), "Create", performedBy, ticket.TicketNumber, cancellationToken);
        return Map(ticket);
    }

    public async Task<RepairTicketDto?> UpdateRepairTicketAsync(Guid id, UpdateRepairTicketRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var ticket = await dbContext.RepairTickets.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (ticket is null)
        {
            return null;
        }

        ticket.CustomerName = request.CustomerName.Trim();
        ticket.PhoneNumber = request.PhoneNumber;
        ticket.DeviceBrand = request.DeviceBrand;
        ticket.DeviceModel = request.DeviceModel;
        ticket.ImeiOrSerialNumber = request.ImeiOrSerialNumber;
        ticket.ProblemDescription = request.ProblemDescription;
        ticket.TechnicianNotes = request.TechnicianNotes;
        ticket.EstimatedCost = request.EstimatedCost;
        ticket.AdvanceAmount = request.AdvanceAmount;
        ticket.FinalAmount = request.FinalAmount;
        ticket.ExpectedDeliveryUtc = request.ExpectedDeliveryUtc;
        ticket.UpdatedAtUtc = DateTime.UtcNow;
        ticket.UpdatedBy = performedBy;

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(RepairTicket), "Update", performedBy, ticket.TicketNumber, cancellationToken);
        return Map(ticket);
    }

    public async Task<RepairTicketDto?> UpdateRepairTicketStatusAsync(Guid id, UpdateRepairTicketStatusRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var ticket = await dbContext.RepairTickets.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (ticket is null)
        {
            return null;
        }

        ticket.Status = request.Status;
        ticket.TechnicianNotes = request.TechnicianNotes ?? ticket.TechnicianNotes;
        ticket.FinalAmount = request.FinalAmount ?? ticket.FinalAmount;
        ticket.CompletedAtUtc = request.Status == RepairTicketStatus.Delivered ? DateTime.UtcNow : ticket.CompletedAtUtc;
        ticket.UpdatedAtUtc = DateTime.UtcNow;
        ticket.UpdatedBy = performedBy;

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(RepairTicket), request.Status.ToString(), performedBy, ticket.TicketNumber, cancellationToken);
        return Map(ticket);
    }

    public async Task<bool> DeleteRepairTicketAsync(Guid id, string performedBy, CancellationToken cancellationToken = default)
    {
        var ticket = await dbContext.RepairTickets.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (ticket is null)
        {
            return false;
        }

        ticket.IsDeleted = true;
        ticket.UpdatedAtUtc = DateTime.UtcNow;
        ticket.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(RepairTicket), "Delete", performedBy, ticket.TicketNumber, cancellationToken);
        return true;
    }

    private static RepairTicketDto Map(RepairTicket ticket) => new()
    {
        Id = ticket.Id,
        TicketNumber = ticket.TicketNumber,
        CustomerProfileId = ticket.CustomerProfileId,
        CustomerName = ticket.CustomerName,
        PhoneNumber = ticket.PhoneNumber,
        DeviceBrand = ticket.DeviceBrand,
        DeviceModel = ticket.DeviceModel,
        ImeiOrSerialNumber = ticket.ImeiOrSerialNumber,
        ProblemDescription = ticket.ProblemDescription,
        TechnicianNotes = ticket.TechnicianNotes,
        EstimatedCost = ticket.EstimatedCost,
        AdvanceAmount = ticket.AdvanceAmount,
        FinalAmount = ticket.FinalAmount,
        Status = ticket.Status,
        ExpectedDeliveryUtc = ticket.ExpectedDeliveryUtc,
        CompletedAtUtc = ticket.CompletedAtUtc,
        CreatedAtUtc = ticket.CreatedAtUtc
    };
}
