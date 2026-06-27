using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Customers;
using MobileShop.Application.Interfaces.Security;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class CustomerService(MobileShopDbContext dbContext, IPasswordHasher passwordHasher, IAuditLogService auditLogService) : ICustomerService
{
    public async Task<PagedResult<CustomerDto>> GetCustomersAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = dbContext.CustomerProfiles
            .Include(x => x.User)
            .Include(x => x.Addresses)
            .Where(x => !x.IsDeleted)
            .AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);
        var profiles = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<CustomerDto>
        {
            Items = profiles.Select(Map).ToList(),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<CustomerDto?> GetCustomerAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var profile = await dbContext.CustomerProfiles
            .Include(x => x.User)
            .Include(x => x.Addresses)
            .Where(x => x.Id == id && !x.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
        return profile is null ? null : Map(profile);
    }

    public async Task<CustomerDto> CreateCustomerAsync(UpsertCustomerRequest request, string performedBy, CancellationToken cancellationToken = default)
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
            PasswordHash = passwordHasher.Hash(request.Password ?? $"WalkIn-{Guid.NewGuid():N}"),
            Role = UserRoleType.Customer,
            CreatedBy = performedBy
        };

        var profile = new CustomerProfile
        {
            User = user,
            FullName = $"{request.FirstName} {request.LastName}".Trim(),
            CreatedBy = performedBy,
            Addresses = request.Addresses.Select(x => new Address
            {
                Type = x.Type,
                Line1 = x.Line1,
                Line2 = x.Line2,
                City = x.City,
                State = x.State,
                Country = x.Country,
                PostalCode = x.PostalCode,
                CreatedBy = performedBy
            }).ToList()
        };

        dbContext.CustomerProfiles.Add(profile);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(CustomerProfile), "Create", performedBy, profile.FullName, cancellationToken);

        return await GetCustomerAsync(profile.Id, cancellationToken)
            ?? throw new InvalidOperationException("Customer was created but could not be reloaded.");
    }

    public async Task<CustomerDto?> UpdateCustomerAsync(Guid id, UpsertCustomerRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var profile = await dbContext.CustomerProfiles
            .Include(x => x.User)
            .Include(x => x.Addresses)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);

        if (profile is null)
        {
            return null;
        }

        var emailOwner = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == request.Email && x.Id != profile.UserId, cancellationToken);
        if (emailOwner is not null)
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        profile.FullName = $"{request.FirstName} {request.LastName}".Trim();
        profile.UpdatedAtUtc = DateTime.UtcNow;
        profile.UpdatedBy = performedBy;
        profile.User.FirstName = request.FirstName;
        profile.User.LastName = request.LastName;
        profile.User.Email = request.Email;
        profile.User.PhoneNumber = request.PhoneNumber;
        profile.User.AlternatePhoneNumber = request.AlternatePhoneNumber;
        profile.User.DateOfBirth = request.DateOfBirth;
        profile.User.Gender = request.Gender;
        profile.User.UpdatedAtUtc = DateTime.UtcNow;
        profile.User.UpdatedBy = performedBy;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            profile.User.PasswordHash = passwordHasher.Hash(request.Password);
        }

        dbContext.Addresses.RemoveRange(profile.Addresses);
        profile.Addresses = request.Addresses.Select(x => new Address
        {
            CustomerProfileId = profile.Id,
            Type = x.Type,
            Line1 = x.Line1,
            Line2 = x.Line2,
            City = x.City,
            State = x.State,
            Country = x.Country,
            PostalCode = x.PostalCode,
            CreatedBy = performedBy
        }).ToList();

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(CustomerProfile), "Update", performedBy, profile.FullName, cancellationToken);
        return await GetCustomerAsync(id, cancellationToken);
    }

    private static CustomerDto Map(CustomerProfile profile) => new()
    {
        Id = profile.Id,
        UserId = profile.UserId,
        FullName = profile.FullName,
        Email = profile.User.Email,
        PhoneNumber = profile.User.PhoneNumber,
        AlternatePhoneNumber = profile.User.AlternatePhoneNumber,
        DateOfBirth = profile.User.DateOfBirth,
        Gender = profile.User.Gender,
        Addresses = profile.Addresses.Select(a => new AddressDto
        {
            Type = a.Type,
            Line1 = a.Line1,
            Line2 = a.Line2,
            City = a.City,
            State = a.State,
            Country = a.Country,
            PostalCode = a.PostalCode
        }).ToList()
    };
}
