using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Repairs;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class RepairsController(IRepairService repairService) : ControllerBase
{
    [HttpGet("track/{ticketOrPhone}")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackRepairTicket(string ticketOrPhone, CancellationToken cancellationToken)
    {
        var ticket = await repairService.GetRepairTicketByNumberAsync(ticketOrPhone, cancellationToken);
        return ticket is null ? NotFound("No repair ticket found for this ticket number or phone number.") : Ok(ticket);
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> GetRepairTickets([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await repairService.GetRepairTicketsAsync(queryParameters, cancellationToken));

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> GetRepairTicket(Guid id, CancellationToken cancellationToken)
    {
        var ticket = await repairService.GetRepairTicketAsync(id, cancellationToken);
        return ticket is null ? NotFound() : Ok(ticket);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRepairTicket([FromBody] CreateRepairTicketRequest request, CancellationToken cancellationToken)
    {
        var result = await repairService.CreateRepairTicketAsync(request, User.Identity?.Name ?? "api", cancellationToken);
        return CreatedAtAction(nameof(GetRepairTicket), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateRepairTicket(Guid id, [FromBody] UpdateRepairTicketRequest request, CancellationToken cancellationToken)
    {
        var result = await repairService.UpdateRepairTicketAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateRepairTicketStatus(Guid id, [FromBody] UpdateRepairTicketStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await repairService.UpdateRepairTicketStatusAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteRepairTicket(Guid id, CancellationToken cancellationToken) =>
        await repairService.DeleteRepairTicketAsync(id, User.Identity?.Name ?? "api", cancellationToken) ? NoContent() : NotFound();
}
