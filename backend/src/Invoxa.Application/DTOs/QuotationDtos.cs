using Invoxa.Domain.Enums;

namespace Invoxa.Application.DTOs;

public record QuotationItemDto(
    Guid Id,
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountPercent,
    decimal TaxRate,
    decimal LineTotal
);

public record QuotationDto(
    Guid Id,
    string QuotationNo,
    Guid CustomerId,
    string CustomerName,
    DateTime QuotationDate,
    DateTime ExpiryDate,
    QuotationStatus Status,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TaxRate,
    decimal TaxAmount,
    decimal TotalAmount,
    string? TermsAndConditions,
    string? Notes,
    Guid? ConvertedToInvoiceId,
    List<QuotationItemDto> Items
);

public record CreateQuotationItemRequest(
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountPercent = 0,
    decimal TaxRate = 10.0m
);

public record CreateQuotationRequest(
    Guid CustomerId,
    DateTime QuotationDate,
    DateTime ExpiryDate,
    List<CreateQuotationItemRequest> Items,
    string? TermsAndConditions,
    string? Notes
);

public record UpdateQuotationStatusRequest(
    QuotationStatus Status
);
