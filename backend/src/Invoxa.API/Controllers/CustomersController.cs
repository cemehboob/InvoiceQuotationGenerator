using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Invoxa.Application.DTOs;
using Invoxa.Application.Services;

namespace Invoxa.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var customers = await _customerService.GetAllAsync(search);
        return Ok(new { succeeded = true, data = customers });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var customer = await _customerService.GetByIdAsync(id);
        if (customer == null)
            return NotFound(new { succeeded = false, message = "Customer not found." });

        return Ok(new { succeeded = true, data = customer });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request)
    {
        var result = await _customerService.CreateAsync(request);
        if (!result.Succeeded)
            return BadRequest(result);

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerRequest request)
    {
        var result = await _customerService.UpdateAsync(id, request);
        if (!result.Succeeded)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _customerService.DeleteAsync(id);
        if (!result.Succeeded)
            return BadRequest(result);

        return Ok(result);
    }
}
