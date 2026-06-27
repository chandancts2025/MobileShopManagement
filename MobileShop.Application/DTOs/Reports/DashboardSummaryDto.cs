namespace MobileShop.Application.DTOs.Reports;

public class DashboardSummaryDto
{
    public int TotalProducts { get; set; }
    public int TotalCustomers { get; set; }
    public int PendingOrders { get; set; }
    public int PendingPurchaseOrders { get; set; }
    public int OpenRepairTickets { get; set; }
    public int LowStockProducts { get; set; }
    public decimal TodaySales { get; set; }
    public decimal TodayExpenses { get; set; }
    public decimal TodayProfit { get; set; }
    public decimal MonthlySales { get; set; }
}
