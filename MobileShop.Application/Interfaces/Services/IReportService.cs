using MobileShop.Application.DTOs.Reports;

namespace MobileShop.Application.Interfaces.Services;

public interface IReportService
{
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<SalesReportItemDto>> GetSalesByDateAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<SalesReportItemDto>> GetSalesByBrandAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<SalesReportItemDto>> GetSalesByCategoryAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<StockReportItemDto>> GetLowStockAsync(CancellationToken cancellationToken = default);
    Task<decimal> GetTaxCollectionAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ExpenseReportItemDto>> GetExpensesByCategoryAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken = default);
    Task<DailyCashSummaryDto> GetDailyCashSummaryAsync(DateTime? dateUtc, CancellationToken cancellationToken = default);
    Task<ProfitLossReportDto> GetProfitLossAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken = default);
}
