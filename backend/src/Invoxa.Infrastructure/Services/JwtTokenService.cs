using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Invoxa.Application.Common.Interfaces;
using Invoxa.Domain.Entities;

namespace Invoxa.Infrastructure.Services;

public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(User user, Tenant tenant)
    {
        var secret = _configuration["Jwt:Secret"] ?? "InvoxaSecretKeyMustBeAtLeast32CharactersLong2026!";
        var issuer = _configuration["Jwt:Issuer"] ?? "InvoxaAPI";
        var audience = _configuration["Jwt:Audience"] ?? "InvoxaClient";
        var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var exp) ? exp : 1440;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.FullName),
            new Claim("tenant_id", tenant.Id.ToString()),
            new Claim("company_name", tenant.CompanyName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("currency", tenant.CurrencyCode),
            new Claim("decimals", tenant.CurrencyDecimals.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
