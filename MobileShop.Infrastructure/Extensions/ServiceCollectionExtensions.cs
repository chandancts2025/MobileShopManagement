using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MobileShop.Application.Interfaces.Repositories;
using MobileShop.Application.Interfaces.Security;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Infrastructure.Configuration;
using MobileShop.Infrastructure.Persistence;
using MobileShop.Infrastructure.Repositories;
using MobileShop.Infrastructure.Security;
using MobileShop.Infrastructure.Services;

namespace MobileShop.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection(JwtOptions.SectionName);
        services.AddSingleton(Options.Create(new JwtOptions
        {
            Issuer = jwtSection["Issuer"] ?? "MobileShop",
            Audience = jwtSection["Audience"] ?? "MobileShop.Client",
            SecretKey = jwtSection["SecretKey"] ?? "ReplaceThisWithASecureSecretKeyForProduction123!",
            ExpiryMinutes = int.TryParse(jwtSection["ExpiryMinutes"], out var expiryMinutes) ? expiryMinutes : 60
        }));

        services.AddDbContext<MobileShopDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ILookupService, LookupService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IPricingService, PricingService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ISupplierService, SupplierService>();
        services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        services.AddScoped<IRepairService, RepairService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IReturnService, ReturnService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<ISettingsService, SettingsService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IWishlistService, WishlistService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ILoyaltyService, LoyaltyService>();
        services.AddScoped<IBillingService, BillingService>();
        services.AddScoped<ISearchService, SearchService>();
        services.AddScoped<IEmailService, EmailService>();

        return services;
    }
}
