using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator,Customer")]
[Route("api/[controller]")]
public class InvoicesController(IInvoiceService invoiceService) : ControllerBase
{
    [HttpGet("{orderKey}")]
    public async Task<IActionResult> GetInvoice(string orderKey, CancellationToken cancellationToken)
    {
        var invoice = await invoiceService.GetInvoiceByOrderKeyAsync(orderKey, cancellationToken);
        return invoice is null ? NotFound() : Ok(invoice);
    }
}
