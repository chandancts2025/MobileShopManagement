using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class ReturnRequest : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ReturnStatus Status { get; set; } = ReturnStatus.Requested;
    public decimal RefundAmount { get; set; }
    public Order Order { get; set; } = null!;
}
