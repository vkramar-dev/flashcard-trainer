using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public class StatisticsController(IStatisticsService statisticsService) : BaseController
{
    readonly IStatisticsService _statisticsService = statisticsService;

    [Authorize]
    [HttpGet("statistics")]
    public async Task<ActionResult<SetStatisticsModel[]>> Statistics(CT cancellationToken)
    {
        return Ok(await _statisticsService.GetStatisticsAsync(UserName, cancellationToken));
    }
}