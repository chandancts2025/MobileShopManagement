namespace MobileShop.Application.DTOs.Billing;

public class BillItemRequest
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
