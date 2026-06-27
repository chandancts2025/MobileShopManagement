using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Repairs;

public class RepairTicketDto
{
    public Guid Id { get; set; }
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
    public RepairTicketStatus Status { get; set; }
    public DateTime? ExpectedDeliveryUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
