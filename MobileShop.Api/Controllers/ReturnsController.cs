using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Returns;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ReturnsController(IReturnService returnService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> GetReturns([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await returnService.GetReturnsAsync(queryParameters, cancellationToken));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Operator,Customer")]
    public async Task<IActionResult> CreateReturn([FromBody] CreateReturnRequest request, CancellationToken cancellationToken) =>
        Ok(await returnService.CreateReturnAsync(request, User.Identity?.Name ?? "api", cancellationToken));

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> UpdateReturnStatus(Guid id, [FromBody] UpdateReturnStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await returnService.UpdateReturnStatusAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}
