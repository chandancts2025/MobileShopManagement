using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Returns;

namespace MobileShop.Application.Interfaces.Services;

public interface IReturnService
{
    Task<PagedResult<ReturnRequestDto>> GetReturnsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<ReturnRequestDto> CreateReturnAsync(CreateReturnRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<ReturnRequestDto?> UpdateReturnStatusAsync(Guid id, UpdateReturnStatusRequest request, string performedBy, CancellationToken cancellationToken = default);
}
