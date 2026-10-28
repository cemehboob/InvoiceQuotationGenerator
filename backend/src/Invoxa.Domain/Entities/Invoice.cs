using Invoxa.Domain.Common;
using Invoxa.Domain.Enums;

namespace Invoxa.Domain.Entities;

public class Invoice : BaseTenantEntity
{
    public string InvoiceNo { get; set; } = string.Empty; // e.g. INV-2026-000001
    public Guid CustomerId { get; set; }
    public Guid? QuotationId { get; set; } // Set if converted from quotation

    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow.Date;
    public DateTime DueDate { get; set; } = DateTime.UtcNow.Date.AddDays(14);
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;

    // Financial calculations
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRate { get; set; } = 10.0m;
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }

    public string? QrCodePayload { get; set; }
    public string? TermsAndConditions { get; set; }
    public string? Notes { get; set; }
    public string? PdfUrl { get; set; }

    // Navigation
    public Tenant? Tenant { get; set; }
    public Customer? Customer { get; set; }
    public Quotation? SourceQuotation { get; set; }
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public class InvoiceItem : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; } = 0;
    public decimal TaxRate { get; set; } = 10.0m;
    public decimal LineTotal { get; set; }

    // Navigation
    public Invoice? Invoice { get; set; }
}
