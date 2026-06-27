using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Common;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class LookupService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : ILookupService
{
    public Task<PagedResult<LookupDto>> GetCategoriesAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default) =>
        GetLookupsAsync(dbContext.Categories.AsNoTracking(), queryParameters, cancellationToken);

    public async Task<LookupDto> CreateCategoryAsync(UpsertLookupRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = new Category { Name = request.Name, Description = request.Description, CreatedBy = performedBy };
        dbContext.Categories.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Category), "Create", performedBy, entity.Name, cancellationToken);
        return new LookupDto { Id = entity.Id, Name = entity.Name, Description = entity.Description };
    }

    public async Task<LookupDto?> UpdateCategoryAsync(Guid id, UpsertLookupRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Categories.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Category), "Update", performedBy, entity.Name, cancellationToken);
        return new LookupDto { Id = entity.Id, Name = entity.Name, Description = entity.Description };
    }

    public async Task<bool> DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Categories.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        dbContext.Categories.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public Task<PagedResult<LookupDto>> GetBrandsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default) =>
        GetLookupsAsync(dbContext.Brands.AsNoTracking(), queryParameters, cancellationToken);

    public async Task<LookupDto> CreateBrandAsync(UpsertLookupRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = new Brand { Name = request.Name, Description = request.Description, CreatedBy = performedBy };
        dbContext.Brands.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Brand), "Create", performedBy, entity.Name, cancellationToken);
        return new LookupDto { Id = entity.Id, Name = entity.Name, Description = entity.Description };
    }

    public async Task<LookupDto?> UpdateBrandAsync(Guid id, UpsertLookupRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Brands.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Brand), "Update", performedBy, entity.Name, cancellationToken);
        return new LookupDto { Id = entity.Id, Name = entity.Name, Description = entity.Description };
    }

    public async Task<bool> DeleteBrandAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Brands.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        dbContext.Brands.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static async Task<PagedResult<LookupDto>> GetLookupsAsync<T>(IQueryable<T> query, QueryParameters queryParameters, CancellationToken cancellationToken)
        where T : class
    {
        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => EF.Property<string>(x, "Name").Contains(queryParameters.Search));
        }

        query = queryParameters.SortDescending
            ? query.OrderByDescending(x => EF.Property<string>(x, queryParameters.SortBy ?? "Name"))
            : query.OrderBy(x => EF.Property<string>(x, queryParameters.SortBy ?? "Name"));

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new LookupDto
            {
                Id = EF.Property<Guid>(x, "Id"),
                Name = EF.Property<string>(x, "Name"),
                Description = EF.Property<string?>(x, "Description")
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<LookupDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }
}
