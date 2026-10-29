using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Application.Services;
using Invoxa.Infrastructure.Persistence;
using Invoxa.Infrastructure.Services;

namespace Invoxa.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            options.UseSnakeCaseNamingConvention();

            if (!string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseNpgsql(connectionString, b =>
                {
                    b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                });
            }
            else
            {
                // Fallback to InMemory for fast local unit testing if connection string is omitted
                options.UseInMemoryDatabase("InvoxaTestDb");
            }
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // Scoped tenant service to carry tenant context per request
        services.AddScoped<CurrentTenantService>();
        services.AddScoped<ICurrentTenantService>(sp => sp.GetRequiredService<CurrentTenantService>());

        // Core Infrastructure & Application Services
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IPdfGeneratorService, QuestPdfInvoiceGenerator>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<IQuotationService, QuotationService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IDashboardService, DashboardService>();

        return services;
    }
}
