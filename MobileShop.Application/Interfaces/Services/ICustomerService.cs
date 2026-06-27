using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Customers;

namespace MobileShop.Application.Interfaces.Services;

public interface ICustomerService
{
    Task<PagedResult<CustomerDto>> GetCustomersAsync(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<CustomerDto?> GetCustomerAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CustomerDto> CreateCustomerAsync(UpsertCustomerRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<CustomerDto?> UpdateCustomerAsync(Guid id, UpsertCustomerRequest request, string performedBy, CancellationToken cancellationToken = default);
}
