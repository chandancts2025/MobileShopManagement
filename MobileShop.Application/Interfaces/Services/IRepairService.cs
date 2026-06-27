using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Repairs;

namespace MobileShop.Application.Interfaces.Services;

public interface IRepairService
{
    Task<PagedResult<RepairTicketDto>> GetRepairTicketsAsync(QueryParameters queryParameters, CancellationToken cancellationToken = default);
    Task<RepairTicketDto?> GetRepairTicketAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RepairTicketDto> CreateRepairTicketAsync(CreateRepairTicketRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<RepairTicketDto?> UpdateRepairTicketAsync(Guid id, UpdateRepairTicketRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<RepairTicketDto?> UpdateRepairTicketStatusAsync(Guid id, UpdateRepairTicketStatusRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteRepairTicketAsync(Guid id, string performedBy, CancellationToken cancellationToken = default);
}
