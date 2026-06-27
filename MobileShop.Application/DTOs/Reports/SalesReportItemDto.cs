namespace MobileShop.Application.DTOs.Reports;

public class SalesReportItemDto
{
    public string Label { get; set; } = string.Empty;
    public int OrdersCount { get; set; }
    public decimal SalesAmount { get; set; }
}
