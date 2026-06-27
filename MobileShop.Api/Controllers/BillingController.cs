using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileShop.Api.Extensions;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Billing;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class BillingController(IBillingService billingService, MobileShopDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Operator,Customer")]
    public async Task<IActionResult> GetBills([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        if (User.IsInRole("Customer"))
        {
            var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
            if (customerProfileId == null)
            {
                return BadRequest("Customer profile not found");
            }

            return Ok(await billingService.GetBillsAsync(queryParameters, customerProfileId, cancellationToken));
        }

        return Ok(await billingService.GetBillsAsync(queryParameters, null, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Operator,Customer")]
    public async Task<IActionResult> GetBill(Guid id, CancellationToken cancellationToken)
    {
        Guid? customerProfileId = null;
        if (User.IsInRole("Customer"))
        {
            customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
            if (customerProfileId == null)
            {
                return BadRequest("Customer profile not found");
            }
        }

        var bill = await billingService.GetBillAsync(id, customerProfileId, cancellationToken);
        return bill is null ? NotFound() : Ok(bill);
    }

    [HttpPost("orders/{orderId:guid}/ensure")]
    [Authorize(Roles = "SuperAdmin,Admin,Operator,Customer")]
    public async Task<IActionResult> EnsureBillForOrder(Guid orderId, CancellationToken cancellationToken)
    {
        Guid? customerProfileId = null;
        if (User.IsInRole("Customer"))
        {
            customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
            if (customerProfileId == null)
            {
                return BadRequest("Customer profile not found");
            }
        }

        var bill = await billingService.EnsureBillForOrderAsync(
            orderId,
            customerProfileId,
            User.Identity?.Name ?? "api",
            cancellationToken);

        return bill is null ? NotFound() : Ok(bill);
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

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> CreateBill([FromBody] CreateBillRequest request, CancellationToken cancellationToken)
    {
        var performedBy = User.Identity?.Name ?? "api";
        var bill = await billingService.CreateBillAsync(request, performedBy, cancellationToken);
        return CreatedAtAction(nameof(GetBill), new { id = bill.Id }, bill);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> UpdateBill(Guid id, [FromBody] UpdateBillRequest request, CancellationToken cancellationToken)
    {
        var performedBy = User.Identity?.Name ?? "api";
        var result = await billingService.UpdateBillAsync(id, request, performedBy, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/pay")]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> MarkPaid(Guid id, CancellationToken cancellationToken)
    {
        var performedBy = User.Identity?.Name ?? "api";
        return await billingService.MarkBillPaidAsync(id, performedBy, cancellationToken) ? Ok() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> DeleteBill(Guid id, CancellationToken cancellationToken) =>
        await billingService.DeleteBillAsync(id, cancellationToken) ? NoContent() : NotFound();
}
