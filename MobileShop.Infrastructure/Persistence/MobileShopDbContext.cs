using Microsoft.EntityFrameworkCore;
using MobileShop.Domain.Entities;

namespace MobileShop.Infrastructure.Persistence;

public class MobileShopDbContext(DbContextOptions<MobileShopDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<CustomerProfile> CustomerProfiles => Set<CustomerProfile>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<InventoryStock> InventoryStocks => Set<InventoryStock>();
    public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();
    public DbSet<TaxRule> TaxRules => Set<TaxRule>();
    public DbSet<PromoCode> PromoCodes => Set<PromoCode>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<BillItem> BillItems => Set<BillItem>();
    public DbSet<ReturnRequest> ReturnRequests => Set<ReturnRequest>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<LoyaltyAccount> LoyaltyAccounts => Set<LoyaltyAccount>();
    public DbSet<LoyaltyTransaction> LoyaltyTransactions => Set<LoyaltyTransaction>();
    public DbSet<LoyaltyRedemption> LoyaltyRedemptions => Set<LoyaltyRedemption>();
    public DbSet<ProductReview> ProductReviews => Set<ProductReview>();
    public DbSet<ReviewImage> ReviewImages => Set<ReviewImage>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationTemplate> NotificationTemplates => Set<NotificationTemplate>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<RepairTicket> RepairTickets => Set<RepairTicket>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AppSetting> AppSettings => Set<AppSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Product>().HasIndex(x => x.Sku).IsUnique();
        modelBuilder.Entity<PromoCode>().HasIndex(x => x.Code).IsUnique();
        modelBuilder.Entity<AppSetting>().HasIndex(x => x.Key).IsUnique();
        modelBuilder.Entity<PurchaseOrder>().HasIndex(x => x.PurchaseOrderNumber).IsUnique();
        modelBuilder.Entity<RepairTicket>().HasIndex(x => x.TicketNumber).IsUnique();

        modelBuilder.Entity<User>()
            .HasOne(x => x.CustomerProfile)
            .WithOne(x => x.User)
            .HasForeignKey<CustomerProfile>(x => x.UserId);

        modelBuilder.Entity<Product>()
            .HasOne(x => x.InventoryStock)
            .WithOne(x => x.Product)
            .HasForeignKey<InventoryStock>(x => x.ProductId);

        modelBuilder.Entity<Order>()
            .HasOne(x => x.Invoice)
            .WithOne(x => x.Order)
            .HasForeignKey<Invoice>(x => x.OrderId);

        modelBuilder.Entity<Order>()
            .HasMany(x => x.Bills)
            .WithOne(x => x.Order)
            .HasForeignKey(x => x.OrderId);

        modelBuilder.Entity<Bill>()
            .HasIndex(x => x.BillNumber)
            .IsUnique();

        modelBuilder.Entity<Bill>()
            .HasOne(x => x.CustomerProfile)
            .WithMany()
            .HasForeignKey(x => x.CustomerProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BillItem>()
            .HasOne(x => x.Bill)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.BillId);

        modelBuilder.Entity<PurchaseOrder>()
            .HasOne(x => x.Supplier)
            .WithMany(x => x.PurchaseOrders)
            .HasForeignKey(x => x.SupplierId);

        modelBuilder.Entity<PurchaseOrderItem>()
            .HasOne(x => x.PurchaseOrder)
            .WithMany(x => x.Items)
            .HasForeignKey(x => x.PurchaseOrderId);

        modelBuilder.Entity<PurchaseOrderItem>()
            .HasOne(x => x.Product)
            .WithMany(x => x.PurchaseOrderItems)
            .HasForeignKey(x => x.ProductId);

        modelBuilder.Entity<ReturnRequest>()
            .HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId);

        modelBuilder.Entity<RepairTicket>()
            .HasOne(x => x.CustomerProfile)
            .WithMany(x => x.RepairTickets)
            .HasForeignKey(x => x.CustomerProfileId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
