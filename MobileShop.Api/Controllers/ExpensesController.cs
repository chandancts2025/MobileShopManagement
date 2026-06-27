using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Expenses;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator")]
[Route("api/[controller]")]
public class ExpensesController(IExpenseService expenseService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetExpenses(
        [FromQuery] QueryParameters queryParameters,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        CancellationToken cancellationToken) =>
        Ok(await expenseService.GetExpensesAsync(queryParameters, fromUtc, toUtc, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetExpense(Guid id, CancellationToken cancellationToken)
    {
        var expense = await expenseService.GetExpenseAsync(id, cancellationToken);
        return expense is null ? NotFound() : Ok(expense);
    }

    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] UpsertExpenseRequest request, CancellationToken cancellationToken)
    {
        var result = await expenseService.CreateExpenseAsync(request, User.Identity?.Name ?? "api", cancellationToken);
        return CreatedAtAction(nameof(GetExpense), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateExpense(Guid id, [FromBody] UpsertExpenseRequest request, CancellationToken cancellationToken)
    {
        var result = await expenseService.UpdateExpenseAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> DeleteExpense(Guid id, CancellationToken cancellationToken) =>
        await expenseService.DeleteExpenseAsync(id, User.Identity?.Name ?? "api", cancellationToken) ? NoContent() : NotFound();
}
