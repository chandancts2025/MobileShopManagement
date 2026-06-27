using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Users;
using MobileShop.Application.Interfaces.Security;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class UserService(MobileShopDbContext dbContext, IPasswordHasher passwordHasher, IAuditLogService auditLogService) : IUserService
{
    public async Task<PagedResult<AdminUserDto>> GetUsersAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Users.Where(x => x.Role != UserRoleType.Customer).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.FirstName.Contains(queryParameters.Search) || x.LastName.Contains(queryParameters.Search) || x.Email.Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.FirstName)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new AdminUserDto
            {
                Id = x.Id,
                FullName = $"{x.FirstName} {x.LastName}",
                Email = x.Email,
                PhoneNumber = x.PhoneNumber,
                Role = x.Role,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminUserDto> { Items = items, TotalCount = totalCount, PageNumber = queryParameters.PageNumber, PageSize = queryParameters.PageSize };
    }

    public async Task<AdminUserDto> CreateUserAsync(CreateAdminUserRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            PasswordHash = passwordHasher.Hash(request.Password),
            Role = request.Role,
            CreatedBy = performedBy
        };

        dbContext.Users.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(User), "Create", performedBy, entity.Email, cancellationToken);
        return Map(entity);
    }

    public async Task<AdminUserDto?> UpdateUserAsync(Guid id, UpdateAdminUserRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        entity.FirstName = request.FirstName;
        entity.LastName = request.LastName;
        entity.PhoneNumber = request.PhoneNumber;
        entity.Role = request.Role;
        entity.IsActive = request.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<bool> DeleteUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        entity.IsActive = false;
        entity.IsDeleted = true;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static AdminUserDto Map(User entity) => new()
    {
        Id = entity.Id,
        FullName = $"{entity.FirstName} {entity.LastName}".Trim(),
        Email = entity.Email,
        PhoneNumber = entity.PhoneNumber,
        Role = entity.Role,
        IsActive = entity.IsActive
    };
}
