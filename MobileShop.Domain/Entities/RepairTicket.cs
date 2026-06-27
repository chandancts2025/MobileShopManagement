using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class RepairTicket : AuditableEntity
{
    public string TicketNumber { get; set; } = string.Empty;
    public Guid? CustomerProfileId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string DeviceBrand { get; set; } = string.Empty;
    public string DeviceModel { get; set; } = string.Empty;
    public string? ImeiOrSerialNumber { get; set; }
    public string ProblemDescription { get; set; } = string.Empty;
    public string? TechnicianNotes { get; set; }
    public decimal EstimatedCost { get; set; }
    public decimal AdvanceAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public RepairTicketStatus Status { get; set; } = RepairTicketStatus.Received;
    public DateTime? ExpectedDeliveryUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public CustomerProfile? CustomerProfile { get; set; }
}
