using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Users;

public class CreateAdminUserRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRoleType Role { get; set; }
}
