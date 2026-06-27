namespace MobileShop.Application.DTOs.Reports;

public class ProfitLossReportDto
{
    public DateTime? FromUtc { get; set; }
    public DateTime? ToUtc { get; set; }
    public int OrdersCount { get; set; }
    public decimal SalesTotal { get; set; }
    public decimal TaxCollected { get; set; }
    public decimal Discounts { get; set; }
    public decimal CostOfGoodsSold { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal Expenses { get; set; }
    public decimal NetProfit { get; set; }
}
