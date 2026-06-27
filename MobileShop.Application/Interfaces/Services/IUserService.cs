using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Users;

namespace MobileShop.Application.Interfaces.Services;

public interface IUserService
{
    Task<PagedResult<AdminUserDto>> GetUsersAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<AdminUserDto> CreateUserAsync(CreateAdminUserRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<AdminUserDto?> UpdateUserAsync(Guid id, UpdateAdminUserRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(Guid id, CancellationToken cancellationToken = default);
}
