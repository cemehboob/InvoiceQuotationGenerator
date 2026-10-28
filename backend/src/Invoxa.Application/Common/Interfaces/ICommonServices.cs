namespace Invoxa.Application.Common.Interfaces;

public interface ICurrentTenantService
{
    Guid? TenantId { get; }
    void SetTenant(Guid tenantId);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Role { get; }
}

public interface ITokenService
{
    string GenerateAccessToken(Domain.Entities.User user, Domain.Entities.Tenant tenant);
}

public interface IPdfGeneratorService
{
    Task<byte[]> GenerateInvoicePdfAsync(Domain.Entities.Invoice invoice, Domain.Entities.Tenant tenant);
    Task<byte[]> GenerateQuotationPdfAsync(Domain.Entities.Quotation quotation, Domain.Entities.Tenant tenant);
}
