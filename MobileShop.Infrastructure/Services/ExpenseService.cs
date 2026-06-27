using Microsoft.EntityFrameworkCore;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Expenses;
using MobileShop.Application.Interfaces.Services;
using MobileShop.Domain.Entities;
using MobileShop.Infrastructure.Persistence;

namespace MobileShop.Infrastructure.Services;

public class ExpenseService(MobileShopDbContext dbContext, IAuditLogService auditLogService) : IExpenseService
{
    public async Task<PagedResult<ExpenseDto>> GetExpensesAsync(
        QueryParameters queryParameters,
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Expenses.Where(x => !x.IsDeleted).AsNoTracking();

        if (fromUtc.HasValue)
        {
            query = query.Where(x => x.ExpenseDateUtc >= fromUtc.Value);
        }

        if (toUtc.HasValue)
        {
            query = query.Where(x => x.ExpenseDateUtc <= toUtc.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            query = query.Where(x =>
                x.Category.Contains(queryParameters.Search) ||
                (x.PaidTo ?? string.Empty).Contains(queryParameters.Search) ||
                (x.ReferenceNumber ?? string.Empty).Contains(queryParameters.Search));
        }

        query = queryParameters.SortBy?.ToLowerInvariant() switch
        {
            "amount" => queryParameters.SortDescending ? query.OrderByDescending(x => x.Amount) : query.OrderBy(x => x.Amount),
            "category" => queryParameters.SortDescending ? query.OrderByDescending(x => x.Category) : query.OrderBy(x => x.Category),
            _ => queryParameters.SortDescending ? query.OrderByDescending(x => x.ExpenseDateUtc) : query.OrderBy(x => x.ExpenseDateUtc)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var expenses = await query
            .Skip((queryParameters.PageNumber - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<ExpenseDto>
        {
            Items = expenses.Select(Map).ToList(),
            TotalCount = totalCount,
            PageNumber = queryParameters.PageNumber,
            PageSize = queryParameters.PageSize
        };
    }

    public async Task<ExpenseDto?> GetExpenseAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var expense = await dbContext.Expenses
            .Where(x => x.Id == id && !x.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
        return expense is null ? null : Map(expense);
    }

    public async Task<ExpenseDto> CreateExpenseAsync(UpsertExpenseRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var expense = new Expense
        {
            ExpenseDateUtc = request.ExpenseDateUtc,
            Category = request.Category.Trim(),
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            PaidTo = request.PaidTo,
            ReferenceNumber = request.ReferenceNumber,
            Notes = request.Notes,
            CreatedBy = performedBy
        };

        dbContext.Expenses.Add(expense);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Expense), "Create", performedBy, $"{expense.Category}:{expense.Amount}", cancellationToken);
        return Map(expense);
    }

    public async Task<ExpenseDto?> UpdateExpenseAsync(Guid id, UpsertExpenseRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        var expense = await dbContext.Expenses.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (expense is null)
        {
            return null;
        }

        expense.ExpenseDateUtc = request.ExpenseDateUtc;
        expense.Category = request.Category.Trim();
        expense.Amount = request.Amount;
        expense.PaymentMethod = request.PaymentMethod;
        expense.PaidTo = request.PaidTo;
        expense.ReferenceNumber = request.ReferenceNumber;
        expense.Notes = request.Notes;
        expense.UpdatedAtUtc = DateTime.UtcNow;
        expense.UpdatedBy = performedBy;

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Expense), "Update", performedBy, $"{expense.Category}:{expense.Amount}", cancellationToken);
        return Map(expense);
    }

    public async Task<bool> DeleteExpenseAsync(Guid id, string performedBy, CancellationToken cancellationToken = default)
    {
        var expense = await dbContext.Expenses.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (expense is null)
        {
            return false;
        }

        expense.IsDeleted = true;
        expense.UpdatedAtUtc = DateTime.UtcNow;
        expense.UpdatedBy = performedBy;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditLogService.LogAsync(nameof(Expense), "Delete", performedBy, $"{expense.Category}:{expense.Amount}", cancellationToken);
        return true;
    }

    private static ExpenseDto Map(Expense expense) => new()
    {
        Id = expense.Id,
        ExpenseDateUtc = expense.ExpenseDateUtc,
        Category = expense.Category,
        Amount = expense.Amount,
        PaymentMethod = expense.PaymentMethod,
        PaidTo = expense.PaidTo,
        ReferenceNumber = expense.ReferenceNumber,
        Notes = expense.Notes
    };
}
