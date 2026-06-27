using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Inventory;

public class StockTransactionDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public StockTransactionType TransactionType { get; set; }
    public int Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}
