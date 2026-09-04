using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public sealed class SetsController(ISetsService setsService) : BaseController
{
    readonly ISetsService _setsService = setsService;

    [Authorize]
    [HttpGet("sets")]
    public async Task<ActionResult<SetModel[]>> Sets(CancellationToken cancellationToken)
    {
        return Ok(await _setsService.GetSetsAsync(UserName, cancellationToken));
    }

    [Authorize]
    [HttpGet("set-with-cards")]
    public async Task<ActionResult<SetWithCards>> SetWithCards(int setId, bool shuffle, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    [Authorize]
    [HttpPost("create-or-update")]
    public async Task<ActionResult> CreateOrUpdate(SetWithCards setPayload, CancellationToken cancellationToken)
    {
        await _setsService.CreateOrUpdateAsync(setPayload, UserName, cancellationToken);
        return Ok();
    }
}
