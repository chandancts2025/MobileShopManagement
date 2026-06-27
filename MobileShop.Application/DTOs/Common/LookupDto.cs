namespace MobileShop.Application.DTOs.Common;

public class LookupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
