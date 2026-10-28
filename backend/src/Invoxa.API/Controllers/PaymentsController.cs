using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Invoxa.Application.DTOs;
using Invoxa.Application.Services;

namespace Invoxa.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? invoiceId)
    {
        var payments = await _paymentService.GetAllAsync(invoiceId);
        return Ok(new { succeeded = true, data = payments });
    }

    [HttpPost]
    public async Task<IActionResult> RecordPayment([FromBody] RecordPaymentRequest request)
    {
        var result = await _paymentService.RecordPaymentAsync(request);
        if (!result.Succeeded)
            return BadRequest(result);

        return Ok(result);
    }
}
