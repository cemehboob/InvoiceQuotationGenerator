using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Application.DTOs;
using Invoxa.Domain.Entities;
using Invoxa.Domain.Enums;

namespace Invoxa.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthController(IApplicationDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterCompany([FromBody] RegisterCompanyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CompanyName) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.AdminFullName))
            return BadRequest(new { succeeded = false, message = "Company Name, Admin Full Name, Email, and Password are required." });

        var existingUser = await _context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());
        if (existingUser != null)
            return BadRequest(new { succeeded = false, message = "A user with this email address already exists." });

        // 1. Create Tenant
        var tenant = new Tenant
        {
            CompanyName = request.CompanyName.Trim(),
            TradeLicenseOrCr = string.IsNullOrWhiteSpace(request.CrNumber) ? null : request.CrNumber.Trim(),
            VatNumber = string.IsNullOrWhiteSpace(request.VatNumber) ? null : request.VatNumber.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Email = request.Email.Trim().ToLower(),
            CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "BHD" : request.CurrencyCode.Trim().ToUpper(),
            CurrencyDecimals = request.CurrencyCode?.Trim().ToUpper() == "BHD" ? 3 : 2,
            DefaultVatRate = 10.0m,
            SubscriptionPlan = SubscriptionPlan.Free,
            IsActive = true
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        // 2. Create Admin User
        var adminUser = new User
        {
            TenantId = tenant.Id,
            FullName = request.AdminFullName.Trim(),
            Email = request.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Admin,
            IsActive = true
        };

        _context.Users.Add(adminUser);
        await _context.SaveChangesAsync();

        var token = _tokenService.GenerateAccessToken(adminUser, tenant);

        return Ok(new
        {
            succeeded = true,
            message = "Company and Admin registered successfully.",
            data = new AuthResponse(
                token,
                adminUser.Id,
                adminUser.FullName,
                adminUser.Email,
                adminUser.Role,
                tenant.Id,
                tenant.CompanyName,
                tenant.CurrencyCode,
                tenant.CurrencyDecimals,
                tenant.LogoUrl
            )
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { succeeded = false, message = "Email and Password are required." });

        var user = await _context.Users
            .IgnoreQueryFilters()
            .Include(u => u.Tenant)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { succeeded = false, message = "Invalid email or password." });

        if (!user.IsActive)
            return Unauthorized(new { succeeded = false, message = "User account has been deactivated." });

        var tenant = user.Tenant ?? await _context.Tenants.FirstOrDefaultAsync(t => t.Id == user.TenantId);
        if (tenant == null || !tenant.IsActive)
            return Unauthorized(new { succeeded = false, message = "Tenant organization account is inactive." });

        var token = _tokenService.GenerateAccessToken(user, tenant);

        return Ok(new
        {
            succeeded = true,
            data = new AuthResponse(
                token,
                user.Id,
                user.FullName,
                user.Email,
                user.Role,
                tenant.Id,
                tenant.CompanyName,
                tenant.CurrencyCode,
                tenant.CurrencyDecimals,
                tenant.LogoUrl
            )
        });
    }
}
