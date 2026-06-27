namespace MobileShop.Application.DTOs.Suppliers;

public class UpsertSupplierRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? TaxRegistrationNumber { get; set; }
    public bool IsActive { get; set; } = true;
}
