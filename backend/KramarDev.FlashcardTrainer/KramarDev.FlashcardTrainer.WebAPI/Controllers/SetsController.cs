using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public sealed class SetsController(ISetsService setsService) : BaseController
{
    readonly ISetsService _setsService = setsService;

    [Authorize]
    [HttpGet("sets")]
    public async Task<ActionResult<FullSetModel[]>> Sets(CT cancellationToken)
    {
        return Ok(await _setsService.GetSetsAsync(UserName, cancellationToken));
    }

    [Authorize]
    [HttpGet("set-with-cards")]
    public async Task<ActionResult<SetWithCardsModel>> SetWithCards(int setId, CT cancellationToken)
    {
        SetWithCardsModel set = await _setsService.GetSetWithCardsAsync(
            UserName, setId, cancellationToken);

        if (set != null)
        {
            return Ok(set);
        }

        return NotFound();
    }

    [Authorize]
    [HttpPost("create-or-update")]
    public async Task<ActionResult<FullSetModel>> CreateOrUpdate(SetWithCardsModel set, CT cancellationToken)
    {
        return Ok(await _setsService.CreateOrUpdateAsync(UserName, set, cancellationToken));
    }

    [Authorize]
    [HttpDelete("{setId:int}")]
    public async Task<ActionResult<int>> Delete(int setId, CT cancellationToken)
    {
        return Ok(await _setsService.DeleteSetAsync(UserName, setId, cancellationToken));
    }

    [Authorize]
    [HttpPost("{setId:int}/import")]
    public async Task<ActionResult<ImportResultModel>> Import(
        int setId, ImportModel importModel, CT cancellationToken)
    {
        return Ok(await _setsService.ImportAsync(UserName,
            setId, importModel.Append, importModel.Cards, cancellationToken));
    }

    [Authorize]
    [HttpGet("{setId:int}/export")]
    public async Task<ActionResult<ExportDataModel>> Export(int setId, CT cancellationToken)
    {
        return Ok(await _setsService.ExportAsync(UserName, setId, cancellationToken));
    }
}
