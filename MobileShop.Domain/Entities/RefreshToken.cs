using MobileShop.Domain.Common;

namespace MobileShop.Domain.Entities;

public class RefreshToken : AuditableEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public bool IsRevoked { get; set; }
    public User User { get; set; } = null!;
}
