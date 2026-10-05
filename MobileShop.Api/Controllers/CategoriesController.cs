using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator")]
[Route("api/[controller]")]
public class CategoriesController(ILookupService lookupService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await lookupService.GetCategoriesAsync(queryParameters, cancellationToken));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] UpsertLookupRequest request, CancellationToken cancellationToken)
    {
        var result = await lookupService.CreateCategoryAsync(request, User.Identity?.Name ?? "api", cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpsertLookupRequest request, CancellationToken cancellationToken)
    {
        var result = await lookupService.UpdateCategoryAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteCategory(Guid id, CancellationToken cancellationToken) =>
        await lookupService.DeleteCategoryAsync(id, cancellationToken) ? NoContent() : NotFound();
}
