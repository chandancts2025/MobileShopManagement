using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Pricing;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class PricingService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : IPricingService
{
    public async Task<PagedResult<TaxRuleDto>> GetTaxRulesAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.TaxRules.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.Name.Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.Name)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new TaxRuleDto
            {
                Id = x.Id,
                Name = x.Name,
                Percentage = x.Percentage,
                IsDefault = x.IsDefault,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<TaxRuleDto> { Items = items, TotalCount = totalCount, PageNumber = queryParameters.PageNumber, PageSize = queryParameters.PageSize };
    }

    public async Task<TaxRuleDto> CreateTaxRuleAsync(UpsertTaxRuleRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = new TaxRule { Name = request.Name, Percentage = request.Percentage, IsDefault = request.IsDefault, IsActive = request.IsActive, CreatedBy = performedBy };
        dbContext.TaxRules.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(TaxRule), "Create", performedBy, entity.Name, cancellationToken);
        return Map(entity);
    }

    public async Task<TaxRuleDto?> UpdateTaxRuleAsync(Guid id, UpsertTaxRuleRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.TaxRules.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        entity.Name = request.Name;
        entity.Percentage = request.Percentage;
        entity.IsDefault = request.IsDefault;
        entity.IsActive = request.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<bool> DeleteTaxRuleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.TaxRules.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        dbContext.TaxRules.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<PagedResult<PromoCodeDto>> GetPromoCodesAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        var query = dbContext.PromoCodes.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.Code.Contains(queryParameters.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(x => x.Code)
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new PromoCodeDto
            {
                Id = x.Id,
                Code = x.Code,
                DiscountAmount = x.DiscountAmount,
                DiscountPercentage = x.DiscountPercentage,
                ValidFromUtc = x.ValidFromUtc,
                ValidToUtc = x.ValidToUtc,
                IsActive = x.IsActive
            }).ToListAsync(cancellationToken);

        return new PagedResult<PromoCodeDto> { Items = items, TotalCount = totalCount, PageNumber = queryParameters.PageNumber, PageSize = queryParameters.PageSize };
    }

    public async Task<PromoCodeDto> CreatePromoCodeAsync(UpsertPromoCodeRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = new PromoCode
        {
            Code = request.Code,
            DiscountAmount = request.DiscountAmount,
            DiscountPercentage = request.DiscountPercentage,
            ValidFromUtc = request.ValidFromUtc,
            ValidToUtc = request.ValidToUtc,
            IsActive = request.IsActive,
            CreatedBy = performedBy
        };
        dbContext.PromoCodes.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<PromoCodeDto?> UpdatePromoCodeAsync(Guid id, UpsertPromoCodeRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PromoCodes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return null;
        entity.Code = request.Code;
        entity.DiscountAmount = request.DiscountAmount;
        entity.DiscountPercentage = request.DiscountPercentage;
        entity.ValidFromUtc = request.ValidFromUtc;
        entity.ValidToUtc = request.ValidToUtc;
        entity.IsActive = request.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(entity);
    }

    public async Task<bool> DeletePromoCodeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.PromoCodes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null) return false;
        dbContext.PromoCodes.Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static TaxRuleDto Map(TaxRule entity) => new()
    {
        Id = entity.Id,
        Name = entity.Name,
        Percentage = entity.Percentage,
        IsDefault = entity.IsDefault,
        IsActive = entity.IsActive
    };

    private static PromoCodeDto Map(PromoCode entity) => new()
    {
        Id = entity.Id,
        Code = entity.Code,
        DiscountAmount = entity.DiscountAmount,
        DiscountPercentage = entity.DiscountPercentage,
        ValidFromUtc = entity.ValidFromUtc,
        ValidToUtc = entity.ValidToUtc,
        IsActive = entity.IsActive
    };
}
