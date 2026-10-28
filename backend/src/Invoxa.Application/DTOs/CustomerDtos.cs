namespace Invoxa.Application.DTOs;

public record CustomerDto(
    Guid Id,
    string Name,
    string? ContactPerson,
    string? Email,
    string? Phone,
    string? Address,
    string? VatNumber,
    string? CrNumber,
    string? Notes,
    DateTime CreatedAtUtc
);

public record CreateCustomerRequest(
    string Name,
    string? ContactPerson,
    string? Email,
    string? Phone,
    string? Address,
    string? VatNumber,
    string? CrNumber,
    string? Notes
);

public record UpdateCustomerRequest(
    string Name,
    string? ContactPerson,
    string? Email,
    string? Phone,
    string? Address,
    string? VatNumber,
    string? CrNumber,
    string? Notes
);
