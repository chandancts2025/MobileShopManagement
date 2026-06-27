using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Suppliers;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class SupplierService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : ISupplierService
{
    public async Task<PagedResult<SupplierDto>> GetSuppliersAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Suppliers
            .Where(x => !x.IsDeleted)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x =>
                x.Name.Contains(queryParameters.Search) ||
                x.PhoneNumber.Contains(queryParameters.Search) ||
                (x.Email ?? string.Empty).Contains(queryParameters.Search));
        }

        query = queryParameters.SortBy?.ToLowerInvariant() switch
        {
            "createdatutc" => queryParameters.SortDescending ? query.OrderByDescending(x => x.CreatedAtUtc) : query.OrderBy(x => x.CreatedAtUtc),
            _ => queryParameters.SortDescending ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var suppliers = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<SupplierDto>
        {
            Items = suppliers.Select(Map).ToList(),
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<SupplierDto?> GetSupplierAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var supplier = await dbContext.Suppliers
            .Where(x => x.Id == id && !x.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
        return supplier is null ? null : Map(supplier);
    }

    public async Task<SupplierDto> CreateSupplierAsync(UpsertSupplierRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var supplier = new Supplier
        {
            Name = request.Name.Trim(),
            ContactPerson = request.ContactPerson,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            Address = request.Address,
            TaxRegistrationNumber = request.TaxRegistrationNumber,
            IsActive = request.IsActive,
            CreatedBy = performedBy
        };

        dbContext.Suppliers.Add(supplier);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Supplier), "Create", performedBy, supplier.Name, cancellationToken);

        return Map(supplier);
    }

    public async Task<SupplierDto?> UpdateSupplierAsync(Guid id, UpsertSupplierRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var supplier = await dbContext.Suppliers.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (supplier is null)
        {
            return null;
        }

        supplier.Name = request.Name.Trim();
        supplier.ContactPerson = request.ContactPerson;
        supplier.PhoneNumber = request.PhoneNumber;
        supplier.Email = request.Email;
        supplier.Address = request.Address;
        supplier.TaxRegistrationNumber = request.TaxRegistrationNumber;
        supplier.IsActive = request.IsActive;
        supplier.UpdatedAtUtc = DateTime.UtcNow;
        supplier.UpdatedBy = performedBy;

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Supplier), "Update", performedBy, supplier.Name, cancellationToken);
        return Map(supplier);
    }

    public async Task<bool> DeleteSupplierAsync(Guid id, string performedBy, CancellationToken cancellationToken = default)
    {
        var supplier = await dbContext.Suppliers.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (supplier is null)
        {
            return false;
        }

        supplier.IsDeleted = true;
        supplier.IsActive = false;
        supplier.UpdatedAtUtc = DateTime.UtcNow;
        supplier.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Supplier), "Delete", performedBy, supplier.Name, cancellationToken);
        return true;
    }

    private static SupplierDto Map(Supplier supplier) => new()
    {
        Id = supplier.Id,
        Name = supplier.Name,
        ContactPerson = supplier.ContactPerson,
        PhoneNumber = supplier.PhoneNumber,
        Email = supplier.Email,
        Address = supplier.Address,
        TaxRegistrationNumber = supplier.TaxRegistrationNumber,
        IsActive = supplier.IsActive
    };
}
