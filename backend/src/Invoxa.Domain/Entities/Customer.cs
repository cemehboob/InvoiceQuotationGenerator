using Invoxa.Domain.Common;

namespace Invoxa.Domain.Entities;

public class Customer : BaseTenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? VatNumber { get; set; }
    public string? CrNumber { get; set; }
    public string? Notes { get; set; }

    // Navigation
    public Tenant? Tenant { get; set; }
    public ICollection<Quotation> Quotations { get; set; } = new List<Quotation>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
