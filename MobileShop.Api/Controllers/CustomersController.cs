using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.DTOs.Customers;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator")]
[Route("api/[controller]")]
public class CustomersController(ICustomerService customerService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCustomers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
    {
        return Ok(await customerService.GetCustomersAsync(pageNumber, pageSize, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCustomer(Guid id, CancellationToken cancellationToken)
    {
        var customer = await customerService.GetCustomerAsync(id, cancellationToken);
        return customer is null ? NotFound() : Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCustomer([FromBody] UpsertCustomerRequest request, CancellationToken cancellationToken)
    {
        var result = await customerService.CreateCustomerAsync(request, User.Identity?.Name ?? "api", cancellationToken);
        return CreatedAtAction(nameof(GetCustomer), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] UpsertCustomerRequest request, CancellationToken cancellationToken)
    {
        var result = await customerService.UpdateCustomerAsync(id, request, User.Identity?.Name ?? "api", cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}
