namespace Invoxa.Domain.Common;

public interface IAuditableEntity
{
    string? CreatedBy { get; set; }
    string? LastModifiedBy { get; set; }
}
