using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class AuditLogService(MobileShopDbContext dbContext) : IAuditLogService
{
    public async Task LogAsync(string entityName, string action, string performedBy, string? payload = null, CancellationToken cancellationToken = default)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            EntityName = entityName,
            Action = action,
            PerformedBy = performedBy,
            Payload = payload
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResult<AuditLog>> GetAuditLogsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.AuditLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.EntityName.Contains(queryParameters.Search) || x.Action.Contains(queryParameters.Search) || x.PerformedBy.Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<AuditLog>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }
}
