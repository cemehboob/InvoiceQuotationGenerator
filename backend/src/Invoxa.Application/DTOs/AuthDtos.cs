using Invoxa.Domain.Enums;

namespace Invoxa.Application.DTOs;

public record RegisterCompanyRequest(
    string CompanyName,
    string AdminFullName,
    string Email,
    string Password,
    string? Phone,
    string? CrNumber,
    string? VatNumber,
    string CurrencyCode = "BHD"
);

public record LoginRequest(
    string Email,
    string Password
);

public record AuthResponse(
    string Token,
    Guid UserId,
    string FullName,
    string Email,
    UserRole Role,
    Guid TenantId,
    string CompanyName,
    string CurrencyCode,
    int CurrencyDecimals,
    string? LogoUrl = null
);
