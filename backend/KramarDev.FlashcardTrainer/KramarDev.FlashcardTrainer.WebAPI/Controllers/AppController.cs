using KramarDev.Flashcard.WebAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public class AppController(ISetsService setsService, ISettingsService settingsService) : BaseController
{
    readonly ISetsService _setsService = setsService;
    readonly ISettingsService _settingsService = settingsService;

    [Authorize]
    [HttpGet("state")]
    public async Task<ActionResult<AppStateModel>> State(CancellationToken cancellationToken)
    {
        AppStateModel stateModel = new AppStateModel();

        Task<SetModel[]> setsTask = _setsService.GetSetsAsync(UserName, cancellationToken);
        Task<SettingsModel> settingsTask = _settingsService.GetSettingsAsync(UserName, cancellationToken);
        stateModel.UserName = UserName;

        stateModel.Sets = await setsTask;
        stateModel.Settings = await settingsTask;

        return Ok(stateModel);
    }
}
