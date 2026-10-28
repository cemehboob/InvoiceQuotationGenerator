using Microsoft.EntityFrameworkCore;
using Invoxa.Domain.Entities;

namespace Invoxa.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<User> Users { get; }
    DbSet<Customer> Customers { get; }
    DbSet<Quotation> Quotations { get; }
    DbSet<QuotationItem> QuotationItems { get; }
    DbSet<Invoice> Invoices { get; }
    DbSet<InvoiceItem> InvoiceItems { get; }
    DbSet<Payment> Payments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
