using Invoxa.Application.Common.Interfaces;

namespace Invoxa.Infrastructure.Services;

public class CurrentTenantService : ICurrentTenantService
{
    public Guid? TenantId { get; private set; }

    public void SetTenant(Guid tenantId)
    {
        TenantId = tenantId;
    }
}
