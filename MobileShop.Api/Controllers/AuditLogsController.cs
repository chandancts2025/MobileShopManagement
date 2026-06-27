using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin")]
[Route("api/[controller]")]
public class AuditLogsController(IAuditLogService auditLogService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAuditLogs([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await auditLogService.GetAuditLogsAsync(queryParameters, cancellationToken));
}
