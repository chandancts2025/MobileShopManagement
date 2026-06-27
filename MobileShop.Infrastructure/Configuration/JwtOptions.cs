namespace MobileShop.Infrastructure.Configuration;

public class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = "MobileShop";
    public string Audience { get; set; } = "MobileShop.Client";
    public string SecretKey { get; set; } = "ReplaceThisWithASecureSecretKeyForProduction123!";
    public int ExpiryMinutes { get; set; } = 60;
}
