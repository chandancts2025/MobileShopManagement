using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Settings;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class SettingsService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : ISettingsService
{
    public async Task<PagedResult<AppSettingDto>> GetSettingsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.AppSettings.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.Key.Contains(queryParameters.Search) || x.Value.Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.Key)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new AppSettingDto
            {
                Id = x.Id,
                Key = x.Key,
                Value = x.Value,
                Description = x.Description
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<AppSettingDto> { Items = items, TotalCount = totalCount, PageNumber = queryParameters.PageNumber, PageSize = queryParameters.PageSize };
    }

    public async Task<AppSettingDto> CreateSettingAsync(UpsertAppSettingRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = new AppSetting { Key = request.Key, Value = request.Value, Description = request.Description, CreatedBy = performedBy };
        dbContext.AppSettings.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(AppSetting), "Create", performedBy, entity.Key, cancellationToken);
        return Map(entity);
    }

    public async Task<AppSettingDto?> UpdateSettingAsync(Guid id, UpsertAppSettingRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.AppSettings.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        entity.Key = request.Key;
        entity.Value = request.Value;
        entity.Description = request.Description;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<bool> DeleteSettingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.AppSettings.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        dbContext.AppSettings.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static AppSettingDto Map(AppSetting entity) => new()
    {
        Id = entity.Id,
        Key = entity.Key,
        Value = entity.Value,
        Description = entity.Description
    };
}
