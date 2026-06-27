using MobileShop.Application.DTOs.Auth;

namespace MobileShop.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterCustomerAsync(RegisterCustomerRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
}
