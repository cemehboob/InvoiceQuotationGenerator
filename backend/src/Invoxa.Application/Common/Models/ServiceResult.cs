namespace Invoxa.Application.Common.Models;

public class ServiceResult<T>
{
    public bool Succeeded { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ServiceResult<T> Success(T data, string? message = null) =>
        new() { Succeeded = true, Data = data, Message = message };

    public static ServiceResult<T> Failure(string error) =>
        new() { Succeeded = false, Errors = new List<string> { error } };

    public static ServiceResult<T> Failure(List<string> errors) =>
        new() { Succeeded = false, Errors = errors };
}
