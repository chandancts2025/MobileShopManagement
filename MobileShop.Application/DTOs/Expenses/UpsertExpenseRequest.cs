namespace MobileShop.Application.DTOs.Expenses;

public class UpsertExpenseRequest
{
    public DateTime ExpenseDateUtc { get; set; } = DateTime.UtcNow;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? PaidTo { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}
