namespace MobileShop.Domain.Enums;

public enum OrderStatus
{
    Draft = 1,
    Pending = 2,
    Confirmed = 3,
    Packed = 4,
    Shipped = 5,
    Delivered = 6,
    Cancelled = 7,
    Returned = 8
}
