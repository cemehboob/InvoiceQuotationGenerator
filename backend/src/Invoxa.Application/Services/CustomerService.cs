using Microsoft.EntityFrameworkCore;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Application.Common.Models;
using Invoxa.Application.DTOs;
using Invoxa.Domain.Entities;

namespace Invoxa.Application.Services;

public interface ICustomerService
{
    Task<List<CustomerDto>> GetAllAsync(string? search = null);
    Task<CustomerDto?> GetByIdAsync(Guid id);
    Task<ServiceResult<CustomerDto>> CreateAsync(CreateCustomerRequest request);
    Task<ServiceResult<CustomerDto>> UpdateAsync(Guid id, UpdateCustomerRequest request);
    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}

public class CustomerService : ICustomerService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentTenantService _tenantService;

    public CustomerService(IApplicationDbContext context, ICurrentTenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<List<CustomerDto>> GetAllAsync(string? search = null)
    {
        var query = _context.Customers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(s) ||
                                     (c.Email != null && c.Email.ToLower().Contains(s)) ||
                                     (c.Phone != null && c.Phone.Contains(s)));
        }

        return await query
            .OrderByDescending(c => c.CreatedAtUtc)
            .Select(c => new CustomerDto(
                c.Id,
                c.Name,
                c.ContactPerson,
                c.Email,
                c.Phone,
                c.Address,
                c.VatNumber,
                c.CrNumber,
                c.Notes,
                c.CreatedAtUtc
            ))
            .ToListAsync();
    }

    public async Task<CustomerDto?> GetByIdAsync(Guid id)
    {
        var c = await _context.Customers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (c == null) return null;

        return new CustomerDto(
            c.Id,
            c.Name,
            c.ContactPerson,
            c.Email,
            c.Phone,
            c.Address,
            c.VatNumber,
            c.CrNumber,
            c.Notes,
            c.CreatedAtUtc
        );
    }

    public async Task<ServiceResult<CustomerDto>> CreateAsync(CreateCustomerRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return ServiceResult<CustomerDto>.Failure("Customer name is required.");

        var customer = new Customer
        {
            Name = request.Name.Trim(),
            ContactPerson = request.ContactPerson,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            VatNumber = request.VatNumber,
            CrNumber = request.CrNumber,
            Notes = request.Notes
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        var dto = new CustomerDto(
            customer.Id,
            customer.Name,
            customer.ContactPerson,
            customer.Email,
            customer.Phone,
            customer.Address,
            customer.VatNumber,
            customer.CrNumber,
            customer.Notes,
            customer.CreatedAtUtc
        );

        return ServiceResult<CustomerDto>.Success(dto, "Customer created successfully.");
    }

    public async Task<ServiceResult<CustomerDto>> UpdateAsync(Guid id, UpdateCustomerRequest request)
    {
        var customer = await _context.Customers.FirstOrDefaultAsync(x => x.Id == id);
        if (customer == null)
            return ServiceResult<CustomerDto>.Failure("Customer not found.");

        customer.Name = request.Name.Trim();
        customer.ContactPerson = request.ContactPerson;
        customer.Email = request.Email;
        customer.Phone = request.Phone;
        customer.Address = request.Address;
        customer.VatNumber = request.VatNumber;
        customer.CrNumber = request.CrNumber;
        customer.Notes = request.Notes;
        customer.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var dto = new CustomerDto(
            customer.Id,
            customer.Name,
            customer.ContactPerson,
            customer.Email,
            customer.Phone,
            customer.Address,
            customer.VatNumber,
            customer.CrNumber,
            customer.Notes,
            customer.CreatedAtUtc
        );

        return ServiceResult<CustomerDto>.Success(dto, "Customer updated successfully.");
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var customer = await _context.Customers
            .Include(c => c.Invoices)
            .Include(c => c.Quotations)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (customer == null)
            return ServiceResult<bool>.Failure("Customer not found.");

        if (customer.Invoices.Any())
            return ServiceResult<bool>.Failure("Cannot delete a customer who has existing invoices.");

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();

        return ServiceResult<bool>.Success(true, "Customer deleted successfully.");
    }
}
