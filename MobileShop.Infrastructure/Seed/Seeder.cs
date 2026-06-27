using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Interfaces.Security;
using MobileShop.Domain.Entities;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Seed;

public static class Seeder
{
    public static async Task SeedAsync(MobileShopDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken = default)
    {
        await dbContext.Database.MigrateAsync(cancellationToken);

        if (!await dbContext.Users.AnyAsync(cancellationToken))
        {
            dbContext.Users.AddRange(
                new User
                {
                    FirstName = "System",
                    LastName = "Owner",
                    Email = "superadmin@mobileshop.local",
                    PhoneNumber = "9999999999",
                    PasswordHash = passwordHasher.Hash("SuperAdmin@123"),
                    Role = UserRoleType.SuperAdmin
                },
                new User
                {
                    FirstName = "Store",
                    LastName = "Admin",
                    Email = "admin@mobileshop.local",
                    PhoneNumber = "8888888888",
                    PasswordHash = passwordHasher.Hash("Admin@123"),
                    Role = UserRoleType.Admin
                });
        }

        if (!await dbContext.Categories.AnyAsync(cancellationToken))
        {
            dbContext.Categories.AddRange(
                new Category { Name = "Smartphones", Description = "All mobile handsets" },
                new Category { Name = "Tablets", Description = "Android and iPad tablets" });
        }

        if (!await dbContext.Brands.AnyAsync(cancellationToken))
        {
            dbContext.Brands.AddRange(
                new Brand { Name = "Samsung" },
                new Brand { Name = "Apple" },
                new Brand { Name = "OnePlus" });
        }

        if (!await dbContext.Suppliers.AnyAsync(cancellationToken))
        {
            dbContext.Suppliers.Add(new Supplier
            {
                Name = "Default Mobile Distributor",
                ContactPerson = "Distributor Desk",
                PhoneNumber = "7777777777",
                Email = "supplier@mobileshop.local",
                Address = "Main market supply lane",
                TaxRegistrationNumber = "GSTIN-DEMO-001"
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        if (!await dbContext.TaxRules.AnyAsync(cancellationToken))
        {
            dbContext.TaxRules.Add(new TaxRule
            {
                Name = "Standard GST",
                Percentage = 18m,
                IsDefault = true
            });
        }

        if (!await dbContext.AppSettings.AnyAsync(cancellationToken))
        {
            dbContext.AppSettings.AddRange(
                new AppSetting { Key = "StoreName", Value = "Mobile Shop Management", Description = "Display name" },
                new AppSetting { Key = "DefaultCurrency", Value = "INR", Description = "Primary sales currency" });
        }

        if (!await dbContext.Products.AnyAsync(cancellationToken))
        {
            var smartphoneCategory = await dbContext.Categories.FirstAsync(x => x.Name == "Smartphones", cancellationToken);
            var tabletCategory = await dbContext.Categories.FirstAsync(x => x.Name == "Tablets", cancellationToken);
            var samsungBrand = await dbContext.Brands.FirstAsync(x => x.Name == "Samsung", cancellationToken);
            var appleBrand = await dbContext.Brands.FirstAsync(x => x.Name == "Apple", cancellationToken);

            var galaxy = new Product
            {
                Sku = "MBL-S24-256",
                Name = "Galaxy S24 256GB",
                ProductType = ProductType.Mobile,
                CategoryId = smartphoneCategory.Id,
                BrandId = samsungBrand.Id,
                Price = 79999m,
                CostPrice = 68000m,
                TaxPercentage = 18m,
                DiscountAmount = 2500m
            };

            var ipad = new Product
            {
                Sku = "TAB-IPAD-AIR-128",
                Name = "iPad Air 128GB",
                ProductType = ProductType.Tablet,
                CategoryId = tabletCategory.Id,
                BrandId = appleBrand.Id,
                Price = 59999m,
                CostPrice = 51000m,
                TaxPercentage = 18m,
                DiscountAmount = 1500m
            };

            dbContext.Products.AddRange(galaxy, ipad);
            dbContext.InventoryStocks.AddRange(
                new InventoryStock { Product = galaxy, QuantityOnHand = 25, ReorderLevel = 10 },
                new InventoryStock { Product = ipad, QuantityOnHand = 12, ReorderLevel = 8 });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
