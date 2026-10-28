using Microsoft.EntityFrameworkCore;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Application.Common.Models;
using Invoxa.Application.DTOs;
using Invoxa.Domain.Entities;
using Invoxa.Domain.Enums;

namespace Invoxa.Application.Services;

public interface IInvoiceService
{
    Task<List<InvoiceDto>> GetAllAsync(InvoiceStatus? status = null, Guid? customerId = null);
    Task<InvoiceDto?> GetByIdAsync(Guid id);
    Task<ServiceResult<InvoiceDto>> CreateAsync(CreateInvoiceRequest request);
    Task<ServiceResult<InvoiceDto>> UpdateStatusAsync(Guid id, InvoiceStatus status);
    Task<ServiceResult<InvoiceDto>> RefreshBalancesAsync(Guid invoiceId);
    Task<byte[]> GeneratePdfAsync(Guid invoiceId);
}

public class InvoiceService : IInvoiceService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;
    private readonly IPdfGeneratorService _pdfGenerator;

    public InvoiceService(
        IApplicationDbContext context,
        ICurrentTenantService tenantService,
        IPdfGeneratorService pdfGenerator)
    {
        _context = context;
        _tenantService = tenantService;
        _pdfGenerator = pdfGenerator;
    }

    public async Task<List<InvoiceDto>> GetAllAsync(InvoiceStatus? status = null, Guid? customerId = null)
    {
        var query = _context.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(i => i.Status == status.Value);

        if (customerId.HasValue)
            query = query.Where(i => i.CustomerId == customerId.Value);

        var list = await query.OrderByDescending(i => i.InvoiceDate).ToListAsync();
        return list.Select(MapToDto).ToList();
    }

    public async Task<InvoiceDto?> GetByIdAsync(Guid id)
    {
        var i = await _context.Invoices
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Items)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == id);

        return i == null ? null : MapToDto(i);
    }

    public async Task<ServiceResult<InvoiceDto>> CreateAsync(CreateInvoiceRequest request)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (customer == null)
            return ServiceResult<InvoiceDto>.Failure("Customer not found.");

        if (request.Items == null || !request.Items.Any())
            return ServiceResult<InvoiceDto>.Failure("Invoice must contain at least one line item.");

        var invoiceNo = await GenerateNextInvoiceNoAsync();

        var invoice = new Invoice
        {
            InvoiceNo = invoiceNo,
            CustomerId = customer.Id,
            QuotationId = request.QuotationId,
            InvoiceDate = request.InvoiceDate,
            DueDate = request.DueDate,
            Status = InvoiceStatus.Pending,
            TermsAndConditions = request.TermsAndConditions,
            Notes = request.Notes
        };

        decimal subtotal = 0;
        decimal totalTax = 0;

        foreach (var item in request.Items)
        {
            var lineGross = item.Quantity * item.UnitPrice;
            var lineDiscount = lineGross * (item.DiscountPercent / 100m);
            var lineTaxable = lineGross - lineDiscount;
            var lineTax = lineTaxable * (item.TaxRate / 100m);
            var lineTotal = lineTaxable + lineTax;

            subtotal += lineTaxable;
            totalTax += lineTax;

            invoice.Items.Add(new InvoiceItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountPercent = item.DiscountPercent,
                TaxRate = item.TaxRate,
                LineTotal = lineTotal
            });
        }

        invoice.Subtotal = subtotal;
        invoice.TaxAmount = totalTax;
        invoice.TotalAmount = subtotal + totalTax;
        invoice.PaidAmount = 0;
        invoice.BalanceAmount = invoice.TotalAmount;

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        var created = await GetByIdAsync(invoice.Id);
        return ServiceResult<InvoiceDto>.Success(created!, "Invoice created successfully.");
    }

    public async Task<ServiceResult<InvoiceDto>> UpdateStatusAsync(Guid id, InvoiceStatus status)
    {
        var invoice = await _context.Invoices.Include(i => i.Customer).Include(i => i.Items).Include(i => i.Payments).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null)
            return ServiceResult<InvoiceDto>.Failure("Invoice not found.");

        invoice.Status = status;
        invoice.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ServiceResult<InvoiceDto>.Success(MapToDto(invoice), $"Invoice status updated to {status}.");
    }

    public async Task<ServiceResult<InvoiceDto>> RefreshBalancesAsync(Guid invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null)
            return ServiceResult<InvoiceDto>.Failure("Invoice not found.");

        var totalPaid = invoice.Payments.Sum(p => p.Amount);
        invoice.PaidAmount = totalPaid;
        invoice.BalanceAmount = invoice.TotalAmount - totalPaid;

        if (invoice.BalanceAmount <= 0)
        {
            invoice.Status = InvoiceStatus.Paid;
            invoice.BalanceAmount = 0;
        }
        else if (invoice.PaidAmount > 0)
        {
            invoice.Status = InvoiceStatus.PartiallyPaid;
        }
        else if (invoice.DueDate < DateTime.UtcNow.Date)
        {
            invoice.Status = InvoiceStatus.Overdue;
        }
        else
        {
            invoice.Status = InvoiceStatus.Pending;
        }

        invoice.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ServiceResult<InvoiceDto>.Success(MapToDto(invoice));
    }

    public async Task<byte[]> GeneratePdfAsync(Guid invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null)
            throw new KeyNotFoundException($"Invoice {invoiceId} not found.");

        var tenantId = _tenantService.TenantId ?? invoice.TenantId;
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null)
            throw new KeyNotFoundException($"Tenant {tenantId} not found.");

        return await _pdfGenerator.GenerateInvoicePdfAsync(invoice, tenant);
    }

    private async Task<string> GenerateNextInvoiceNoAsync()
    {
        var year = DateTime.UtcNow.Year;
        var count = await _context.Invoices.CountAsync(i => i.InvoiceDate.Year == year);
        return $"INV-{year}-{(count + 1):D6}";
    }

    private static InvoiceDto MapToDto(Invoice i) =>
        new(
            i.Id,
            i.InvoiceNo,
            i.CustomerId,
            i.Customer?.Name ?? "Unknown",
            i.QuotationId,
            i.InvoiceDate,
            i.DueDate,
            i.Status,
            i.Subtotal,
            i.DiscountAmount,
            i.TaxRate,
            i.TaxAmount,
            i.TotalAmount,
            i.PaidAmount,
            i.BalanceAmount,
            i.TermsAndConditions,
            i.Notes,
            i.PdfUrl,
            i.Items.Select(item => new InvoiceItemDto(
                item.Id,
                item.Description,
                item.Quantity,
                item.UnitPrice,
                item.DiscountPercent,
                item.TaxRate,
                item.LineTotal
            )).ToList(),
            i.Payments.Select(p => new PaymentDto(
                p.Id,
                p.InvoiceId,
                i.InvoiceNo,
                p.Amount,
                p.PaymentDate,
                p.PaymentMethod,
                p.ReferenceNo,
                p.Notes
            )).ToList()
        );
}
