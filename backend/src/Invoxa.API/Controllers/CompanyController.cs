using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Application.DTOs;

namespace Invoxa.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CompanyController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CompanyController(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var tenantId = _tenantService.TenantId;
        if (!tenantId.HasValue)
            return Unauthorized(new { succeeded = false, message = "Tenant context not found." });

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        if (tenant == null)
            return NotFound(new { succeeded = false, message = "Company profile not found." });

        var dto = new CompanyProfileDto(
            tenant.Id,
            tenant.CompanyName,
            tenant.TradeLicenseOrCr,
            tenant.VatNumber,
            tenant.Phone,
            tenant.Email,
            tenant.Address,
            tenant.LogoUrl,
            tenant.CurrencyCode,
            tenant.CurrencyDecimals,
            tenant.DefaultVatRate,
            tenant.SubscriptionPlan.ToString(),
            tenant.CreatedAtUtc
        );

        return Ok(new { succeeded = true, data = dto });
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateCompanyProfileRequest request)
    {
        var tenantId = _tenantService.TenantId;
        if (!tenantId.HasValue)
            return Unauthorized(new { succeeded = false, message = "Tenant context not found." });

        if (string.IsNullOrWhiteSpace(request.CompanyName))
            return BadRequest(new { succeeded = false, message = "Company name is required." });

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        if (tenant == null)
            return NotFound(new { succeeded = false, message = "Company profile not found." });

        tenant.CompanyName = request.CompanyName.Trim();
        tenant.TradeLicenseOrCr = string.IsNullOrWhiteSpace(request.TradeLicenseOrCr) ? null : request.TradeLicenseOrCr.Trim();
        tenant.VatNumber = string.IsNullOrWhiteSpace(request.VatNumber) ? null : request.VatNumber.Trim();
        tenant.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        tenant.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        tenant.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        tenant.CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "BHD" : request.CurrencyCode.Trim().ToUpper();
        tenant.CurrencyDecimals = request.CurrencyDecimals > 0 ? request.CurrencyDecimals : (tenant.CurrencyCode == "BHD" ? 3 : 2);
        tenant.DefaultVatRate = request.DefaultVatRate >= 0 ? request.DefaultVatRate : 10.0m;
        tenant.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var dto = new CompanyProfileDto(
            tenant.Id,
            tenant.CompanyName,
            tenant.TradeLicenseOrCr,
            tenant.VatNumber,
            tenant.Phone,
            tenant.Email,
            tenant.Address,
            tenant.LogoUrl,
            tenant.CurrencyCode,
            tenant.CurrencyDecimals,
            tenant.DefaultVatRate,
            tenant.SubscriptionPlan.ToString(),
            tenant.CreatedAtUtc
        );

        return Ok(new { succeeded = true, data = dto, message = "Company profile updated successfully." });
    }

    [HttpPost("logo")]
    public async Task<IActionResult> UpdateLogo([FromBody] UpdateCompanyLogoRequest request)
    {
        var tenantId = _tenantService.TenantId;
        if (!tenantId.HasValue)
            return Unauthorized(new { succeeded = false, message = "Tenant context not found." });

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        if (tenant == null)
            return NotFound(new { succeeded = false, message = "Company profile not found." });

        tenant.LogoUrl = string.IsNullOrWhiteSpace(request.LogoUrl) ? null : request.LogoUrl.Trim();
        tenant.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            succeeded = true,
            message = "Company logo updated successfully.",
            data = new { logoUrl = tenant.LogoUrl, companyName = tenant.CompanyName }
        });
    }

    [HttpDelete("logo")]
    public async Task<IActionResult> RemoveLogo()
    {
        var tenantId = _tenantService.TenantId;
        if (!tenantId.HasValue)
            return Unauthorized(new { succeeded = false, message = "Tenant context not found." });

        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId.Value);
        if (tenant == null)
            return NotFound(new { succeeded = false, message = "Company profile not found." });

        tenant.LogoUrl = null;
        tenant.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            succeeded = true,
            message = "Company logo removed successfully.",
            data = new { logoUrl = (string?)null, companyName = tenant.CompanyName }
        });
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetActivityLogs([FromQuery] string? category, [FromQuery] string? search)
    {
        var tenantId = _tenantService.TenantId;
        if (!tenantId.HasValue)
            return Unauthorized(new { succeeded = false, message = "Tenant context not found." });

        var logs = new List<CompanyActivityLogDto>();

        // 1. Quotation events
        var quotations = await _context.Quotations
            .Include(q => q.Customer)
            .OrderByDescending(q => q.CreatedAtUtc)
            .Take(50)
            .ToListAsync();

        foreach (var q in quotations)
        {
            logs.Add(new CompanyActivityLogDto(
                q.Id,
                q.ConvertedToInvoiceId.HasValue ? "Converted to Invoice" : "Created Quotation",
                "Quotation",
                q.QuotationNo,
                $"Quotation proposal issued to {q.Customer?.Name ?? "Client"}",
                q.TotalAmount,
                q.Customer?.Name,
                q.Status.ToString(),
                q.CreatedAtUtc
            ));
        }

        // 2. Invoice events
        var invoices = await _context.Invoices
            .Include(i => i.Customer)
            .OrderByDescending(i => i.CreatedAtUtc)
            .Take(50)
            .ToListAsync();

        foreach (var inv in invoices)
        {
            logs.Add(new CompanyActivityLogDto(
                inv.Id,
                inv.QuotationId.HasValue ? "Converted Tax Invoice" : "Created Tax Invoice",
                "Invoice",
                inv.InvoiceNo,
                $"Official Tax Invoice billed to {inv.Customer?.Name ?? "Client"}",
                inv.TotalAmount,
                inv.Customer?.Name,
                inv.Status.ToString(),
                inv.CreatedAtUtc
            ));
        }

        // 3. Payment events
        var payments = await _context.Payments
            .Include(p => p.Invoice)
                .ThenInclude(i => i!.Customer)
            .OrderByDescending(p => p.CreatedAtUtc)
            .Take(50)
            .ToListAsync();

        foreach (var p in payments)
        {
            logs.Add(new CompanyActivityLogDto(
                p.Id,
                "Payment Received",
                "Payment",
                p.ReferenceNo ?? $"PAY-{p.Id.ToString()[..8].ToUpper()}",
                $"Settlement of {p.Amount:N2} against invoice {p.Invoice?.InvoiceNo}",
                p.Amount,
                p.Invoice?.Customer?.Name,
                p.PaymentMethod.ToString(),
                p.CreatedAtUtc
            ));
        }

        // 4. Customer events
        var customers = await _context.Customers
            .OrderByDescending(c => c.CreatedAtUtc)
            .Take(50)
            .ToListAsync();

        foreach (var c in customers)
        {
            logs.Add(new CompanyActivityLogDto(
                c.Id,
                "Client Registered",
                "Customer",
                c.CrNumber ?? $"CLI-{c.Id.ToString()[..8].ToUpper()}",
                $"Registered client {c.Name} ({c.Email ?? "No email"})",
                null,
                c.Name,
                "Active",
                c.CreatedAtUtc
            ));
        }

        var query = logs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && category != "All")
        {
            query = query.Where(l => l.EntityType.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(l =>
                l.ReferenceNo.ToLower().Contains(s) ||
                l.Description.ToLower().Contains(s) ||
                (l.CustomerName != null && l.CustomerName.ToLower().Contains(s)) ||
                l.Action.ToLower().Contains(s)
            );
        }

        var result = query.OrderByDescending(l => l.TimestampUtc).Take(100).ToList();

        return Ok(new { succeeded = true, data = result });
    }
}

