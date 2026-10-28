using Invoxa.Domain.Common;
using Invoxa.Domain.Enums;

namespace Invoxa.Domain.Entities;

public class Payment : BaseTenantEntity
{
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.BankTransfer;
    public string? ReferenceNo { get; set; } // BenefitPay Ref, Cheque No, Transaction ID
    public string? Notes { get; set; }

    // Navigation
    public Tenant? Tenant { get; set; }
    public Invoice? Invoice { get; set; }
}
