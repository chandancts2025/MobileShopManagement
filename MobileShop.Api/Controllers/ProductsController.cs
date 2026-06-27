using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductService productService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetProducts([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        return Ok(await productService.GetProductsAsync(queryParameters, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProduct(Guid id, CancellationToken cancellationToken)
    {
        var product = await productService.GetProductAsync(id, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreateProduct([FromBody] UpsertProductRequest request, CancellationToken cancellationToken)
    {
        var performedBy = User.Identity?.Name ?? "api";
        var result = await productService.CreateProductAsync(request, performedBy, cancellationToken);
        return CreatedAtAction(nameof(GetProduct), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] UpsertProductRequest request, CancellationToken cancellationToken)
    {
        var performedBy = User.Identity?.Name ?? "api";
        var result = await productService.UpdateProductAsync(id, request, performedBy, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteProduct(Guid id, CancellationToken cancellationToken)
    {
        return await productService.DeleteProductAsync(id, cancellationToken) ? NoContent() : NotFound();
    }
}
