namespace MobileShop.Domain.Enums;

public enum RepairTicketStatus
{
    Received = 1,
    Diagnosing = 2,
    WaitingForParts = 3,
    InRepair = 4,
    ReadyForPickup = 5,
    Delivered = 6,
    Cancelled = 7
}
