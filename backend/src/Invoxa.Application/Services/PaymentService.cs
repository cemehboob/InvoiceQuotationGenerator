using Microsoft.EntityFrameworkCore;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Application.Common.Models;
using Invoxa.Application.DTOs;
using Invoxa.Domain.Entities;

namespace Invoxa.Application.Services;

public interface IPaymentService
{
    Task<List<PaymentDto>> GetAllAsync(Guid? invoiceId = null);
    Task<ServiceResult<PaymentDto>> RecordPaymentAsync(RecordPaymentRequest request);
}

public class PaymentService : IPaymentService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;
    private readonly IInvoiceService _invoiceService;

    public PaymentService(
        IApplicationDbContext context,
        ICurrentTenantService tenantService,
        IInvoiceService invoiceService)
    {
        _context = context;
        _tenantService = tenantService;
        _invoiceService = invoiceService;
    }

    public async Task<List<PaymentDto>> GetAllAsync(Guid? invoiceId = null)
    {
        var query = _context.Payments
            .AsNoTracking()
            .Include(p => p.Invoice)
            .AsQueryable();

        if (invoiceId.HasValue)
            query = query.Where(p => p.InvoiceId == invoiceId.Value);

        var list = await query.OrderByDescending(p => p.PaymentDate).ToListAsync();

        return list.Select(p => new PaymentDto(
            p.Id,
            p.InvoiceId,
            p.Invoice?.InvoiceNo ?? "Unknown",
            p.Amount,
            p.PaymentDate,
            p.PaymentMethod,
            p.ReferenceNo,
            p.Notes
        )).ToList();
    }

    public async Task<ServiceResult<PaymentDto>> RecordPaymentAsync(RecordPaymentRequest request)
    {
        if (request.Amount <= 0)
            return ServiceResult<PaymentDto>.Failure("Payment amount must be greater than zero.");

        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == request.InvoiceId);
        if (invoice == null)
            return ServiceResult<PaymentDto>.Failure("Invoice not found.");

        if (request.Amount > invoice.BalanceAmount)
            return ServiceResult<PaymentDto>.Failure($"Payment amount ({request.Amount}) cannot exceed outstanding balance ({invoice.BalanceAmount}).");

        var payment = new Payment
        {
            InvoiceId = invoice.Id,
            Amount = request.Amount,
            PaymentDate = request.PaymentDate.Kind == DateTimeKind.Utc ? request.PaymentDate : DateTime.SpecifyKind(request.PaymentDate, DateTimeKind.Utc),
            PaymentMethod = request.PaymentMethod,
            ReferenceNo = request.ReferenceNo,
            Notes = request.Notes
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        // Refresh invoice payment statuses and balances
        await _invoiceService.RefreshBalancesAsync(invoice.Id);

        var dto = new PaymentDto(
            payment.Id,
            payment.InvoiceId,
            invoice.InvoiceNo,
            payment.Amount,
            payment.PaymentDate,
            payment.PaymentMethod,
            payment.ReferenceNo,
            payment.Notes
        );

        return ServiceResult<PaymentDto>.Success(dto, "Payment recorded successfully.");
    }
}
