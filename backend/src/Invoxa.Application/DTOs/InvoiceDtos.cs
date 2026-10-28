using Invoxa.Domain.Enums;

namespace Invoxa.Application.DTOs;

public record InvoiceItemDto(
    Guid Id,
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountPercent,
    decimal TaxRate,
    decimal LineTotal
);

public record InvoiceDto(
    Guid Id,
    string InvoiceNo,
    Guid CustomerId,
    string CustomerName,
    Guid? QuotationId,
    DateTime InvoiceDate,
    DateTime DueDate,
    InvoiceStatus Status,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal TaxRate,
    decimal TaxAmount,
    decimal TotalAmount,
    decimal PaidAmount,
    decimal BalanceAmount,
    string? TermsAndConditions,
    string? Notes,
    string? PdfUrl,
    List<InvoiceItemDto> Items,
    List<PaymentDto> Payments
);

public record CreateInvoiceItemRequest(
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal DiscountPercent = 0,
    decimal TaxRate = 10.0m
);

public record CreateInvoiceRequest(
    Guid CustomerId,
    Guid? QuotationId,
    DateTime InvoiceDate,
    DateTime DueDate,
    List<CreateInvoiceItemRequest> Items,
    string? TermsAndConditions,
    string? Notes
);

public record ConvertQuotationToInvoiceRequest(
    DateTime? DueDate
);
