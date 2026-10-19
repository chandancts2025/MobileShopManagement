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
        await SeedStandardDummyDataAsync(dbContext, passwordHasher, cancellationToken);
    }

    public static async Task<object> SeedStandardDummyDataAsync(MobileShopDbContext dbContext, IPasswordHasher passwordHasher, CancellationToken cancellationToken = default)
    {
        // ---------------------------------------------------------------------
        // 1. Admin Users
        // ---------------------------------------------------------------------
        if (!await dbContext.Users.AnyAsync(x => x.Email == "chandankr.mandal87@gmail.com", cancellationToken))
        {
            dbContext.Users.Add(new User
            {
                FirstName = "Chandan Kr",
                LastName = "Mandal",
                Email = "chandankr.mandal87@gmail.com",
                PhoneNumber = "9851632391",
                PasswordHash = passwordHasher.Hash("SuperAdmin@123"),
                Role = UserRoleType.SuperAdmin
            });
        }

        if (!await dbContext.Users.AnyAsync(x => x.Email == "admin@mobileshop.local", cancellationToken))
        {
            dbContext.Users.Add(new User
            {
                FirstName = "Store",
                LastName = "Admin",
                Email = "admin@mobileshop.local",
                PhoneNumber = "8888888888",
                PasswordHash = passwordHasher.Hash("Admin@123"),
                Role = UserRoleType.Admin
            });
        }

        // ---------------------------------------------------------------------
        // 2. Tax Rules
        // ---------------------------------------------------------------------
        if (!await dbContext.TaxRules.AnyAsync(cancellationToken))
        {
            dbContext.TaxRules.Add(new TaxRule
            {
                Name = "Standard GST",
                Percentage = 18m,
                IsDefault = true
            });
        }

        // ---------------------------------------------------------------------
        // 3. Store App Settings
        // ---------------------------------------------------------------------
        var settingsMap = new Dictionary<string, (string Value, string Description)>
        {
            ["StoreName"] = ("Mobile Shop Management", "Display store title"),
            ["DefaultCurrency"] = ("INR", "Primary sales currency"),
            ["OwnerName"] = ("Chandan Kr Mandal", "Product Owner & Shop Proprietor"),
            ["OwnerPhone"] = ("9851632391", "Product Owner Contact Phone"),
            ["OwnerEmail"] = ("chandankr.mandal87@gmail.com", "Product Owner Email"),
            ["StoreAddress"] = ("3B8-2D, Sanhita Township, Newtown, 700135, WB", "Primary Store & Office Address"),
            ["GSTIN"] = ("19AABCX1234F1Z8", "Goods and Services Tax Identification Number"),
            ["StateCode"] = ("19", "West Bengal State GST Code")
        };

        foreach (var (key, (val, desc)) in settingsMap)
        {
            var existingSetting = await dbContext.AppSettings.FirstOrDefaultAsync(x => x.Key == key, cancellationToken);
            if (existingSetting is null)
            {
                dbContext.AppSettings.Add(new AppSetting { Key = key, Value = val, Description = desc });
            }
            else
            {
                existingSetting.Value = val;
            }
        }

        // ---------------------------------------------------------------------
        // 4. Promo Codes
        // ---------------------------------------------------------------------
        var promoList = new (string Code, decimal? DiscountAmount, decimal? DiscountPercentage)[]
        {
            ("DIWALI2026", 2500m, null),
            ("SAVE10", null, 10m),
            ("FLAT500", 500m, null),
            ("SUPERDEAL", 1000m, null),
            ("NEW10", 100m, 10m)
        };

        foreach (var p in promoList)
        {
            var existingPromo = await dbContext.PromoCodes.FirstOrDefaultAsync(x => x.Code == p.Code, cancellationToken);
            if (existingPromo is null)
            {
                dbContext.PromoCodes.Add(new PromoCode
                {
                    Code = p.Code,
                    DiscountAmount = p.DiscountAmount ?? 0m,
                    DiscountPercentage = p.DiscountPercentage,
                    ValidFromUtc = new DateTime(2026, 1, 1),
                    ValidToUtc = new DateTime(2027, 12, 31, 23, 59, 59),
                    IsActive = true
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // ---------------------------------------------------------------------
        // 5. Standard Categories
        // ---------------------------------------------------------------------
        var standardCategories = new (string Name, string Description)[]
        {
            ("Smartphones", "Flagship, premium and value mobile handsets"),
            ("Tablets", "Productivity tablets and iPads with WiFi & Cellular"),
            ("Wearables & Smartwatches", "Apple Watch, Galaxy Watch and fitness trackers"),
            ("Audio & Earbuds", "True Wireless Stereo (TWS) earbuds, ANC headphones"),
            ("Power & Accessories", "Fast chargers, power banks, wireless charging pads, braided cables"),
            ("Protection & Cases", "Spigen protective cases, camera lens covers, 9H tempered glass")
        };

        foreach (var cat in standardCategories)
        {
            if (!await dbContext.Categories.AnyAsync(x => x.Name == cat.Name, cancellationToken))
            {
                dbContext.Categories.Add(new Category { Name = cat.Name, Description = cat.Description });
            }
        }

        // ---------------------------------------------------------------------
        // 6. Standard Brands
        // ---------------------------------------------------------------------
        var standardBrands = new (string Name, string? Description)[]
        {
            ("Apple", "Apple Inc. iPhones, iPads, Apple Watch and original accessories"),
            ("Samsung", "Samsung Electronics Galaxy series smartphones, tablets and gear"),
            ("OnePlus", "OnePlus Never Settle smartphones and audio devices"),
            ("Xiaomi", "Xiaomi flagship and Redmi popular value smartphones"),
            ("Vivo", "Vivo camera-centric X-series and V-series smartphones"),
            ("Realme", "Realme youth and performance-focused smartphones"),
            ("Google", "Google Pixel smartphones with computational photography"),
            ("Anker", "Anker premium chargers, high-capacity power banks and cables"),
            ("Spigen", "Spigen military-grade protection cases and screen protectors"),
            ("Boat", "Boat audio gear, TWS earphones and lifestyle electronics")
        };

        foreach (var brand in standardBrands)
        {
            if (!await dbContext.Brands.AnyAsync(x => x.Name == brand.Name, cancellationToken))
            {
                dbContext.Brands.Add(new Brand { Name = brand.Name, Description = brand.Description });
            }
        }

        // ---------------------------------------------------------------------
        // 7. National & Regional Distributors (Suppliers)
        // ---------------------------------------------------------------------
        var standardSuppliers = new (string Name, string Contact, string Phone, string Email, string Address, string Gstin)[]
        {
            ("Redington India Limited", "Rajesh Mukherjee", "9830129876", "kolkata.orders@redingtongroup.com", "Plot DJ-11, Salt Lake Sector V, Kolkata 700091", "19AAACR1234F1Z1"),
            ("Ingram Micro India Pvt Ltd", "Subhash Ghosh", "9831234567", "sales.east@ingrammicro.com", "Park Center, 24 Park Street, Kolkata 700016", "19AAACO5678G1Z2"),
            ("Savex Technologies Pvt Ltd", "Amitav Roy", "9832345678", "kolkata@savex.in", "Chowringhee Mansions, 30 JL Nehru Rd, Kolkata 700016", "19AAACS9012H1Z3")
        };

        foreach (var s in standardSuppliers)
        {
            if (!await dbContext.Suppliers.AnyAsync(x => x.Name == s.Name, cancellationToken))
            {
                dbContext.Suppliers.Add(new Supplier
                {
                    Name = s.Name,
                    ContactPerson = s.Contact,
                    PhoneNumber = s.Phone,
                    Email = s.Email,
                    Address = s.Address,
                    TaxRegistrationNumber = s.Gstin,
                    IsActive = true
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // Fetch Category & Brand dictionaries for fast lookup
        var categories = await dbContext.Categories.ToDictionaryAsync(x => x.Name, cancellationToken);
        var brands = await dbContext.Brands.ToDictionaryAsync(x => x.Name, cancellationToken);

        // ---------------------------------------------------------------------
        // 8. Standard Mobile Shop Product Catalog & Stocks
        // ---------------------------------------------------------------------
        var productCatalog = new[]
        {
            // Existing flagship products (ensuring costPrice is set!)
            new { Sku = "MBL-S24-256", Name = "Galaxy S24 256GB", Cat = "Smartphones", Brand = "Samsung", Type = ProductType.Mobile, Price = 79999m, Cost = 68000m, Disc = 2500m, Color = "Onyx Black", Storage = "256GB", Stock = 18, Reorder = 10, Desc = "Dynamic AMOLED 2X, Snapdragon 8 Gen 3 for Galaxy, Pro-grade AI camera." },
            new { Sku = "TAB-IPAD-AIR-128", Name = "iPad Air 128GB", Cat = "Tablets", Brand = "Apple", Type = ProductType.Tablet, Price = 59999m, Cost = 51000m, Disc = 1500m, Color = "Space Grey", Storage = "128GB", Stock = 7, Reorder = 8, Desc = "Apple M2 chip, 11-inch Liquid Retina display, Touch ID, Apple Pencil Pro support." },

            // Flagship Smartphones
            new { Sku = "IPH-16PM-256-DT", Name = "Apple iPhone 16 Pro Max 256GB", Cat = "Smartphones", Brand = "Apple", Type = ProductType.Mobile, Price = 144900m, Cost = 132000m, Disc = 0m, Color = "Desert Titanium", Storage = "256GB", Stock = 8, Reorder = 3, Desc = "Grade 5 Titanium design, Camera Control, 4K 120 fps Dolby Vision, A18 Pro chip." },
            new { Sku = "IPH-16-128-UMR", Name = "Apple iPhone 16 128GB", Cat = "Smartphones", Brand = "Apple", Type = ProductType.Mobile, Price = 79900m, Cost = 71500m, Disc = 1000m, Color = "Ultramarine", Storage = "128GB", Stock = 14, Reorder = 5, Desc = "Aerospace-grade aluminium, Action button, 48MP Fusion camera, A18 Bionic chip." },
            new { Sku = "IPH-15-128-BLK", Name = "Apple iPhone 15 128GB", Cat = "Smartphones", Brand = "Apple", Type = ProductType.Mobile, Price = 69900m, Cost = 61500m, Disc = 2000m, Color = "Black", Storage = "128GB", Stock = 16, Reorder = 5, Desc = "Dynamic Island, 48MP Main camera, USB-C, Durable colour-infused glass back." },
            new { Sku = "SAM-S24U-256-GRY", Name = "Samsung Galaxy S24 Ultra 256GB", Cat = "Smartphones", Brand = "Samsung", Type = ProductType.Mobile, Price = 129999m, Cost = 114000m, Disc = 5000m, Color = "Titanium Gray", Storage = "256GB", Stock = 10, Reorder = 4, Desc = "Titanium frame, built-in S Pen, 200MP Quad Tele camera system, Galaxy AI." },
            new { Sku = "SAM-ZF6-512-SLV", Name = "Samsung Galaxy Z Fold 6 512GB", Cat = "Smartphones", Brand = "Samsung", Type = ProductType.Mobile, Price = 164999m, Cost = 148000m, Disc = 7000m, Color = "Silver Shadow", Storage = "512GB", Stock = 3, Reorder = 2, Desc = "Next-gen dual screen foldable, Armor Aluminum, IP48 water resistance." },
            new { Sku = "SAM-A55-128-BLU", Name = "Samsung Galaxy A55 5G 128GB", Cat = "Smartphones", Brand = "Samsung", Type = ProductType.Mobile, Price = 39999m, Cost = 34200m, Disc = 1500m, Color = "Awesome Iceblue", Storage = "128GB", Stock = 22, Reorder = 8, Desc = "Metal frame, Gorilla Glass Victus+, 50MP OIS camera, 5000mAh battery." },
            new { Sku = "1PL-12-256-BLK", Name = "OnePlus 12 256GB", Cat = "Smartphones", Brand = "OnePlus", Type = ProductType.Mobile, Price = 64999m, Cost = 56000m, Disc = 2000m, Color = "Silky Black", Storage = "256GB", Stock = 12, Reorder = 5, Desc = "4th Gen Hasselblad Camera, Snapdragon 8 Gen 3, 5400mAh battery, 100W SUPERVOOC." },
            new { Sku = "1PL-NCE4-128-DCH", Name = "OnePlus Nord CE4 128GB", Cat = "Smartphones", Brand = "OnePlus", Type = ProductType.Mobile, Price = 24999m, Cost = 21200m, Disc = 1000m, Color = "Dark Chrome", Storage = "128GB", Stock = 26, Reorder = 10, Desc = "Snapdragon 7 Gen 3, 100W SuperVOOC, 5500mAh battery, Sony LYT-600 OIS camera." },
            new { Sku = "XIA-14U-512-WHT", Name = "Xiaomi 14 Ultra 512GB", Cat = "Smartphones", Brand = "Xiaomi", Type = ProductType.Mobile, Price = 99999m, Cost = 86500m, Disc = 3000m, Color = "White", Storage = "512GB", Stock = 2, Reorder = 3, Desc = "Leica Quad Camera, 1-inch LYT-900 sensor, WQHD+ AMOLED, Snapdragon 8 Gen 3." },
            new { Sku = "RED-N13P-256-PRP", Name = "Redmi Note 13 Pro+ 5G 256GB", Cat = "Smartphones", Brand = "Xiaomi", Type = ProductType.Mobile, Price = 31999m, Cost = 27400m, Disc = 1000m, Color = "Fusion Purple", Storage = "256GB", Stock = 16, Reorder = 6, Desc = "200MP OIS camera, 3D Curved AMOLED, IP68 water resistance, 120W HyperCharge." },
            new { Sku = "VIV-X100P-512-BLK", Name = "Vivo X100 Pro 512GB", Cat = "Smartphones", Brand = "Vivo", Type = ProductType.Mobile, Price = 89999m, Cost = 78000m, Disc = 2500m, Color = "Asteroid Black", Storage = "512GB", Stock = 5, Reorder = 3, Desc = "ZEISS APO Telephoto camera, Dimensity 9300, 100W FlashCharge, 5400mAh battery." },
            new { Sku = "RLM-12PP-256-BLU", Name = "Realme 12 Pro+ 5G 256GB", Cat = "Smartphones", Brand = "Realme", Type = ProductType.Mobile, Price = 29999m, Cost = 25500m, Disc = 1000m, Color = "Submarine Blue", Storage = "256GB", Stock = 0, Reorder = 5, Desc = "Periscope Portrait camera, luxury watch design by Ollivier Saveo, 120Hz Curved display." },
            new { Sku = "PIX-9P-128-POR", Name = "Google Pixel 9 Pro 128GB", Cat = "Smartphones", Brand = "Google", Type = ProductType.Mobile, Price = 109999m, Cost = 96000m, Disc = 3000m, Color = "Porcelain", Storage = "128GB", Stock = 4, Reorder = 3, Desc = "Google Tensor G4, Gemini AI integrated, Super Actua display, triple pro rear camera." },

            // Tablets
            new { Sku = "TAB-IPAD-10-64-BLU", Name = "Apple iPad 10th Gen 64GB", Cat = "Tablets", Brand = "Apple", Type = ProductType.Tablet, Price = 34900m, Cost = 30200m, Disc = 1000m, Color = "Blue", Storage = "64GB", Stock = 14, Reorder = 5, Desc = "10.9-inch Liquid Retina display, A14 Bionic chip, USB-C, Landscape 12MP Ultra Wide camera." },
            new { Sku = "TAB-SAM-S9FE-128", Name = "Samsung Galaxy Tab S9 FE 128GB", Cat = "Tablets", Brand = "Samsung", Type = ProductType.Tablet, Price = 36999m, Cost = 31500m, Disc = 2000m, Color = "Gray", Storage = "128GB", Stock = 9, Reorder = 4, Desc = "10.9-inch 90Hz display, bundled IP68 S Pen, Exynos 1380, dual speakers by AKG." },

            // Audio & Wearables
            new { Sku = "ACC-APP-2GEN", Name = "Apple AirPods Pro (2nd Gen USB-C)", Cat = "Audio & Earbuds", Brand = "Apple", Type = ProductType.Accessory, Price = 24900m, Cost = 20800m, Disc = 1000m, Color = "White", Storage = "MagSafe Case", Stock = 18, Reorder = 6, Desc = "H2 chip, Pro-level Active Noise Cancellation, Adaptive Audio, USB-C charging." },
            new { Sku = "ACC-SAM-GW6C-BLK", Name = "Samsung Galaxy Watch 6 Classic 43mm", Cat = "Wearables & Smartwatches", Brand = "Samsung", Type = ProductType.Accessory, Price = 29999m, Cost = 24500m, Disc = 2000m, Color = "Black", Storage = "Bluetooth/WiFi", Stock = 6, Reorder = 3, Desc = "Rotating bezel, Sapphire crystal glass, advanced sleep coaching, ECG monitoring." },
            new { Sku = "ACC-BOAT-141-BLK", Name = "Boat Airdopes 141 ANC TWS Earbuds", Cat = "Audio & Earbuds", Brand = "Boat", Type = ProductType.Accessory, Price = 1699m, Cost = 950m, Disc = 100m, Color = "Gunmetal Black", Storage = "42H Playtime", Stock = 40, Reorder = 15, Desc = "Active Noise Cancellation up to 32dB, ENx quad mics, Beast mode 50ms low latency." },

            // Power, Chargers & Accessories
            new { Sku = "ACC-APL-20W-ADP", Name = "Apple 20W USB-C Power Adapter", Cat = "Power & Accessories", Brand = "Apple", Type = ProductType.Accessory, Price = 1900m, Cost = 1350m, Disc = 0m, Color = "White", Storage = "20W Type-C", Stock = 45, Reorder = 15, Desc = "Original Apple USB-C Power Adapter for iPhone 16/15/14 and iPad." },
            new { Sku = "ACC-SAM-45W-ADP", Name = "Samsung 45W Power Adapter with Cable", Cat = "Power & Accessories", Brand = "Samsung", Type = ProductType.Accessory, Price = 2999m, Cost = 2100m, Disc = 200m, Color = "Black", Storage = "45W Super Fast", Stock = 35, Reorder = 12, Desc = "Super Fast Charging 2.0 with 5A Type-C to Type-C cable for S24 Ultra & Tab S9." },
            new { Sku = "ACC-ANK-20K-30W", Name = "Anker 20000mAh Power Bank 30W Fast Charge", Cat = "Power & Accessories", Brand = "Anker", Type = ProductType.Accessory, Price = 3499m, Cost = 2400m, Disc = 300m, Color = "Black", Storage = "20000mAh", Stock = 20, Reorder = 8, Desc = "PowerIQ 3.0 technology, 30W high-speed charging for iPhones, Galaxy & iPads." },
            new { Sku = "ACC-SPG-16PM-LA", Name = "Spigen Liquid Air Case for iPhone 16 Pro Max", Cat = "Protection & Cases", Brand = "Spigen", Type = ProductType.Accessory, Price = 1499m, Cost = 750m, Disc = 100m, Color = "Matte Black", Storage = "Shockproof", Stock = 30, Reorder = 10, Desc = "Air Cushion Technology, geometric pattern, slim grip military grade drop protection." },
            new { Sku = "ACC-9H-TEMP-UNIV", Name = "Ultra-Clear 9H Tempered Glass Screen Guard", Cat = "Protection & Cases", Brand = "Spigen", Type = ProductType.Accessory, Price = 499m, Cost = 120m, Disc = 50m, Color = "Clear", Storage = "9H Hardness", Stock = 110, Reorder = 30, Desc = "Edge-to-edge curved 9H tempered glass with oleophobic anti-fingerprint coating." }
        };

        foreach (var p in productCatalog)
        {
            var product = await dbContext.Products
                .Include(x => x.InventoryStock)
                .FirstOrDefaultAsync(x => x.Sku == p.Sku, cancellationToken);

            var catId = categories.TryGetValue(p.Cat, out var cat) ? cat.Id : categories["Smartphones"].Id;
            var brandId = brands.TryGetValue(p.Brand, out var b) ? b.Id : brands["Samsung"].Id;

            if (product is null)
            {
                var newProduct = new Product
                {
                    Sku = p.Sku,
                    Name = p.Name,
                    Description = p.Desc,
                    ProductType = p.Type,
                    CategoryId = catId,
                    BrandId = brandId,
                    Price = p.Price,
                    CostPrice = p.Cost,
                    TaxPercentage = 18m,
                    DiscountAmount = p.Disc,
                    Color = p.Color,
                    Storage = p.Storage,
                    IsActive = true
                };
                dbContext.Products.Add(newProduct);
                dbContext.InventoryStocks.Add(new InventoryStock
                {
                    Product = newProduct,
                    QuantityOnHand = p.Stock,
                    ReorderLevel = p.Reorder
                });
            }
            else
            {
                // Update cost price and metadata if missing
                product.CostPrice = p.Cost;
                product.Price = p.Price;
                product.Color = p.Color;
                product.Storage = p.Storage;
                product.Description ??= p.Desc;
                if (product.InventoryStock is not null && product.InventoryStock.QuantityOnHand == 0 && p.Stock > 0)
                {
                    product.InventoryStock.QuantityOnHand = p.Stock;
                    product.InventoryStock.ReorderLevel = p.Reorder;
                }
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // ---------------------------------------------------------------------
        // 9. Standard Customers & Customer Profiles
        // ---------------------------------------------------------------------
        var customerSeeds = new[]
        {
            new { FirstName = "Sourav", LastName = "Ganguly", Email = "sourav.ganguly.kol@gmail.com", Phone = "9830112233", Gender = "M", Dob = new DateOnly(1985, 7, 8), Line1 = "Plot DJ-11, Salt Lake Sector V, Electronics Complex", City = "Kolkata", State = "WB", Pin = "700091", Points = 1500m },
            new { FirstName = "Ananya", LastName = "Sen", Email = "ananya.sen.it@gmail.com", Phone = "9831223344", Gender = "F", Dob = new DateOnly(1994, 3, 15), Line1 = "Tower 4, Flat 602, Uniworld City, Action Area III, Newtown", City = "Kolkata", State = "WB", Pin = "700160", Points = 850m },
            new { FirstName = "Rajesh", LastName = "Sharma", Email = "rajesh.sharma.kol@gmail.com", Phone = "9832334455", Gender = "M", Dob = new DateOnly(1988, 11, 20), Line1 = "12B Camac Street, Park Street Area", City = "Kolkata", State = "WB", Pin = "700016", Points = 620m },
            new { FirstName = "Priya", LastName = "Chakraborty", Email = "priya.chakraborty.wb@gmail.com", Phone = "9833445566", Gender = "F", Dob = new DateOnly(1996, 9, 5), Line1 = "Flat 3A, Gariahat Road, Ballygunge", City = "Kolkata", State = "WB", Pin = "700019", Points = 480m },
            new { FirstName = "Amit", LastName = "Banerjee", Email = "amit.banerjee.tech@gmail.com", Phone = "9834556677", Gender = "M", Dob = new DateOnly(1991, 1, 25), Line1 = "Greenwood Elements, Chinar Park, Rajarhat", City = "Kolkata", State = "WB", Pin = "700136", Points = 1200m },
            new { FirstName = "Vikramaditya", LastName = "Roy", Email = "vikram.roy.law@gmail.com", Phone = "9835667788", Gender = "M", Dob = new DateOnly(1982, 4, 12), Line1 = "8/1 Alipore Park Road, Alipore", City = "Kolkata", State = "WB", Pin = "700027", Points = 2800m }
        };

        foreach (var c in customerSeeds)
        {
            var user = await dbContext.Users
                .Include(x => x.CustomerProfile)
                .ThenInclude(x => x!.Addresses)
                .FirstOrDefaultAsync(x => x.Email == c.Email, cancellationToken);

            if (user is null)
            {
                user = new User
                {
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    Email = c.Email,
                    PhoneNumber = c.Phone,
                    Gender = c.Gender,
                    DateOfBirth = c.Dob,
                    PasswordHash = passwordHasher.Hash("Customer@123"),
                    Role = UserRoleType.Customer,
                    IsActive = true
                };
                dbContext.Users.Add(user);

                var profile = new CustomerProfile
                {
                    User = user,
                    FullName = $"{c.FirstName} {c.LastName}"
                };
                dbContext.CustomerProfiles.Add(profile);

                // Add Home and Shipping addresses
                dbContext.Addresses.Add(new Address
                {
                    CustomerProfile = profile,
                    Type = AddressType.Primary,
                    Line1 = c.Line1,
                    City = c.City,
                    State = c.State,
                    Country = "India",
                    PostalCode = c.Pin
                });

                dbContext.Addresses.Add(new Address
                {
                    CustomerProfile = profile,
                    Type = AddressType.Shipping,
                    Line1 = c.Line1,
                    City = c.City,
                    State = c.State,
                    Country = "India",
                    PostalCode = c.Pin
                });

                // Loyalty Account
                dbContext.LoyaltyAccounts.Add(new LoyaltyAccount
                {
                    CustomerProfile = profile,
                    CurrentPoints = c.Points,
                    Tier = c.Points > 2000 ? LoyaltyTier.Platinum : (c.Points > 1000 ? LoyaltyTier.Gold : LoyaltyTier.Silver),
                    TierMultiplier = c.Points > 2000 ? 1.5m : 1.2m,
                    TotalPointsEarned = c.Points + 500m,
                    JoinedUtc = DateTime.UtcNow.AddMonths(-3),
                    IsActive = true
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // ---------------------------------------------------------------------
        // 10. Store Operational Expenses (for P&L & Cash Drawer Reconciliation)
        // ---------------------------------------------------------------------
        var now = DateTime.UtcNow;
        var todayDate = now.Date;

        var expenseSeeds = new[]
        {
            new { Date = todayDate.AddHours(10), Cat = "Pantry & Refreshments", Amt = 1450m, Method = "Cash", PaidTo = "Fresh Express Mart", Ref = "CASH-EXP-101", Notes = "Store pantry tea, nescafe, biscuits and 20L mineral water jars" },
            new { Date = todayDate.AddHours(12), Cat = "Cleaning & Maintenance", Amt = 950m, Method = "Cash", PaidTo = "CleanCare Kolkata", Ref = "CASH-EXP-102", Notes = "Showroom floor deep vacuuming and display glass cleaning supplies" },
            new { Date = todayDate.AddHours(15), Cat = "Conveyance & Delivery", Amt = 650m, Method = "Cash", PaidTo = "FastTrack Deliveries", Ref = "CASH-EXP-103", Notes = "Staff urgent local delivery to Salt Lake Sector V customer" },
            new { Date = todayDate.AddDays(-1).AddHours(14), Cat = "Stationery & Packaging", Amt = 1850m, Method = "UPI", PaidTo = "City Packaging Mart", Ref = "UPI/PKG/490182", Notes = "Branded Mobile Shop carry bags and 20 thermal receipt rolls" },
            new { Date = todayDate.AddDays(-3).AddHours(11), Cat = "Internet & Telecom", Amt = 1199m, Method = "UPI", PaidTo = "Bharti Airtel Limited", Ref = "UPI/AIRTEL/882190", Notes = "Airtel Xstream Fiber 300 Mbps monthly broadband & landline" },
            new { Date = todayDate.AddDays(-5).AddHours(16), Cat = "Security & Maintenance", Amt = 1200m, Method = "Card", PaidTo = "SecureVision Tech", Ref = "CARD/POS/551299", Notes = "CCTV 16-channel cloud recording & annual store security AMC" },
            new { Date = todayDate.AddDays(-7).AddHours(10), Cat = "Utilities", Amt = 5840m, Method = "Net Banking", PaidTo = "WBSEDCL Commercial", Ref = "WBSEDCL-OCT-8921", Notes = "Commercial power tariff bill for showroom lighting & dual ACs" },
            new { Date = new DateTime(now.Year, now.Month, 1).AddHours(9), Cat = "Rent", Amt = 28000m, Method = "Bank Transfer", PaidTo = "Newtown Mall Properties", Ref = "RENT-OCT-2026-01", Notes = "Showroom ground-floor commercial lease for Sanhita Township outlet" }
        };

        foreach (var exp in expenseSeeds)
        {
            if (!await dbContext.Expenses.AnyAsync(x => x.ReferenceNumber == exp.Ref, cancellationToken))
            {
                dbContext.Expenses.Add(new Expense
                {
                    ExpenseDateUtc = exp.Date,
                    Category = exp.Cat,
                    Amount = exp.Amt,
                    PaymentMethod = exp.Method,
                    PaidTo = exp.PaidTo,
                    ReferenceNumber = exp.Ref,
                    Notes = exp.Notes
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // ---------------------------------------------------------------------
        // 11. Multi-Brand Mobile Repair Tickets
        // ---------------------------------------------------------------------
        var repairSeeds = new[]
        {
            new
            {
                TicketNo = "REP-20261019001",
                Customer = "Rohan Sen",
                Phone = "9830123456",
                Brand = "Apple",
                Model = "iPhone 14 Pro 128GB",
                Imei = "IMEI: 356789123456789",
                Problem = "Cracked Super Retina XDR OLED display, touch working intermittently on upper corner.",
                TechNotes = "Original Apple OLED screen assembly tested. TrueTone transfer programmed.",
                Est = 14500m,
                Adv = 5000m,
                Final = 14500m,
                Status = RepairTicketStatus.ReadyForPickup,
                Delivery = todayDate.AddDays(1)
            },
            new
            {
                TicketNo = "REP-20261019002",
                Customer = "Priyanka Dey",
                Phone = "9874561230",
                Brand = "Samsung",
                Model = "Galaxy S23 5G",
                Imei = "IMEI: 359123456789012",
                Problem = "Battery health degraded to 72%, phone overheating during fast charging.",
                TechNotes = "3900mAh genuine Samsung service pack battery replacement scheduled.",
                Est = 3200m,
                Adv = 1000m,
                Final = 3200m,
                Status = RepairTicketStatus.InRepair,
                Delivery = todayDate.AddDays(2)
            },
            new
            {
                TicketNo = "REP-20261019003",
                Customer = "Arindam Mitra",
                Phone = "9831987654",
                Brand = "OnePlus",
                Model = "OnePlus 11 5G",
                Imei = "IMEI: 358234567890123",
                Problem = "Type-C Warp Charge loose connection, USB audio adapter not detecting.",
                TechNotes = "Sub-board charging flex cable ordered from distributor central warehouse.",
                Est = 1850m,
                Adv = 500m,
                Final = 1850m,
                Status = RepairTicketStatus.WaitingForParts,
                Delivery = todayDate.AddDays(4)
            },
            new
            {
                TicketNo = "REP-20261019004",
                Customer = "Debashis Das",
                Phone = "9830876543",
                Brand = "Xiaomi",
                Model = "Xiaomi 13 Pro 5G",
                Imei = "IMEI: 354345678901234",
                Problem = "Earpiece speaker distorted after rain splash at eco park.",
                TechNotes = "Ultrasonic mesh cleaning done. Audio diaphragm replaced. Fully sound tested.",
                Est = 2100m,
                Adv = 1000m,
                Final = 2100m,
                Status = RepairTicketStatus.Delivered,
                Delivery = todayDate.AddDays(-2)
            },
            new
            {
                TicketNo = "REP-20261019005",
                Customer = "Sneha Mukherjee",
                Phone = "9832765432",
                Brand = "Apple",
                Model = "iPad 9th Gen 64GB",
                Imei = "Serial: DMPX91234F56",
                Problem = "Front glass shattered due to drop, LCD display and Touch ID working fine.",
                TechNotes = "Inspection in progress. Digitizer OCA lamination recommended.",
                Est = 4800m,
                Adv = 2000m,
                Final = 4800m,
                Status = RepairTicketStatus.Diagnosing,
                Delivery = todayDate.AddDays(3)
            }
        };

        foreach (var r in repairSeeds)
        {
            if (!await dbContext.RepairTickets.AnyAsync(x => x.TicketNumber == r.TicketNo, cancellationToken))
            {
                dbContext.RepairTickets.Add(new RepairTicket
                {
                    TicketNumber = r.TicketNo,
                    CustomerName = r.Customer,
                    PhoneNumber = r.Phone,
                    DeviceBrand = r.Brand,
                    DeviceModel = r.Model,
                    ImeiOrSerialNumber = r.Imei,
                    ProblemDescription = r.Problem,
                    TechnicianNotes = r.TechNotes,
                    EstimatedCost = r.Est,
                    AdvanceAmount = r.Adv,
                    FinalAmount = r.Final,
                    Status = r.Status,
                    ExpectedDeliveryUtc = r.Delivery,
                    CompletedAtUtc = r.Status == RepairTicketStatus.Delivered ? r.Delivery : null
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // ---------------------------------------------------------------------
        // 12. Multi-Date Sales Orders, Payments & GST Bills
        // ---------------------------------------------------------------------
        var customerProfiles = await dbContext.CustomerProfiles
            .Include(x => x.User)
            .ToDictionaryAsync(x => x.User.Email, cancellationToken);

        var allProducts = await dbContext.Products.ToDictionaryAsync(x => x.Sku, cancellationToken);

        var ordersToSeed = new[]
        {
            // Order 1: Walk-in counter sale Today (UPI GPay)
            new
            {
                OrderNumber = "ORD-20261019-101",
                BillNumber = "BILL-20261019-101",
                CustomerEmail = "sourav.ganguly.kol@gmail.com",
                Date = todayDate.AddHours(11),
                Items = new[]
                {
                    new { Sku = "SAM-S24U-256-GRY", Qty = 1, Price = 129999m, Cost = 114000m, Disc = 5000m },
                    new { Sku = "ACC-SAM-45W-ADP", Qty = 1, Price = 2999m, Cost = 2100m, Disc = 200m }
                },
                PaymentMethod = "UPI (GPay)",
                PaymentRef = "UPI/AXIS/498123019"
            },
            // Order 2: Walk-in counter sale Today (Credit Card POS)
            new
            {
                OrderNumber = "ORD-20261019-102",
                BillNumber = "BILL-20261019-102",
                CustomerEmail = "vikram.roy.law@gmail.com",
                Date = todayDate.AddHours(14),
                Items = new[]
                {
                    new { Sku = "IPH-16PM-256-DT", Qty = 1, Price = 144900m, Cost = 132000m, Disc = 0m },
                    new { Sku = "ACC-SPG-16PM-LA", Qty = 1, Price = 1499m, Cost = 750m, Disc = 100m },
                    new { Sku = "ACC-APL-20W-ADP", Qty = 1, Price = 1900m, Cost = 1350m, Disc = 0m }
                },
                PaymentMethod = "Credit Card (HDFC POS)",
                PaymentRef = "CARD/HDFC/882190"
            },
            // Order 3: Cash counter sale Today
            new
            {
                OrderNumber = "ORD-20261019-103",
                BillNumber = "BILL-20261019-103",
                CustomerEmail = "rajesh.sharma.kol@gmail.com",
                Date = todayDate.AddHours(16),
                Items = new[]
                {
                    new { Sku = "1PL-NCE4-128-DCH", Qty = 1, Price = 24999m, Cost = 21200m, Disc = 1000m },
                    new { Sku = "ACC-9H-TEMP-UNIV", Qty = 1, Price = 499m, Cost = 120m, Disc = 50m }
                },
                PaymentMethod = "Cash Counter",
                PaymentRef = "CASH/POS/1029"
            },
            // Order 4: Online order Yesterday (UPI PhonePe)
            new
            {
                OrderNumber = "ORD-20261018-201",
                BillNumber = "BILL-20261018-201",
                CustomerEmail = "ananya.sen.it@gmail.com",
                Date = todayDate.AddDays(-1).AddHours(15),
                Items = new[]
                {
                    new { Sku = "TAB-IPAD-10-64-BLU", Qty = 1, Price = 34900m, Cost = 30200m, Disc = 1000m },
                    new { Sku = "ACC-APP-2GEN", Qty = 1, Price = 24900m, Cost = 20800m, Disc = 1000m }
                },
                PaymentMethod = "UPI (PhonePe)",
                PaymentRef = "UPI/YBL/99104412"
            },
            // Order 5: In-store purchase 3 days ago (Card Swipe)
            new
            {
                OrderNumber = "ORD-20261016-301",
                BillNumber = "BILL-20261016-301",
                CustomerEmail = "priya.chakraborty.wb@gmail.com",
                Date = todayDate.AddDays(-3).AddHours(13),
                Items = new[]
                {
                    new { Sku = "SAM-A55-128-BLU", Qty = 1, Price = 39999m, Cost = 34200m, Disc = 1500m }
                },
                PaymentMethod = "Credit Card (ICICI POS)",
                PaymentRef = "CARD/ICICI/551299"
            },
            // Order 6: Festival offer purchase 5 days ago (UPI Paytm)
            new
            {
                OrderNumber = "ORD-20261014-401",
                BillNumber = "BILL-20261014-401",
                CustomerEmail = "amit.banerjee.tech@gmail.com",
                Date = todayDate.AddDays(-5).AddHours(17),
                Items = new[]
                {
                    new { Sku = "XIA-14U-512-WHT", Qty = 1, Price = 99999m, Cost = 86500m, Disc = 5500m }
                },
                PaymentMethod = "UPI (Paytm)",
                PaymentRef = "UPI/PYTM/3310029"
            }
        };

        foreach (var ord in ordersToSeed)
        {
            if (await dbContext.Orders.AnyAsync(x => x.OrderNumber == ord.OrderNumber, cancellationToken))
            {
                continue;
            }

            if (!customerProfiles.TryGetValue(ord.CustomerEmail, out var profile))
            {
                continue;
            }

            decimal subtotal = 0m;
            decimal totalDiscount = 0m;

            var orderItems = new List<OrderItem>();
            var billItems = new List<BillItem>();

            foreach (var it in ord.Items)
            {
                if (!allProducts.TryGetValue(it.Sku, out var prod))
                {
                    continue;
                }

                var lineGross = it.Price * it.Qty;
                subtotal += lineGross;
                totalDiscount += it.Disc;

                orderItems.Add(new OrderItem
                {
                    ProductId = prod.Id,
                    Quantity = it.Qty,
                    UnitPrice = it.Price,
                    UnitCost = it.Cost,
                    TaxAmount = Math.Round((lineGross - it.Disc) * 0.18m, 2),
                    DiscountAmount = it.Disc
                });

                billItems.Add(new BillItem
                {
                    Description = $"{prod.Name} ({prod.Color})",
                    Quantity = it.Qty,
                    UnitPrice = it.Price,
                    TotalAmount = lineGross
                });
            }

            var netTaxable = subtotal - totalDiscount;
            var taxAmount = Math.Round(netTaxable * 0.18m, 2);
            var totalAmount = netTaxable + taxAmount;

            var newOrder = new Order
            {
                OrderNumber = ord.OrderNumber,
                CustomerProfileId = profile.Id,
                Subtotal = subtotal,
                TaxAmount = taxAmount,
                DiscountAmount = totalDiscount,
                TotalAmount = totalAmount,
                Status = OrderStatus.Delivered,
                CreatedAtUtc = ord.Date,
                Items = orderItems
            };

            dbContext.Orders.Add(newOrder);

            // Payment
            dbContext.Payments.Add(new Payment
            {
                Order = newOrder,
                Amount = totalAmount,
                PaymentMethod = ord.PaymentMethod,
                Status = PaymentStatus.Paid,
                TransactionReference = ord.PaymentRef,
                CreatedAtUtc = ord.Date
            });

            // GST Bill
            var newBill = new Bill
            {
                Order = newOrder,
                CustomerProfileId = profile.Id,
                BillNumber = ord.BillNumber,
                IssuedAtUtc = ord.Date,
                DueAtUtc = ord.Date.AddDays(30),
                Subtotal = subtotal,
                TaxAmount = taxAmount,
                DiscountAmount = totalDiscount,
                TotalAmount = totalAmount,
                BalanceDue = 0m,
                Status = BillStatus.Paid,
                Notes = "Counter sales invoice with manufacturer warranty",
                Items = billItems
            };

            dbContext.Bills.Add(newBill);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // ---------------------------------------------------------------------
        // 13. Verified Customer Product Reviews
        // ---------------------------------------------------------------------
        var reviewSeeds = new[]
        {
            new { Sku = "IPH-16PM-256-DT", CustomerEmail = "vikram.roy.law@gmail.com", Rating = 5, Title = "Spectacular Desert Titanium finish and camera!", Comment = "Upgraded from 13 Pro Max. The 4K 120fps recording and camera control button make it worth every penny. Battery easily lasts 1.5 days." },
            new { Sku = "SAM-S24U-256-GRY", CustomerEmail = "sourav.ganguly.kol@gmail.com", Rating = 5, Title = "Best Android flagship on the market", Comment = "Galaxy AI features like Circle to Search and live translation are game changers. Display is super crisp under direct Kolkata sunlight." },
            new { Sku = "1PL-NCE4-128-DCH", CustomerEmail = "rajesh.sharma.kol@gmail.com", Rating = 5, Title = "Exceptional value for money", Comment = "100W SuperVOOC charges 0 to 100% in 30 minutes! Smooth 120Hz display and zero lag with Snapdragon 7 Gen 3." },
            new { Sku = "ACC-APP-2GEN", CustomerEmail = "ananya.sen.it@gmail.com", Rating = 5, Title = "Noise cancellation is unmatched", Comment = "Blocks out Metro and traffic noise completely during my daily commute from Newtown. USB-C port is super convenient." }
        };

        foreach (var rev in reviewSeeds)
        {
            if (allProducts.TryGetValue(rev.Sku, out var prod) &&
                customerProfiles.TryGetValue(rev.CustomerEmail, out var prof))
            {
                if (!await dbContext.ProductReviews.AnyAsync(x => x.ProductId == prod.Id && x.CustomerProfileId == prof.Id, cancellationToken))
                {
                    dbContext.ProductReviews.Add(new ProductReview
                    {
                        ProductId = prod.Id,
                        CustomerProfileId = prof.Id,
                        Rating = rev.Rating,
                        Title = rev.Title,
                        Comment = rev.Comment,
                        IsVerifiedPurchase = true,
                        IsApproved = true,
                        HelpfulCount = 12
                    });
                }
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // Return summary metrics
        return new
        {
            Success = true,
            Message = "Standard mobile shop dummy data seeded successfully.",
            ProductsCount = await dbContext.Products.CountAsync(cancellationToken),
            CategoriesCount = await dbContext.Categories.CountAsync(cancellationToken),
            BrandsCount = await dbContext.Brands.CountAsync(cancellationToken),
            SuppliersCount = await dbContext.Suppliers.CountAsync(cancellationToken),
            CustomersCount = await dbContext.CustomerProfiles.CountAsync(cancellationToken),
            OrdersCount = await dbContext.Orders.CountAsync(cancellationToken),
            BillsCount = await dbContext.Bills.CountAsync(cancellationToken),
            ExpensesCount = await dbContext.Expenses.CountAsync(cancellationToken),
            RepairsCount = await dbContext.RepairTickets.CountAsync(cancellationToken)
        };
    }
}
