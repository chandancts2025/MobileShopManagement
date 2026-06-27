using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator")]
[Route("api/[controller]")]
public class ReportsController(IReportService reportService) : ControllerBase
{
    [HttpGet("dashboard-summary")]
    public async Task<IActionResult> GetDashboardSummary(CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetDashboardSummaryAsync(cancellationToken));
    }

    [HttpGet("sales-by-brand")]
    public async Task<IActionResult> GetSalesByBrand(CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetSalesByBrandAsync(cancellationToken));
    }

    [HttpGet("sales-by-date")]
    public async Task<IActionResult> GetSalesByDate([FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc, CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetSalesByDateAsync(fromUtc, toUtc, cancellationToken));
    }

    [HttpGet("sales-by-category")]
    public async Task<IActionResult> GetSalesByCategory(CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetSalesByCategoryAsync(cancellationToken));
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock(CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetLowStockAsync(cancellationToken));
    }

    [HttpGet("tax-report")]
    public async Task<IActionResult> GetTaxReport([FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc, CancellationToken cancellationToken)
    {
        return Ok(new { taxCollected = await reportService.GetTaxCollectionAsync(fromUtc, toUtc, cancellationToken) });
    }

    [HttpGet("expenses-by-category")]
    public async Task<IActionResult> GetExpensesByCategory([FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc, CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetExpensesByCategoryAsync(fromUtc, toUtc, cancellationToken));
    }

    [HttpGet("daily-cash-summary")]
    public async Task<IActionResult> GetDailyCashSummary([FromQuery] DateTime? dateUtc, CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetDailyCashSummaryAsync(dateUtc, cancellationToken));
    }

    [HttpGet("profit-loss")]
    public async Task<IActionResult> GetProfitLoss([FromQuery] DateTime? fromUtc, [FromQuery] DateTime? toUtc, CancellationToken cancellationToken)
    {
        return Ok(await reportService.GetProfitLossAsync(fromUtc, toUtc, cancellationToken));
    }
}
