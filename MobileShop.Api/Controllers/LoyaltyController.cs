using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileShop.Api.Extensions;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class LoyaltyController(ILoyaltyService loyaltyService, MobileShopDbContext dbContext) : ControllerBase
{
    [HttpGet("account")]
    public async Task<IActionResult> GetLoyaltyAccount(CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        var account = await loyaltyService.GetLoyaltyAccountAsync(customerProfileId.Value, cancellationToken);
        if (account is null)
        {
            account = await loyaltyService.CreateLoyaltyAccountAsync(
                customerProfileId.Value,
                User.Identity?.Name ?? "api",
                cancellationToken);
        }

        return Ok(account);
    }

    [HttpPost("initialize")]
    public async Task<IActionResult> InitializeLoyaltyAccount(CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        var performedBy = User.Identity?.Name ?? "api";
        var account = await loyaltyService.CreateLoyaltyAccountAsync(customerProfileId.Value, performedBy, cancellationToken);
        return Ok(account);
    }

    [HttpPost("add-points")]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> AddPoints([FromQuery] Guid customerId, [FromQuery] decimal points, [FromQuery] string description, CancellationToken cancellationToken)
    {
        var performedBy = User.Identity?.Name ?? "api";
        var success = await loyaltyService.AddPointsAsync(customerId, points, description, null, performedBy, cancellationToken);
        return success ? Ok() : BadRequest("Failed to add points");
    }

    [HttpPost("redeem-points")]
    public async Task<IActionResult> RedeemPoints([FromBody] RedeemPointsRequest request, CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        var performedBy = User.Identity?.Name ?? "api";
        var success = await loyaltyService.RedeemPointsAsync(customerProfileId.Value, request, performedBy, cancellationToken);
        return success ? Ok() : BadRequest("Failed to redeem points");
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactionHistory([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        return Ok(await loyaltyService.GetTransactionHistoryAsync(customerProfileId.Value, queryParameters, cancellationToken));
    }

    [HttpGet("tier-progress")]
    public async Task<IActionResult> GetTierProgress(CancellationToken cancellationToken)
    {
        var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
        if (customerProfileId == null)
            return BadRequest("Customer profile not found");

        return Ok(await loyaltyService.GetTierProgressAsync(customerProfileId.Value, cancellationToken));
    }

    [HttpGet("tier-benefits/{tier}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTierBenefits(string tier, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<Domain.Enums.LoyaltyTier>(tier, true, out var loyaltyTier))
            return BadRequest("Invalid tier");

        return Ok(await loyaltyService.GetTierBenefitsAsync(loyaltyTier, cancellationToken));
    }

    private async Task<Guid?> GetCustomerProfileIdAsync(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId.HasValue)
        {
            var profileId = await dbContext.CustomerProfiles
                .AsNoTracking()
                .Where(x => x.UserId == userId.Value && !x.IsDeleted)
                .Select(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (profileId != Guid.Empty)
            {
                return profileId;
            }
        }

        var email = User.GetEmail();
        if (!string.IsNullOrWhiteSpace(email))
        {
            var profileId = await dbContext.CustomerProfiles
                .AsNoTracking()
                .Where(x => x.User.Email == email && !x.IsDeleted)
                .Select(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (profileId != Guid.Empty)
            {
                return profileId;
            }
        }

        return null;
    }
}
