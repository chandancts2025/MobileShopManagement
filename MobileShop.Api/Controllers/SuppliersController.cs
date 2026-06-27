using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Suppliers;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator")]
[Route("api/[controller]")]
public class SuppliersController(ISupplierService supplierService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSuppliers([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await supplierService.GetSuppliersAsync(queryParameters, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSupplier(Guid id, CancellationToken cancellationToken)
    {
        var supplier = await supplierService.GetSupplierAsync(id, cancellationToken);
        return supplier is null ? NotFound() : Ok(supplier);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreateSupplier([FromBody] UpsertSupplierRequest request, CancellationToken cancellationToken)
    {
        var result = await supplierService.CreateSupplierAsync(request, User.Identity?.Name ?? "api", cancellationToken);
        return CreatedAtAction(nameof(GetSupplier), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> UpdateSupplier(Guid id, [FromBody] UpsertSupplierRequest request, CancellationToken cancellationToken)
    {
        var result = await supplierService.UpdateSupplierAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteSupplier(Guid id, CancellationToken cancellationToken) =>
        await supplierService.DeleteSupplierAsync(id, User.Identity?.Name ?? "api", cancellationToken) ? NoContent() : NotFound();
}
