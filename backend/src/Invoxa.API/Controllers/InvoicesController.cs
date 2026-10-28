using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Invoxa.Application.DTOs;
using Invoxa.Application.Services;
using Invoxa.Domain.Enums;

namespace Invoxa.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] InvoiceStatus? status, [FromQuery] Guid? customerId)
    {
        var invoices = await _invoiceService.GetAllAsync(status, customerId);
        return Ok(new { succeeded = true, data = invoices });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var invoice = await _invoiceService.GetByIdAsync(id);
        if (invoice == null)
            return NotFound(new { succeeded = false, message = "Invoice not found." });

        return Ok(new { succeeded = true, data = invoice });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request)
    {
        var result = await _invoiceService.CreateAsync(request);
        if (!result.Succeeded)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] InvoiceStatus status)
    {
        var result = await _invoiceService.UpdateStatusAsync(id, status);
        if (!result.Succeeded)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        var invoice = await _invoiceService.GetByIdAsync(id);
        if (invoice == null)
            return NotFound(new { succeeded = false, message = "Invoice not found." });

        var pdfBytes = await _invoiceService.GeneratePdfAsync(id);
        return File(pdfBytes, "application/pdf", $"Invoice-{invoice.InvoiceNo}.pdf");
    }
}
