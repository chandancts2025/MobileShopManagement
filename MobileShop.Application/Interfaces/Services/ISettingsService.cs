using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Settings;

namespace MobileShop.Application.Interfaces.Services;

public interface ISettingsService
{
    Task<PagedResult<AppSettingDto>> GetSettingsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<AppSettingDto> CreateSettingAsync(UpsertAppSettingRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<AppSettingDto?> UpdateSettingAsync(Guid id, UpsertAppSettingRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteSettingAsync(Guid id, CancellationToken cancellationToken = default);
}
