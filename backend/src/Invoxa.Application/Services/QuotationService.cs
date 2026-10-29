using Microsoft.EntityFrameworkCore;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Application.Common.Models;
using Invoxa.Application.DTOs;
using Invoxa.Domain.Entities;
using Invoxa.Domain.Enums;

namespace Invoxa.Application.Services;

public interface IQuotationService
{
    Task<List<QuotationDto>> GetAllAsync(QuotationStatus? status = null);
    Task<QuotationDto?> GetByIdAsync(Guid id);
    Task<ServiceResult<QuotationDto>> CreateAsync(CreateQuotationRequest request);
    Task<ServiceResult<QuotationDto>> UpdateStatusAsync(Guid id, QuotationStatus status);
    Task<ServiceResult<InvoiceDto>> ConvertToInvoiceAsync(Guid quotationId, ConvertQuotationToInvoiceRequest request);
    Task<ServiceResult<QuotationDto>> DuplicateAsync(Guid quotationId);
}

public class QuotationService : IQuotationService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;
    private readonly IInvoiceService _invoiceService;

    public QuotationService(
        IApplicationDbContext context, 
        ICurrentTenantService tenantService,
        IInvoiceService invoiceService)
    {
        _context = context;
        _tenantService = tenantService;
        _invoiceService = invoiceService;
    }

    public async Task<List<QuotationDto>> GetAllAsync(QuotationStatus? status = null)
    {
        var query = _context.Quotations
            .AsNoTracking()
            .Include(q => q.Customer)
            .Include(q => q.Items)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(q => q.Status == status.Value);
        }

        var list = await query.OrderByDescending(q => q.QuotationDate).ToListAsync();
        return list.Select(MapToDto).ToList();
    }

    public async Task<QuotationDto?> GetByIdAsync(Guid id)
    {
        var q = await _context.Quotations
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);

        return q == null ? null : MapToDto(q);
    }

    public async Task<ServiceResult<QuotationDto>> CreateAsync(CreateQuotationRequest request)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Id == request.CustomerId);
        if (customer == null)
            return ServiceResult<QuotationDto>.Failure("Customer not found.");

        if (request.Items == null || !request.Items.Any())
            return ServiceResult<QuotationDto>.Failure("Quotation must have at least one line item.");

        var quotationNo = await GenerateNextQuotationNoAsync();

        var quotation = new Quotation
        {
            QuotationNo = quotationNo,
            CustomerId = customer.Id,
            QuotationDate = request.QuotationDate.Kind == DateTimeKind.Utc ? request.QuotationDate : DateTime.SpecifyKind(request.QuotationDate, DateTimeKind.Utc),
            ExpiryDate = request.ExpiryDate.Kind == DateTimeKind.Utc ? request.ExpiryDate : DateTime.SpecifyKind(request.ExpiryDate, DateTimeKind.Utc),
            Status = QuotationStatus.Draft,
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

            quotation.Items.Add(new QuotationItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountPercent = item.DiscountPercent,
                TaxRate = item.TaxRate,
                LineTotal = lineTotal
            });
        }

        quotation.Subtotal = subtotal;
        quotation.TaxAmount = totalTax;
        quotation.TotalAmount = subtotal + totalTax;

        _context.Quotations.Add(quotation);
        await _context.SaveChangesAsync();

        var created = await GetByIdAsync(quotation.Id);
        return ServiceResult<QuotationDto>.Success(created!, "Quotation created successfully.");
    }

    public async Task<ServiceResult<QuotationDto>> UpdateStatusAsync(Guid id, QuotationStatus status)
    {
        var quotation = await _context.Quotations.Include(q => q.Customer).Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
        if (quotation == null)
            return ServiceResult<QuotationDto>.Failure("Quotation not found.");

        quotation.Status = status;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ServiceResult<QuotationDto>.Success(MapToDto(quotation), $"Quotation status updated to {status}.");
    }

    public async Task<ServiceResult<InvoiceDto>> ConvertToInvoiceAsync(Guid quotationId, ConvertQuotationToInvoiceRequest request)
    {
        var quotation = await _context.Quotations
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (quotation == null)
            return ServiceResult<InvoiceDto>.Failure("Quotation not found.");

        if (quotation.ConvertedToInvoiceId.HasValue)
            return ServiceResult<InvoiceDto>.Failure("This quotation has already been converted to an invoice.");

        var invoiceRequest = new CreateInvoiceRequest(
            CustomerId: quotation.CustomerId,
            QuotationId: quotation.Id,
            InvoiceDate: DateTime.UtcNow.Date,
            DueDate: request.DueDate ?? DateTime.UtcNow.Date.AddDays(14),
            Items: quotation.Items.Select(i => new CreateInvoiceItemRequest(
                Description: i.Description,
                Quantity: i.Quantity,
                UnitPrice: i.UnitPrice,
                DiscountPercent: i.DiscountPercent,
                TaxRate: i.TaxRate
            )).ToList(),
            TermsAndConditions: quotation.TermsAndConditions,
            Notes: $"Converted from Quotation {quotation.QuotationNo}. {quotation.Notes}"
        );

        var invoiceResult = await _invoiceService.CreateAsync(invoiceRequest);
        if (!invoiceResult.Succeeded || invoiceResult.Data == null)
            return invoiceResult;

        quotation.Status = QuotationStatus.Accepted;
        quotation.ConvertedToInvoiceId = invoiceResult.Data.Id;
        quotation.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return invoiceResult;
    }

    public async Task<ServiceResult<QuotationDto>> DuplicateAsync(Guid quotationId)
    {
        var original = await _context.Quotations
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.Id == quotationId);

        if (original == null)
            return ServiceResult<QuotationDto>.Failure("Quotation not found.");

        var newQuotationReq = new CreateQuotationRequest(
            CustomerId: original.CustomerId,
            QuotationDate: DateTime.UtcNow.Date,
            ExpiryDate: DateTime.UtcNow.Date.AddDays(30),
            Items: original.Items.Select(i => new CreateQuotationItemRequest(
                Description: i.Description,
                Quantity: i.Quantity,
                UnitPrice: i.UnitPrice,
                DiscountPercent: i.DiscountPercent,
                TaxRate: i.TaxRate
            )).ToList(),
            TermsAndConditions: original.TermsAndConditions,
            Notes: $"Duplicated from {original.QuotationNo}"
        );

        return await CreateAsync(newQuotationReq);
    }

    private async Task<string> GenerateNextQuotationNoAsync()
    {
        var year = DateTime.UtcNow.Year;
        var count = await _context.Quotations.CountAsync(q => q.QuotationDate.Year == year);
        return $"QT-{year}-{(count + 1):D6}";
    }

    private static QuotationDto MapToDto(Quotation q) =>
        new(
            q.Id,
            q.QuotationNo,
            q.CustomerId,
            q.Customer?.Name ?? "Unknown",
            q.QuotationDate,
            q.ExpiryDate,
            q.Status,
            q.Subtotal,
            q.DiscountAmount,
            q.TaxRate,
            q.TaxAmount,
            q.TotalAmount,
            q.TermsAndConditions,
            q.Notes,
            q.ConvertedToInvoiceId,
            q.Items.Select(i => new QuotationItemDto(
                i.Id,
                i.Description,
                i.Quantity,
                i.UnitPrice,
                i.DiscountPercent,
                i.TaxRate,
                i.LineTotal
            )).ToList()
        );
}
