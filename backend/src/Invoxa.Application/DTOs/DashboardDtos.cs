namespace Invoxa.Application.DTOs;

public record DashboardMetricsDto(
    decimal TodaySales,
    decimal MonthlySales,
    decimal AnnualSales,
    decimal OutstandingBalance,
    int PaidInvoicesCount,
    int PendingInvoicesCount,
    int OverdueInvoicesCount,
    int TotalCustomersCount,
    List<MonthlySalesChartItemDto> MonthlySalesTrend,
    List<TopCustomerDto> TopCustomers,
    List<RecentInvoiceDto> RecentInvoices
);

public record MonthlySalesChartItemDto(
    string Month,
    decimal Amount
);

public record TopCustomerDto(
    Guid CustomerId,
    string CustomerName,
    int TotalInvoices,
    decimal TotalSpent
);

public record RecentInvoiceDto(
    Guid InvoiceId,
    string InvoiceNo,
    string CustomerName,
    DateTime InvoiceDate,
    decimal TotalAmount,
    string Status
);
