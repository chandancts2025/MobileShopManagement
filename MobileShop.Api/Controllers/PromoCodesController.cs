using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Pricing;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin")]
[Route("api/[controller]")]
public class PromoCodesController(IPricingService pricingService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPromoCodes([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await pricingService.GetPromoCodesAsync(queryParameters, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> CreatePromoCode([FromBody] UpsertPromoCodeRequest request, CancellationToken cancellationToken) =>
        Ok(await pricingService.CreatePromoCodeAsync(request, User.Identity?.Name ?? "api", cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePromoCode(Guid id, [FromBody] UpsertPromoCodeRequest request, CancellationToken cancellationToken)
    {
        var result = await pricingService.UpdatePromoCodeAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePromoCode(Guid id, CancellationToken cancellationToken) =>
        await pricingService.DeletePromoCodeAsync(id, cancellationToken) ? NoContent() : NotFound();
}
