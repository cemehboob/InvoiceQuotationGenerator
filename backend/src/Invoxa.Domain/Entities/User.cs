using Invoxa.Domain.Common;
using Invoxa.Domain.Enums;

namespace Invoxa.Domain.Entities;

public class User : BaseTenantEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Staff;
    public bool IsActive { get; set; } = true;

    // Navigation
    public Tenant? Tenant { get; set; }
}
