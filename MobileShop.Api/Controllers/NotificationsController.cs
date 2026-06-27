using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken)
    {
        return Ok(await notificationService.GetUserNotificationsAsync(GetCurrentUserId(), queryParameters, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetNotification(Guid id, CancellationToken cancellationToken)
    {
        var notification = await notificationService.GetNotificationAsync(id, cancellationToken);
        return notification is null ? NotFound() : Ok(notification);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin,Operator")]
    public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequest request, CancellationToken cancellationToken)
    {
        var result = await notificationService.SendNotificationAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetNotification), new { id = result.Id }, result);
    }

    [HttpPost("{id:guid}/mark-read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        return await notificationService.MarkAsReadAsync(id, cancellationToken) ? Ok() : NotFound();
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        await notificationService.MarkAllAsReadAsync(GetCurrentUserId(), cancellationToken);
        return Ok();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNotification(Guid id, CancellationToken cancellationToken)
    {
        return await notificationService.DeleteNotificationAsync(id, cancellationToken) ? NoContent() : NotFound();
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetNotificationSummary(CancellationToken cancellationToken)
    {
        return Ok(await notificationService.GetNotificationSummaryAsync(GetCurrentUserId(), cancellationToken));
    }

    private Guid GetCurrentUserId()
    {
        // This would be replaced with actual user lookup from claims
        return Guid.Empty;
    }
}
