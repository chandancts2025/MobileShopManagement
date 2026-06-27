namespace MobileShop.Application.DTOs.Settings;

public class UpsertAppSettingRequest
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}
