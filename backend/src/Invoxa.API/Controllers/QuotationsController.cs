using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Application.DTOs;
using Invoxa.Application.Services;
using Invoxa.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Invoxa.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class QuotationsController : ControllerBase
{
    private readonly IQuotationService _quotationService;
    private readonly IApplicationDbContext _context;
    private readonly IPdfGeneratorService _pdfGenerator;
    private readonly ICurrentTenantService _tenantService;

    public QuotationsController(
        IQuotationService quotationService,
        IApplicationDbContext context,
        IPdfGeneratorService pdfGenerator,
        ICurrentTenantService tenantService)
    {
        _quotationService = quotationService;
        _context = context;
        _pdfGenerator = pdfGenerator;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] QuotationStatus? status)
    {
        var quotations = await _quotationService.GetAllAsync(status);
        return Ok(new { succeeded = true, data = quotations });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var quotation = await _quotationService.GetByIdAsync(id);
        if (quotation == null)
            return NotFound(new { succeeded = false, message = "Quotation not found." });

        return Ok(new { succeeded = true, data = quotation });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuotationRequest request)
    {
        var result = await _quotationService.CreateAsync(request);
        if (!result.Succeeded)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateQuotationStatusRequest request)
    {
        var result = await _quotationService.UpdateStatusAsync(id, request.Status);
        if (!result.Succeeded)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{id:guid}/duplicate")]
    public async Task<IActionResult> Duplicate(Guid id)
    {
        var result = await _quotationService.DuplicateAsync(id);
        if (!result.Succeeded)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpPost("{id:guid}/convert-to-invoice")]
    public async Task<IActionResult> ConvertToInvoice(Guid id, [FromBody] ConvertQuotationToInvoiceRequest request)
    {
        var result = await _quotationService.ConvertToInvoiceAsync(id, request);
        if (!result.Succeeded)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> DownloadPdf(Guid id)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quotation == null)
            return NotFound(new { succeeded = false, message = "Quotation not found." });

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == quotation.TenantId);
        if (tenant == null)
            return NotFound(new { succeeded = false, message = "Tenant not found." });

        var pdfBytes = await _pdfGenerator.GenerateQuotationPdfAsync(quotation, tenant);
        return File(pdfBytes, "application/pdf", $"Quotation-{quotation.QuotationNo}.pdf");
    }
}
