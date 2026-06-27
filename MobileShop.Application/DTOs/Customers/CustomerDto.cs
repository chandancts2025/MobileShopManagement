namespace MobileShop.Application.DTOs.Customers;

public class CustomerDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? AlternatePhoneNumber { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public IEnumerable<AddressDto> Addresses { get; set; } = Array.Empty<AddressDto>();
}
