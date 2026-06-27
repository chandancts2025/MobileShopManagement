using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Products;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class ProductService(MobileShopDbContext dbContext) : IProductService
{
    public async Task<PagedResult<ProductDto>> GetProductsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default)
    {
        IQueryable<Product> query = dbContext.Products
            .Include(x => x.Brand)
            .Include(x => x.Category)
            .Include(x => x.InventoryStock)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x => x.Name.Contains(queryParameters.Search) || x.Sku.Contains(queryParameters.Search));
        }

        query = queryParameters.SortBy?.ToLowerInvariant() switch
        {
            "price" => queryParameters.SortDescending ? query.OrderByDescending(x => x.Price) : query.OrderBy(x => x.Price),
            "sku" => queryParameters.SortDescending ? query.OrderByDescending(x => x.Sku) : query.OrderBy(x => x.Sku),
            _ => queryParameters.SortDescending ? query.OrderByDescending(x => x.Name) : query.OrderBy(x => x.Name)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .Select(x => new ProductDto
            {
                Id = x.Id,
                Sku = x.Sku,
                Name = x.Name,
                Description = x.Description,
                ProductType = x.ProductType,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                BrandId = x.BrandId,
                BrandName = x.Brand.Name,
                Price = x.Price,
                CostPrice = x.CostPrice,
                TaxPercentage = x.TaxPercentage,
                DiscountAmount = x.DiscountAmount,
                PromoCode = x.PromoCode,
                QuantityOnHand = x.InventoryStock != null ? x.InventoryStock.QuantityOnHand : 0,
                ReorderLevel = x.InventoryStock != null ? x.InventoryStock.ReorderLevel : 0
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<ProductDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<ProductDto?> GetProductAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Products
            .Include(x => x.Brand)
            .Include(x => x.Category)
            .Include(x => x.InventoryStock)
            .Where(x => x.Id == id)
            .Select(x => new ProductDto
            {
                Id = x.Id,
                Sku = x.Sku,
                Name = x.Name,
                Description = x.Description,
                ProductType = x.ProductType,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                BrandId = x.BrandId,
                BrandName = x.Brand.Name,
                Price = x.Price,
                CostPrice = x.CostPrice,
                TaxPercentage = x.TaxPercentage,
                DiscountAmount = x.DiscountAmount,
                PromoCode = x.PromoCode,
                QuantityOnHand = x.InventoryStock != null ? x.InventoryStock.QuantityOnHand : 0,
                ReorderLevel = x.InventoryStock != null ? x.InventoryStock.ReorderLevel : 0
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<ProductDto> CreateProductAsync(UpsertProductRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = new Product
        {
            Sku = request.Sku,
            Name = request.Name,
            Description = request.Description,
            ProductType = request.ProductType,
            CategoryId = request.CategoryId,
            BrandId = request.BrandId,
            Price = request.Price,
            CostPrice = request.CostPrice,
            TaxPercentage = request.TaxPercentage,
            DiscountAmount = request.DiscountAmount,
            PromoCode = request.PromoCode,
            CreatedBy = performedBy
        };

        var stock = new InventoryStock
        {
            Product = entity,
            QuantityOnHand = request.QuantityOnHand,
            ReorderLevel = request.ReorderLevel,
            CreatedBy = performedBy
        };

        dbContext.Products.Add(entity);
        dbContext.InventoryStocks.Add(stock);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetProductAsync(entity.Id, cancellationToken)
            ?? throw new InvalidOperationException("Product was created but could not be reloaded.");
    }

    public async Task<ProductDto?> UpdateProductAsync(Guid id, UpsertProductRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Products.Include(x => x.InventoryStock).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        entity.Sku = request.Sku;
        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.ProductType = request.ProductType;
        entity.CategoryId = request.CategoryId;
        entity.BrandId = request.BrandId;
        entity.Price = request.Price;
        entity.CostPrice = request.CostPrice;
        entity.TaxPercentage = request.TaxPercentage;
        entity.DiscountAmount = request.DiscountAmount;
        entity.PromoCode = request.PromoCode;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedBy = performedBy;

        if (entity.InventoryStock is not null)
        {
            entity.InventoryStock.QuantityOnHand = request.QuantityOnHand;
            entity.InventoryStock.ReorderLevel = request.ReorderLevel;
            entity.InventoryStock.UpdatedAtUtc = DateTime.UtcNow;
            entity.InventoryStock.UpdatedBy = performedBy;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetProductAsync(id, cancellationToken);
    }

    public async Task<bool> DeleteProductAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Products.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.IsDeleted = true;
        entity.IsActive = false;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
