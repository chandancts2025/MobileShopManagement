using MobileShop.Domain.Enums;

namespace MobileShop.Application.DTOs.Repairs;

public class UpdateRepairTicketStatusRequest
{
    public RepairTicketStatus Status { get; set; }
    public string? TechnicianNotes { get; set; }
    public decimal? FinalAmount { get; set; }
}
