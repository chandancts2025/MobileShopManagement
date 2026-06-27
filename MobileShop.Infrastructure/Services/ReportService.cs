using Microsoft.EntityFrameworkCore;
using MobileShop.Application.DTOs.Reports;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Enums;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class ReportService(MobileShopDbContext dbContext) : IReportService
{
    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var tomorrow = today.AddDays(1);

        var todaySales = await dbContext.Orders
            .Where(x => x.CreatedAtUtc >= today && x.CreatedAtUtc < tomorrow && x.Status != OrderStatus.Cancelled)
            .SumAsync(x => (decimal?)x.TotalAmount, cancellationToken) ?? 0m;
        var todayCost = await dbContext.OrderItems
            .Where(x => x.Order.CreatedAtUtc >= today && x.Order.CreatedAtUtc < tomorrow && x.Order.Status != OrderStatus.Cancelled)
            .SumAsync(x => (decimal?)(x.UnitCost * x.Quantity), cancellationToken) ?? 0m;
        var todayExpenses = await dbContext.Expenses
            .Where(x => !x.IsDeleted && x.ExpenseDateUtc >= today && x.ExpenseDateUtc < tomorrow)
            .SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;

        return new DashboardSummaryDto
        {
            TotalProducts = await dbContext.Products.CountAsync(x => !x.IsDeleted, cancellationToken),
            TotalCustomers = await dbContext.CustomerProfiles.CountAsync(x => !x.IsDeleted, cancellationToken),
            PendingOrders = await dbContext.Orders.CountAsync(x => x.Status == OrderStatus.Pending, cancellationToken),
            PendingPurchaseOrders = await dbContext.PurchaseOrders.CountAsync(x => x.Status == PurchaseOrderStatus.Ordered || x.Status == PurchaseOrderStatus.PartiallyReceived, cancellationToken),
            OpenRepairTickets = await dbContext.RepairTickets.CountAsync(x => !x.IsDeleted && x.Status != RepairTicketStatus.Delivered && x.Status != RepairTicketStatus.Cancelled, cancellationToken),
            LowStockProducts = await dbContext.InventoryStocks.CountAsync(x => x.QuantityOnHand <= x.ReorderLevel, cancellationToken),
            TodaySales = todaySales,
            TodayExpenses = todayExpenses,
            TodayProfit = todaySales - todayCost - todayExpenses,
            MonthlySales = await dbContext.Orders.Where(x => x.CreatedAtUtc >= monthStart && x.Status != OrderStatus.Cancelled).SumAsync(x => (decimal?)x.TotalAmount, cancellationToken) ?? 0m
        };
    }

    public async Task<IReadOnlyCollection<SalesReportItemDto>> GetSalesByDateAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken = default)
    {
        var query = ApplyOrderDateRange(dbContext.Orders.Where(x => x.Status != OrderStatus.Cancelled), fromUtc, toUtc);

        var sales = await query
            .GroupBy(x => x.CreatedAtUtc.Date)
            .Select(x => new
            {
                Date = x.Key,
                OrdersCount = x.Count(),
                SalesAmount = x.Sum(o => o.TotalAmount)
            })
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);

        return sales.Select(x => new SalesReportItemDto
        {
            Label = x.Date.ToString("yyyy-MM-dd"),
            OrdersCount = x.OrdersCount,
            SalesAmount = x.SalesAmount
        }).ToList();
    }

    public async Task<IReadOnlyCollection<SalesReportItemDto>> GetSalesByBrandAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.OrderItems
            .Include(x => x.Product)
            .ThenInclude(x => x.Brand)
            .Where(x => x.Order.Status != OrderStatus.Cancelled)
            .GroupBy(x => x.Product.Brand.Name)
            .Select(x => new SalesReportItemDto
            {
                Label = x.Key,
                OrdersCount = x.Count(),
                SalesAmount = x.Sum(i => i.UnitPrice * i.Quantity)
            })
            .OrderByDescending(x => x.SalesAmount)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<SalesReportItemDto>> GetSalesByCategoryAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.OrderItems
            .Include(x => x.Product)
            .ThenInclude(x => x.Category)
            .Where(x => x.Order.Status != OrderStatus.Cancelled)
            .GroupBy(x => x.Product.Category.Name)
            .Select(x => new SalesReportItemDto
            {
                Label = x.Key,
                OrdersCount = x.Count(),
                SalesAmount = x.Sum(i => i.UnitPrice * i.Quantity)
            })
            .OrderByDescending(x => x.SalesAmount)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<StockReportItemDto>> GetLowStockAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.InventoryStocks
            .Include(x => x.Product)
            .Where(x => x.QuantityOnHand <= x.ReorderLevel)
            .OrderBy(x => x.QuantityOnHand)
            .Select(x => new StockReportItemDto
            {
                ProductName = x.Product.Name,
                Sku = x.Product.Sku,
                QuantityOnHand = x.QuantityOnHand,
                ReorderLevel = x.ReorderLevel
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<decimal> GetTaxCollectionAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Orders.Where(x => x.Status != OrderStatus.Cancelled).AsQueryable();
        if (fromUtc.HasValue)
        {
            query = query.Where(x => x.CreatedAtUtc >= fromUtc.Value);
        }
        if (toUtc.HasValue)
        {
            query = query.Where(x => x.CreatedAtUtc <= toUtc.Value);
        }

        return await query.SumAsync(x => (decimal?)x.TaxAmount, cancellationToken) ?? 0m;
    }

    public async Task<IReadOnlyCollection<ExpenseReportItemDto>> GetExpensesByCategoryAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken = default)
    {
        var query = ApplyExpenseDateRange(dbContext.Expenses.Where(x => !x.IsDeleted), fromUtc, toUtc);

        return await query
            .GroupBy(x => x.Category)
            .Select(x => new ExpenseReportItemDto
            {
                Category = x.Key,
                Count = x.Count(),
                TotalAmount = x.Sum(e => e.Amount)
            })
            .OrderByDescending(x => x.TotalAmount)
            .ToListAsync(cancellationToken);
    }

    public async Task<DailyCashSummaryDto> GetDailyCashSummaryAsync(DateTime? dateUtc, CancellationToken cancellationToken = default)
    {
        var date = (dateUtc ?? DateTime.UtcNow).Date;
        var nextDate = date.AddDays(1);
        var paidPayments = await dbContext.Payments
            .Where(x => x.Status == PaymentStatus.Paid && x.CreatedAtUtc >= date && x.CreatedAtUtc < nextDate)
            .ToListAsync(cancellationToken);
        var expenses = await dbContext.Expenses
            .Where(x => !x.IsDeleted && x.ExpenseDateUtc >= date && x.ExpenseDateUtc < nextDate)
            .SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;

        var cashSales = SumByMethod(paidPayments, "cash");
        var cardSales = SumByMethod(paidPayments, "card");
        var upiSales = SumByMethod(paidPayments, "upi");
        var knownSales = cashSales + cardSales + upiSales;
        var totalSales = paidPayments.Sum(x => x.Amount);

        return new DailyCashSummaryDto
        {
            DateUtc = date,
            CashSales = cashSales,
            CardSales = cardSales,
            UpiSales = upiSales,
            OtherSales = totalSales - knownSales,
            Expenses = expenses,
            NetCashFlow = totalSales - expenses,
            PaymentsCount = paidPayments.Count
        };
    }

    public async Task<ProfitLossReportDto> GetProfitLossAsync(DateTime? fromUtc, DateTime? toUtc, CancellationToken cancellationToken = default)
    {
        var orderQuery = ApplyOrderDateRange(dbContext.Orders.Where(x => x.Status != OrderStatus.Cancelled), fromUtc, toUtc);
        var orderItemQuery = dbContext.OrderItems.Where(x => x.Order.Status != OrderStatus.Cancelled);
        if (fromUtc.HasValue)
        {
            orderItemQuery = orderItemQuery.Where(x => x.Order.CreatedAtUtc >= fromUtc.Value);
        }
        if (toUtc.HasValue)
        {
            orderItemQuery = orderItemQuery.Where(x => x.Order.CreatedAtUtc <= toUtc.Value);
        }

        var salesTotal = await orderQuery.SumAsync(x => (decimal?)x.TotalAmount, cancellationToken) ?? 0m;
        var taxCollected = await orderQuery.SumAsync(x => (decimal?)x.TaxAmount, cancellationToken) ?? 0m;
        var discounts = await orderQuery.SumAsync(x => (decimal?)x.DiscountAmount, cancellationToken) ?? 0m;
        var ordersCount = await orderQuery.CountAsync(cancellationToken);
        var costOfGoodsSold = await orderItemQuery.SumAsync(x => (decimal?)(x.UnitCost * x.Quantity), cancellationToken) ?? 0m;
        var expenses = await ApplyExpenseDateRange(dbContext.Expenses.Where(x => !x.IsDeleted), fromUtc, toUtc)
            .SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;
        var grossProfit = salesTotal - taxCollected - costOfGoodsSold;

        return new ProfitLossReportDto
        {
            FromUtc = fromUtc,
            ToUtc = toUtc,
            OrdersCount = ordersCount,
            SalesTotal = salesTotal,
            TaxCollected = taxCollected,
            Discounts = discounts,
            CostOfGoodsSold = costOfGoodsSold,
            GrossProfit = grossProfit,
            Expenses = expenses,
            NetProfit = grossProfit - expenses
        };
    }

    private static IQueryable<MobileShop.Domain.Entities.Order> ApplyOrderDateRange(
        IQueryable<MobileShop.Domain.Entities.Order> query,
        DateTime? fromUtc,
        DateTime? toUtc)
    {
        if (fromUtc.HasValue)
        {
            query = query.Where(x => x.CreatedAtUtc >= fromUtc.Value);
        }
        if (toUtc.HasValue)
        {
            query = query.Where(x => x.CreatedAtUtc <= toUtc.Value);
        }

        return query;
    }

    private static IQueryable<MobileShop.Domain.Entities.Expense> ApplyExpenseDateRange(
        IQueryable<MobileShop.Domain.Entities.Expense> query,
        DateTime? fromUtc,
        DateTime? toUtc)
    {
        if (fromUtc.HasValue)
        {
            query = query.Where(x => x.ExpenseDateUtc >= fromUtc.Value);
        }
        if (toUtc.HasValue)
        {
            query = query.Where(x => x.ExpenseDateUtc <= toUtc.Value);
        }

        return query;
    }

    private static decimal SumByMethod(IEnumerable<MobileShop.Domain.Entities.Payment> payments, string method) =>
        payments
            .Where(x => x.PaymentMethod.Contains(method, StringComparison.OrdinalIgnoreCase))
            .Sum(x => x.Amount);
}
