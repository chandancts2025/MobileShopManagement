using MobileShop.Domain.Entities;

namespace MobileShop.Application.Interfaces.Security;

public interface IJwtTokenGenerator
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}
