namespace MobileShop.Application.DTOs.Expenses;

public class ExpenseDto
{
    public Guid Id { get; set; }
    public DateTime ExpenseDateUtc { get; set; }
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? PaidTo { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
}
