using Invoxa.Domain.Common;
using Invoxa.Domain.Enums;

namespace Invoxa.Domain.Entities;

public class Quotation : BaseTenantEntity
{
    public string QuotationNo { get; set; } = string.Empty; // e.g. QT-2026-000001
    public Guid CustomerId { get; set; }
    public DateTime QuotationDate { get; set; } = DateTime.UtcNow.Date;
    public DateTime ExpiryDate { get; set; } = DateTime.UtcNow.Date.AddDays(30);
    public QuotationStatus Status { get; set; } = QuotationStatus.Draft;
    
    // Financial calculations
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxRate { get; set; } = 10.0m;
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }

    public string? TermsAndConditions { get; set; }
    public string? Notes { get; set; }
    public Guid? ConvertedToInvoiceId { get; set; }

    // Navigation
    public Tenant? Tenant { get; set; }
    public Customer? Customer { get; set; }
    public ICollection<QuotationItem> Items { get; set; } = new List<QuotationItem>();
    public Invoice? ConvertedToInvoice { get; set; }
}

public class QuotationItem : BaseEntity
{
    public Guid QuotationId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; } = 0;
    public decimal TaxRate { get; set; } = 10.0m;
    public decimal LineTotal { get; set; }

    // Navigation
    public Quotation? Quotation { get; set; }
}
