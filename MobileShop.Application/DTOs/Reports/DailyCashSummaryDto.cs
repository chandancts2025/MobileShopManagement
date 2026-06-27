namespace MobileShop.Application.DTOs.Reports;

public class DailyCashSummaryDto
{
    public DateTime DateUtc { get; set; }
    public decimal CashSales { get; set; }
    public decimal CardSales { get; set; }
    public decimal UpiSales { get; set; }
    public decimal OtherSales { get; set; }
    public decimal Expenses { get; set; }
    public decimal NetCashFlow { get; set; }
    public int PaymentsCount { get; set; }
}
