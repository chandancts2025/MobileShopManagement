using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Users;

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public UserRoleType Role { get; set; }
    public bool IsActive { get; set; }
}
