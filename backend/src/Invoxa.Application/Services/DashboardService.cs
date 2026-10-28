using Microsoft.EntityFrameworkCore;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Application.DTOs;
using Invoxa.Domain.Enums;

namespace Invoxa.Application.Services;

public interface IDashboardService
{
    Task<DashboardMetricsDto> GetDashboardMetricsAsync();
}

public class DashboardService : IDashboardService
{
    private readonly IApplicationDbContext _context;

    public DashboardService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardMetricsDto> GetDashboardMetricsAsync()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var startOfYear = new DateTime(now.Year, 1, 1);

        var invoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Customer)
            .ToListAsync();

        var todaySales = invoices.Where(i => i.InvoiceDate >= today).Sum(i => i.TotalAmount);
        var monthlySales = invoices.Where(i => i.InvoiceDate >= startOfMonth).Sum(i => i.TotalAmount);
        var annualSales = invoices.Where(i => i.InvoiceDate >= startOfYear).Sum(i => i.TotalAmount);
        var outstandingBalance = invoices.Sum(i => i.BalanceAmount);

        var paidCount = invoices.Count(i => i.Status == InvoiceStatus.Paid);
        var pendingCount = invoices.Count(i => i.Status == InvoiceStatus.Pending || i.Status == InvoiceStatus.PartiallyPaid);
        var overdueCount = invoices.Count(i => i.Status == InvoiceStatus.Overdue || (i.BalanceAmount > 0 && i.DueDate < today));

        var totalCustomers = await _context.Customers.CountAsync();

        // 6-Month sales trend
        var monthlyTrend = new List<MonthlySalesChartItemDto>();
        for (int i = 5; i >= 0; i--)
        {
            var targetMonth = now.AddMonths(-i);
            var mStart = new DateTime(targetMonth.Year, targetMonth.Month, 1);
            var mEnd = mStart.AddMonths(1).AddTicks(-1);
            var sum = invoices.Where(inv => inv.InvoiceDate >= mStart && inv.InvoiceDate <= mEnd).Sum(inv => inv.TotalAmount);
            monthlyTrend.Add(new MonthlySalesChartItemDto(mStart.ToString("MMM yyyy"), sum));
        }

        // Top 5 customers
        var topCustomers = invoices
            .GroupBy(i => new { i.CustomerId, CustomerName = i.Customer?.Name ?? "Unknown" })
            .Select(g => new TopCustomerDto(
                g.Key.CustomerId,
                g.Key.CustomerName,
                g.Count(),
                g.Sum(x => x.TotalAmount)
            ))
            .OrderByDescending(x => x.TotalSpent)
            .Take(5)
            .ToList();

        // Recent 5 invoices
        var recentInvoices = invoices
            .OrderByDescending(i => i.InvoiceDate)
            .Take(5)
            .Select(i => new RecentInvoiceDto(
                i.Id,
                i.InvoiceNo,
                i.Customer?.Name ?? "Unknown",
                i.InvoiceDate,
                i.TotalAmount,
                i.Status.ToString()
            ))
            .ToList();

        return new DashboardMetricsDto(
            todaySales,
            monthlySales,
            annualSales,
            outstandingBalance,
            paidCount,
            pendingCount,
            overdueCount,
            totalCustomers,
            monthlyTrend,
            topCustomers,
            recentInvoices
        );
    }
}
