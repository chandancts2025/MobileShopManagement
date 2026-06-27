using Microsoft.EntityFrameworkCore;
using MobileShop.Application.DTOs.Auth;
using MobileShop.Application.Interfaces.Security;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class AuthService(
    MobileShopDbContext dbContext,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator jwtTokenGenerator) : IAuthService
{
    public async Task<AuthResponse> RegisterCustomerAsync(RegisterCustomerRequest request, CancellationToken cancellationToken = default)
    {
        var existingUser = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == request.Email, cancellationToken);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            AlternatePhoneNumber = request.AlternatePhoneNumber,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            PasswordHash = passwordHasher.Hash(request.Password),
            Role = UserRoleType.Customer
        };

        var profile = new CustomerProfile
        {
            User = user,
            FullName = $"{request.FirstName} {request.LastName}".Trim(),
            Addresses =
            [
                new Address
                {
                    Type = AddressType.Billing,
                    Line1 = request.BillingAddressLine1,
                    City = request.City,
                    State = request.State,
                    Country = request.Country,
                    PostalCode = request.PostalCode
                },
                new Address
                {
                    Type = AddressType.Shipping,
                    Line1 = request.ShippingAddressLine1,
                    City = request.City,
                    State = request.State,
                    Country = request.Country,
                    PostalCode = request.PostalCode
                }
            ]
        };

        var refreshToken = new RefreshToken
        {
            User = user,
            Token = jwtTokenGenerator.GenerateRefreshToken(),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(30)
        };

        dbContext.CustomerProfiles.Add(profile);
        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return BuildAuthResponse(user, refreshToken.Token);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == request.Email && x.IsActive, cancellationToken);

        if (user is null || !passwordHasher.Verify(user.PasswordHash, request.Password))
        {
            return null;
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = jwtTokenGenerator.GenerateRefreshToken(),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(30)
        };

        dbContext.RefreshTokens.Add(refreshToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return BuildAuthResponse(user, refreshToken.Token);
    }

    public async Task<AuthResponse?> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var token = await dbContext.RefreshTokens
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Token == request.RefreshToken && !x.IsRevoked && x.ExpiresAtUtc > DateTime.UtcNow, cancellationToken);

        if (token is null || !token.User.IsActive)
        {
            return null;
        }

        token.IsRevoked = true;
        var newRefreshToken = new RefreshToken
        {
            UserId = token.UserId,
            Token = jwtTokenGenerator.GenerateRefreshToken(),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(30)
        };

        dbContext.RefreshTokens.Add(newRefreshToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildAuthResponse(token.User, newRefreshToken.Token);
    }

    private AuthResponse BuildAuthResponse(User user, string refreshToken) => new()
    {
        UserId = user.Id,
        FullName = $"{user.FirstName} {user.LastName}".Trim(),
        Email = user.Email,
        Role = user.Role,
        AccessToken = jwtTokenGenerator.GenerateAccessToken(user),
        RefreshToken = refreshToken,
        ExpiresAtUtc = DateTime.UtcNow.AddHours(1)
    };
}
