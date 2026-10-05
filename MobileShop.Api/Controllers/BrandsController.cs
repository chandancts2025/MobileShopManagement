using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator")]
[Route("api/[controller]")]
public class BrandsController(ILookupService lookupService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetBrands([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await lookupService.GetBrandsAsync(queryParameters, cancellationToken));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreateBrand([FromBody] UpsertLookupRequest request, CancellationToken cancellationToken)
    {
        var result = await lookupService.CreateBrandAsync(request, User.Identity?.Name ?? "api", cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> UpdateBrand(Guid id, [FromBody] UpsertLookupRequest request, CancellationToken cancellationToken)
    {
        var result = await lookupService.UpdateBrandAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteBrand(Guid id, CancellationToken cancellationToken) =>
        await lookupService.DeleteBrandAsync(id, cancellationToken) ? NoContent() : NotFound();
}
