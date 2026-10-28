using Invoxa.Application.Common.Interfaces;

namespace Invoxa.API.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate _next)
    {
        this._next = _next;
    }

    public async Task InvokeAsync(HttpContext context, ICurrentTenantService tenantService)
    {
        // 1. Try to read tenant from authenticated user claims
        var tenantClaim = context.User.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var tenantIdFromClaim))
        {
            tenantService.SetTenant(tenantIdFromClaim);
        }
        // 2. Fallback to X-Tenant-ID header (useful for onboarding/external webhooks)
        else if (context.Request.Headers.TryGetValue("X-Tenant-ID", out var headerVal))
        {
            if (Guid.TryParse(headerVal.FirstOrDefault(), out var tenantIdFromHeader))
            {
                tenantService.SetTenant(tenantIdFromHeader);
            }
        }

        await _next(context);
    }
}
