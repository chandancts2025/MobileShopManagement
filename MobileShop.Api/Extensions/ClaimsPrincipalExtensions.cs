using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace MobileShop.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub")
            ?? user.FindFirstValue("nameid");

        return Guid.TryParse(value, out var userId) ? userId : null;
    }

    public static string? GetEmail(this ClaimsPrincipal user) =>
        user.FindFirstValue(JwtRegisteredClaimNames.Email)
        ?? user.FindFirstValue(ClaimTypes.Email)
        ?? user.FindFirstValue("email");
}
