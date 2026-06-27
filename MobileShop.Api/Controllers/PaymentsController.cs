using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MobileShop.Application.Common;
using MobileShop.Application.DTOs.Payments;
using MobileShop.Application.Interfaces.Services;

namespace MobileShop.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin,Operator")]
[Route("api/[controller]")]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetPayments([FromQuery] QueryParameters queryParameters, CancellationToken cancellationToken) =>
        Ok(await paymentService.GetPaymentsAsync(queryParameters, cancellationToken));

    [HttpPost]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request, CancellationToken cancellationToken) =>
        Ok(await paymentService.CreatePaymentAsync(request, User.Identity?.Name ?? "api", cancellationToken));
}
