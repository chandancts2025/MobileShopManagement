using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class User : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? AlternatePhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public UserRoleType Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAtUtc { get; set; }
    public CustomerProfile? CustomerProfile { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
