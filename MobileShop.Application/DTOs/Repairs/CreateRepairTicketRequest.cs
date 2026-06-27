namespace MobileShop.Application.DTOs.Repairs;

public class CreateRepairTicketRequest
{
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
    public DateTime? ExpectedDeliveryUtc { get; set; }
}
