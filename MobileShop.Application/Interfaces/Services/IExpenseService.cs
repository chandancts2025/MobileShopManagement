using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Expenses;

namespace MobileShop.Application.Interfaces.Services;

public interface IExpenseService
{
    Task<PagedResult<ExpenseDto>> GetExpensesAsync(QueryParameters queryParameters, DateTime? fromUtc = null, DateTime? toUtc = null, CancellationToken cancellationToken = default);
    Task<ExpenseDto?> GetExpenseAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ExpenseDto> CreateExpenseAsync(UpsertExpenseRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<ExpenseDto?> UpdateExpenseAsync(Guid id, UpsertExpenseRequest request, string performedBy, CancellationToken cancellationToken = default);
    Task<bool> DeleteExpenseAsync(Guid id, string performedBy, CancellationToken cancellationToken = default);
}
