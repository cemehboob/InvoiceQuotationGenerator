using Invoxa.Domain.Common;
using Invoxa.Domain.Enums;

namespace Invoxa.Domain.Entities;

public class Tenant : BaseEntity
{
    public string CompanyName { get; set; } = string.Empty;
    public string? TradeLicenseOrCr { get; set; }
    public string? VatNumber { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string CurrencyCode { get; set; } = "BHD"; // Default GCC / Bahrain
    public int CurrencyDecimals { get; set; } = 3;   // BHD has 3 decimals (e.g. 1.250 BHD)
    public decimal DefaultVatRate { get; set; } = 10.0m; // Standard Bahrain VAT rate 10%
    public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Free;
    public bool IsActive { get; set; } = true;

    // Navigation collections
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Customer> Customers { get; set; } = new List<Customer>();
    public ICollection<Quotation> Quotations { get; set; } = new List<Quotation>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
