using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Pricing;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin")]
[Route("api/[controller]")]
public class TaxesController(IPricingService pricingService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetTaxes([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await pricingService.GetTaxRulesAsync(queryParameters, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> CreateTax([FromBody] UpsertTaxRuleRequest request, CancellationToken cancellationToken) =>
        Ok(await pricingService.CreateTaxRuleAsync(request, User.Identity?.Name ?? "api", cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateTax(Guid id, [FromBody] UpsertTaxRuleRequest request, CancellationToken cancellationToken)
    {
        var result = await pricingService.UpdateTaxRuleAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTax(Guid id, CancellationToken cancellationToken) =>
        await pricingService.DeleteTaxRuleAsync(id, cancellationToken) ? NoContent() : NotFound();
}
