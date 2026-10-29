using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Domain.Entities;

namespace Invoxa.Infrastructure.Services;

public class QuestPdfInvoiceGenerator : IPdfGeneratorService
{
    static QuestPdfInvoiceGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public Task<byte[]> GenerateInvoicePdfAsync(Invoice invoice, Tenant tenant)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(35);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken3));

                // Header
                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col => RenderCompanyHeader(col, tenant, Colors.Blue.Darken3));

                    row.ConstantItem(180).Column(col =>
                    {
                        col.Item().AlignRight().Text("TAX INVOICE").FontSize(22).Bold().FontColor(Colors.Grey.Darken4);
                        col.Item().AlignRight().Text($"Invoice #: {invoice.InvoiceNo}").Bold();
                        col.Item().AlignRight().Text($"Date: {invoice.InvoiceDate:dd MMM yyyy}");
                        col.Item().AlignRight().Text($"Due Date: {invoice.DueDate:dd MMM yyyy}");
                        col.Item().AlignRight().Text($"Status: {invoice.Status}").FontColor(invoice.Status == Domain.Enums.InvoiceStatus.Paid ? Colors.Green.Darken2 : Colors.Orange.Darken2).Bold();
                    });
                });

                // Content
                page.Content().PaddingVertical(20).Column(col =>
                {
                    // Bill To
                    col.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(10).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("BILL TO:").FontSize(10).Bold().FontColor(Colors.Grey.Darken2);
                            c.Item().Text(invoice.Customer?.Name ?? "Valued Customer").FontSize(12).Bold();
                            if (!string.IsNullOrWhiteSpace(invoice.Customer?.ContactPerson))
                                c.Item().Text($"Attn: {invoice.Customer.ContactPerson}");
                            if (!string.IsNullOrWhiteSpace(invoice.Customer?.Address))
                                c.Item().Text(invoice.Customer.Address);
                            if (!string.IsNullOrWhiteSpace(invoice.Customer?.VatNumber))
                                c.Item().Text($"VAT / Tax ID: {invoice.Customer.VatNumber}");
                        });
                    });

                    col.Item().PaddingTop(15);

                    // Line Items Table
                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(30);
                            columns.RelativeColumn(4);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1.5f);
                            columns.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("#").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Blue.Darken3).Padding(5).Text("Description").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Blue.Darken3).Padding(5).AlignRight().Text("Qty").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Blue.Darken3).Padding(5).AlignRight().Text($"Unit ({tenant.CurrencyCode})").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Blue.Darken3).Padding(5).AlignRight().Text($"Total ({tenant.CurrencyCode})").FontColor(Colors.White).Bold();
                        });

                        int idx = 1;
                        foreach (var item in invoice.Items)
                        {
                            var bg = idx % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;

                            table.Cell().Background(bg).Padding(5).Text(idx.ToString());
                            table.Cell().Background(bg).Padding(5).Text(item.Description);
                            table.Cell().Background(bg).Padding(5).AlignRight().Text(item.Quantity.ToString("F2"));
                            table.Cell().Background(bg).Padding(5).AlignRight().Text(item.UnitPrice.ToString("F3"));
                            table.Cell().Background(bg).Padding(5).AlignRight().Text(item.LineTotal.ToString("F3"));

                            idx++;
                        }
                    });

                    col.Item().PaddingTop(15);

                    // Totals & Settlement
                    col.Item().Row(row =>
                    {
                        row.RelativeItem(2).Column(notesCol =>
                        {
                            if (!string.IsNullOrWhiteSpace(invoice.Notes))
                            {
                                notesCol.Item().Text("Notes:").Bold();
                                notesCol.Item().Text(invoice.Notes).FontSize(9);
                            }
                            if (!string.IsNullOrWhiteSpace(invoice.TermsAndConditions))
                            {
                                notesCol.Item().PaddingTop(5).Text("Terms & Conditions:").Bold();
                                notesCol.Item().Text(invoice.TermsAndConditions).FontSize(9);
                            }
                        });

                        row.RelativeItem(1.5f).Column(totalsCol =>
                        {
                            totalsCol.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Subtotal:");
                                r.RelativeItem().AlignRight().Text($"{invoice.Subtotal:F3} {tenant.CurrencyCode}");
                            });

                            if (invoice.DiscountAmount > 0)
                            {
                                totalsCol.Item().Row(r =>
                                {
                                    r.RelativeItem().Text("Discount:");
                                    r.RelativeItem().AlignRight().Text($"-{invoice.DiscountAmount:F3} {tenant.CurrencyCode}");
                                });
                            }

                            totalsCol.Item().Row(r =>
                            {
                                r.RelativeItem().Text($"VAT ({invoice.TaxRate:0}%):");
                                r.RelativeItem().AlignRight().Text($"{invoice.TaxAmount:F3} {tenant.CurrencyCode}");
                            });

                            totalsCol.Item().BorderTop(1).BorderColor(Colors.Grey.Lighten1).PaddingTop(5).Row(r =>
                            {
                                r.RelativeItem().Text("Total Amount:").Bold();
                                r.RelativeItem().AlignRight().Text($"{invoice.TotalAmount:F3} {tenant.CurrencyCode}").Bold();
                            });

                            totalsCol.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Paid Amount:");
                                r.RelativeItem().AlignRight().Text($"{invoice.PaidAmount:F3} {tenant.CurrencyCode}");
                            });

                            totalsCol.Item().Background(Colors.Grey.Lighten3).Padding(4).Row(r =>
                            {
                                r.RelativeItem().Text("Balance Due:").Bold().FontColor(Colors.Red.Darken2);
                                r.RelativeItem().AlignRight().Text($"{invoice.BalanceAmount:F3} {tenant.CurrencyCode}").Bold().FontColor(Colors.Red.Darken2);
                            });
                        });
                    });
                });

                // Footer
                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generated via ");
                    x.Span("Invoxa SaaS").Bold();
                    x.Span(" | Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        });

        return Task.FromResult(document.GeneratePdf());
    }

    public Task<byte[]> GenerateQuotationPdfAsync(Quotation quotation, Tenant tenant)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(35);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Grey.Darken3));

                // Header
                page.Header().Row(row =>
                {
                    row.RelativeItem().Column(col => RenderCompanyHeader(col, tenant, Colors.Indigo.Darken3));

                    row.ConstantItem(180).Column(col =>
                    {
                        col.Item().AlignRight().Text("PRICE QUOTATION").FontSize(20).Bold().FontColor(Colors.Grey.Darken4);
                        col.Item().AlignRight().Text($"Quote #: {quotation.QuotationNo}").Bold();
                        col.Item().AlignRight().Text($"Date: {quotation.QuotationDate:dd MMM yyyy}");
                        col.Item().AlignRight().Text($"Valid Until: {quotation.ExpiryDate:dd MMM yyyy}");
                        col.Item().AlignRight().Text($"Status: {quotation.Status}").FontColor(Colors.Indigo.Darken2).Bold();
                    });
                });

                page.Content().PaddingVertical(20).Column(col =>
                {
                    col.Item().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingBottom(10).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("QUOTED TO:").FontSize(10).Bold().FontColor(Colors.Grey.Darken2);
                            c.Item().Text(quotation.Customer?.Name ?? "Valued Client").FontSize(12).Bold();
                            if (!string.IsNullOrWhiteSpace(quotation.Customer?.ContactPerson))
                                c.Item().Text($"Attn: {quotation.Customer.ContactPerson}");
                            if (!string.IsNullOrWhiteSpace(quotation.Customer?.Address))
                                c.Item().Text(quotation.Customer.Address);
                        });
                    });

                    col.Item().PaddingTop(15);

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(30);
                            columns.RelativeColumn(4);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1.5f);
                            columns.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Indigo.Darken3).Padding(5).Text("#").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Indigo.Darken3).Padding(5).Text("Description").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Indigo.Darken3).Padding(5).AlignRight().Text("Qty").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Indigo.Darken3).Padding(5).AlignRight().Text($"Unit ({tenant.CurrencyCode})").FontColor(Colors.White).Bold();
                            header.Cell().Background(Colors.Indigo.Darken3).Padding(5).AlignRight().Text($"Total ({tenant.CurrencyCode})").FontColor(Colors.White).Bold();
                        });

                        int idx = 1;
                        foreach (var item in quotation.Items)
                        {
                            var bg = idx % 2 == 0 ? Colors.Grey.Lighten4 : Colors.White;
                            table.Cell().Background(bg).Padding(5).Text(idx.ToString());
                            table.Cell().Background(bg).Padding(5).Text(item.Description);
                            table.Cell().Background(bg).Padding(5).AlignRight().Text(item.Quantity.ToString("F2"));
                            table.Cell().Background(bg).Padding(5).AlignRight().Text(item.UnitPrice.ToString("F3"));
                            table.Cell().Background(bg).Padding(5).AlignRight().Text(item.LineTotal.ToString("F3"));
                            idx++;
                        }
                    });

                    col.Item().PaddingTop(15);

                    col.Item().Row(row =>
                    {
                        row.RelativeItem(2).Column(notesCol =>
                        {
                            if (!string.IsNullOrWhiteSpace(quotation.Notes))
                            {
                                notesCol.Item().Text("Notes:").Bold();
                                notesCol.Item().Text(quotation.Notes).FontSize(9);
                            }
                            if (!string.IsNullOrWhiteSpace(quotation.TermsAndConditions))
                            {
                                notesCol.Item().PaddingTop(5).Text("Terms & Conditions:").Bold();
                                notesCol.Item().Text(quotation.TermsAndConditions).FontSize(9);
                            }
                        });

                        row.RelativeItem(1.5f).Column(totalsCol =>
                        {
                            totalsCol.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Subtotal:");
                                r.RelativeItem().AlignRight().Text($"{quotation.Subtotal:F3} {tenant.CurrencyCode}");
                            });

                            totalsCol.Item().Row(r =>
                            {
                                r.RelativeItem().Text($"VAT ({quotation.TaxRate:0}%):");
                                r.RelativeItem().AlignRight().Text($"{quotation.TaxAmount:F3} {tenant.CurrencyCode}");
                            });

                            totalsCol.Item().BorderTop(1).BorderColor(Colors.Grey.Lighten1).PaddingTop(5).Row(r =>
                            {
                                r.RelativeItem().Text("Quotation Total:").Bold();
                                r.RelativeItem().AlignRight().Text($"{quotation.TotalAmount:F3} {tenant.CurrencyCode}").Bold();
                            });
                        });
                    });
                });

                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Generated via ");
                    x.Span("Invoxa SaaS").Bold();
                    x.Span(" | Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        });

        return Task.FromResult(document.GeneratePdf());
    }

    private static void RenderCompanyHeader(ColumnDescriptor col, Tenant tenant, string primaryColor)
    {
        if (!string.IsNullOrWhiteSpace(tenant.LogoUrl))
        {
            try
            {
                byte[]? logoBytes = null;
                if (tenant.LogoUrl.StartsWith("data:image", StringComparison.OrdinalIgnoreCase))
                {
                    var commaIndex = tenant.LogoUrl.IndexOf(',');
                    if (commaIndex > 0)
                    {
                        var base64 = tenant.LogoUrl[(commaIndex + 1)..];
                        logoBytes = Convert.FromBase64String(base64);
                    }
                }
                else if (File.Exists(tenant.LogoUrl))
                {
                    logoBytes = File.ReadAllBytes(tenant.LogoUrl);
                }

                if (logoBytes != null && logoBytes.Length > 0)
                {
                    col.Item().PaddingBottom(4).MaxHeight(48).MaxWidth(140).Image(logoBytes).FitArea();
                }
            }
            catch
            {
                // Fallback to text header cleanly
            }
        }

        col.Item().Text(tenant.CompanyName).FontSize(18).Bold().FontColor(primaryColor);
        if (!string.IsNullOrWhiteSpace(tenant.TradeLicenseOrCr))
            col.Item().Text($"CR / License: {tenant.TradeLicenseOrCr}").FontSize(9);
        if (!string.IsNullOrWhiteSpace(tenant.VatNumber))
            col.Item().Text($"VAT No: {tenant.VatNumber}").FontSize(9);
        if (!string.IsNullOrWhiteSpace(tenant.Email))
            col.Item().Text($"Email: {tenant.Email}").FontSize(9);
        if (!string.IsNullOrWhiteSpace(tenant.Phone))
            col.Item().Text($"Phone: {tenant.Phone}").FontSize(9);
    }
}
