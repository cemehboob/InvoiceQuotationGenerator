using Invoxa.Domain.Enums;

namespace Invoxa.Application.DTOs;

public record PaymentDto(
    Guid Id,
    Guid InvoiceId,
    string InvoiceNo,
    decimal Amount,
    DateTime PaymentDate,
    PaymentMethod PaymentMethod,
    string? ReferenceNo,
    string? Notes
);

public record RecordPaymentRequest(
    Guid InvoiceId,
    decimal Amount,
    DateTime PaymentDate,
    PaymentMethod PaymentMethod,
    string? ReferenceNo,
    string? Notes
);
