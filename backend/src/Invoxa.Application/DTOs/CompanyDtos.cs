namespace Invoxa.Application.DTOs;

public record CompanyProfileDto(
    Guid Id,
    string CompanyName,
    string? TradeLicenseOrCr,
    string? VatNumber,
    string? Phone,
    string? Email,
    string? Address,
    string? LogoUrl,
    string CurrencyCode,
    int CurrencyDecimals,
    decimal DefaultVatRate,
    string SubscriptionPlan,
    DateTime CreatedAtUtc
);

public record UpdateCompanyProfileRequest(
    string CompanyName,
    string? TradeLicenseOrCr,
    string? VatNumber,
    string? Phone,
    string? Email,
    string? Address,
    string CurrencyCode,
    int CurrencyDecimals,
    decimal DefaultVatRate
);

public record UpdateCompanyLogoRequest(
    string? LogoUrl
);

public record CompanyActivityLogDto(
    Guid Id,
    string Action,
    string EntityType,
    string ReferenceNo,
    string Description,
    decimal? Amount,
    string? CustomerName,
    string Status,
    DateTime TimestampUtc
);

