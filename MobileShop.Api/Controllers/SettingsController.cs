using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Settings;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin")]
[Route("api/[controller]")]
public class SettingsController(ISettingsService settingsService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetSettings([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await settingsService.GetSettingsAsync(queryParameters, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> CreateSetting([FromBody] UpsertAppSettingRequest request, CancellationToken cancellationToken) =>
        Ok(await settingsService.CreateSettingAsync(request, User.Identity?.Name ?? "api", cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSetting(Guid id, [FromBody] UpsertAppSettingRequest request, CancellationToken cancellationToken)
    {
        var result = await settingsService.UpdateSettingAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSetting(Guid id, CancellationToken cancellationToken) =>
        await settingsService.DeleteSettingAsync(id, cancellationToken) ? NoContent() : NotFound();
}
