using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Users;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin")]
[Route("api/[controller]")]
public class UsersController(IUserService userService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await userService.GetUsersAsync(queryParameters, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateAdminUserRequest request, CancellationToken cancellationToken) =>
        Ok(await userService.CreateUserAsync(request, User.Identity?.Name ?? "api", cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateAdminUserRequest request, CancellationToken cancellationToken)
    {
        var result = await userService.UpdateUserAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken) =>
        await userService.DeleteUserAsync(id, cancellationToken) ? NoContent() : NotFound();
}
