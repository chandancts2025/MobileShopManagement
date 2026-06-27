using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Inventory;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator")]
[Route("api/[controller]")]
public class InventoryController(IInventoryService inventoryService) : ControllerBase
{
    [HttpGet("stocks")]
    public async Task<IActionResult> GetStocks([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await inventoryService.GetStocksAsync(queryParameters, cancellationToken));

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await inventoryService.GetTransactionsAsync(queryParameters, cancellationToken));

    [HttpPost("receive")]
    public async Task<IActionResult> ReceiveStock([FromBody] StockReceiveRequest request, CancellationToken cancellationToken) =>
        await inventoryService.ReceiveStockAsync(request, User.Identity?.Name ?? "api", cancellationToken) ? Ok() : NotFound();

    [HttpPost("adjustment")]
    public async Task<IActionResult> AdjustStock([FromBody] StockAdjustmentRequest request, CancellationToken cancellationToken) =>
        await inventoryService.AdjustStockAsync(request, User.Identity?.Name ?? "api", cancellationToken) ? Ok() : NotFound();
}
