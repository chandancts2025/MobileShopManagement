using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.PurchaseOrders;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator")]
[Route("api/[controller]")]
public class PurchaseOrdersController(IPurchaseOrderService purchaseOrderService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPurchaseOrders([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await purchaseOrderService.GetPurchaseOrdersAsync(queryParameters, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPurchaseOrder(Guid id, CancellationToken cancellationToken)
    {
        var purchaseOrder = await purchaseOrderService.GetPurchaseOrderAsync(id, cancellationToken);
        return purchaseOrder is null ? NotFound() : Ok(purchaseOrder);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CreatePurchaseOrder([FromBody] CreatePurchaseOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await purchaseOrderService.CreatePurchaseOrderAsync(request, User.Identity?.Name ?? "api", cancellationToken);
        return CreatedAtAction(nameof(GetPurchaseOrder), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/receive")]
    public async Task<IActionResult> ReceivePurchaseOrder(Guid id, [FromBody] ReceivePurchaseOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await purchaseOrderService.ReceivePurchaseOrderAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> CancelPurchaseOrder(Guid id, CancellationToken cancellationToken) =>
        await purchaseOrderService.CancelPurchaseOrderAsync(id, User.Identity?.Name ?? "api", cancellationToken) ? NoContent() : NotFound();
}
