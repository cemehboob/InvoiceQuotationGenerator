using Microsoft.EntityFrameworkCore;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Domain.Common;
using Invoxa.Domain.Entities;

namespace Invoxa.Infrastructure.Persistence;

public class AppDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentTenantService _tenantService;

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        ICurrentTenantService tenantService) : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<QuotationItem> QuotationItems => Set<QuotationItem>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply Global Multi-Tenant Query Filter for all entities deriving from BaseTenantEntity
        modelBuilder.Entity<User>().HasQueryFilter(e => !_tenantService.TenantId.HasValue || e.TenantId == _tenantService.TenantId.Value);
        modelBuilder.Entity<Customer>().HasQueryFilter(e => !_tenantService.TenantId.HasValue || e.TenantId == _tenantService.TenantId.Value);
        modelBuilder.Entity<Quotation>().HasQueryFilter(e => !_tenantService.TenantId.HasValue || e.TenantId == _tenantService.TenantId.Value);
        modelBuilder.Entity<Invoice>().HasQueryFilter(e => !_tenantService.TenantId.HasValue || e.TenantId == _tenantService.TenantId.Value);
        modelBuilder.Entity<Payment>().HasQueryFilter(e => !_tenantService.TenantId.HasValue || e.TenantId == _tenantService.TenantId.Value);

        // Global Decimal Precision for monetary figures (BHD 3 decimals + international 4 decimals)
        foreach (var property in modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(4);
        }

        // Entity Configurations & Unique Constraints
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CompanyName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CurrencyCode).HasMaxLength(10).HasDefaultValue("BHD");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
            entity.HasIndex(e => new { e.TenantId, e.Email }).IsUnique();
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => new { e.TenantId, e.Name });
        });

        modelBuilder.Entity<Quotation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.QuotationNo).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => new { e.TenantId, e.QuotationNo }).IsUnique();
            entity.HasMany(e => e.Items).WithOne(i => i.Quotation).HasForeignKey(i => i.QuotationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.InvoiceNo).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => new { e.TenantId, e.InvoiceNo }).IsUnique();
            entity.HasMany(e => e.Items).WithOne(i => i.Invoice).HasForeignKey(i => i.InvoiceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(e => e.Payments).WithOne(p => p.Invoice).HasForeignKey(p => p.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.InvoiceId });
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantService.TenantId;

        foreach (var entry in ChangeTracker.Entries<BaseTenantEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.TenantId == Guid.Empty && tenantId.HasValue)
                {
                    entry.Entity.TenantId = tenantId.Value;
                }
                entry.Entity.CreatedAtUtc = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CreatedAtUtc == default)
            {
                entry.Entity.CreatedAtUtc = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
