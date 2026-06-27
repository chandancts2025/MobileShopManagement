using MobileShop.Domain.Common;
using MobileShop.Domain.Enums;

namespace MobileShop.Domain.Entities;

public class Address : AuditableEntity
{
    public Guid CustomerProfileId { get; set; }
    public AddressType Type { get; set; }
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public CustomerProfile CustomerProfile { get; set; } = null!;
}
