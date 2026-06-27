namespace MobileShop.Application.DTOs.Customers;

public class UpsertCustomerRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? AlternatePhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Password { get; set; }
    public List<AddressDto> Addresses { get; set; } = new();
}
