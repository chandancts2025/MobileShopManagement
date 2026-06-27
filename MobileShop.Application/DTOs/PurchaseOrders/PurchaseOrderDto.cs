using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.PurchaseOrders;

public class PurchaseOrderDto
{
    public Guid Id { get; set; }
    public string PurchaseOrderNumber { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public DateTime? ExpectedAtUtc { get; set; }
    public DateTime? ReceivedAtUtc { get; set; }
    public PurchaseOrderStatus Status { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public IReadOnlyCollection<PurchaseOrderItemDto> Items { get; set; } = Array.Empty<PurchaseOrderItemDto>();
}
