using MobileShop.Application.Common;
using MobileShop.Domain.Entities;

namespace MobileShop.Application.Interfaces.Services;

public interface IAuditLogService
{
    Task LogAsync(string entityName, string action, string performedBy, string? payload = null, CancellationToken cancellationToken = default);
    Task<PagedResult<AuditLog>> GetAuditLogsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
}
