using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MobileShop.Api.Extensions;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Orders;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class OrdersController(IOrderService orderService, MobileShopDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Operator,Customer")]
    public async Task<IActionResult> GetOrders([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        if (User.IsInRole("Customer"))
        {
            var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
            if (customerProfileId == null)
            {
                return BadRequest("Customer profile not found");
            }

            return Ok(await orderService.GetOrdersAsync(queryParameters, customerProfileId, cancellationToken));
        }

        return Ok(await orderService.GetOrdersAsync(queryParameters, null, cancellationToken));
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Operator,Customer")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        if (User.IsInRole("Customer") && !request.CustomerProfileId.HasValue)
        {
            var customerProfileId = await GetCustomerProfileIdAsync(cancellationToken);
            if (customerProfileId == null)
            {
                return BadRequest("Customer profile not found");
            }

            request.CustomerProfileId = customerProfileId;
        }

        if (!request.CustomerProfileId.HasValue)
        {
            return BadRequest("Customer profile id is required.");
        }

        var performedBy = User.Identity?.Name ?? "api";
        var result = await orderService.CreateOrderAsync(request, performedBy, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] OrderStatus status, CancellationToken cancellationToken)
    {
        var performedBy = User.Identity?.Name ?? "api";
        var updated = await orderService.UpdateStatusAsync(id, status, performedBy, cancellationToken);
        return updated ? NoContent() : NotFound();
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
