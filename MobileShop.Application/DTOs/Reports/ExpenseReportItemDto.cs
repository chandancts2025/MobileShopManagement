namespace MobileShop.Application.DTOs.Reports;

public class ExpenseReportItemDto
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal TotalAmount { get; set; }
}
