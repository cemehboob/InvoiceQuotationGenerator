using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Invoxa.Application.Services;

namespace Invoxa.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics()
    {
        var metrics = await _dashboardService.GetDashboardMetricsAsync();
        return Ok(new { succeeded = true, data = metrics });
    }
}
