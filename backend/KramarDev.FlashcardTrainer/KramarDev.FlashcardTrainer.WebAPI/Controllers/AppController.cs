using KramarDev.Flashcard.WebAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public class AppController(IDbContextFactory<FlashcardsDbContext> factory) : BaseController
{
    readonly IDbContextFactory<FlashcardsDbContext> _factory = factory;

    [Authorize]
    [HttpGet("state")]
    public async Task<ActionResult<AppStateModel>> State(CT cancellationToken)
    {
        AppStateModel stateModel = new AppStateModel();

        using var setsCtx = _factory.CreateDbContext();
        using var settingsCtx = _factory.CreateDbContext();

        ISetsService setsService = new SetsService(setsCtx);
        ISettingsService settingsService = new SettingsService(settingsCtx);

        Task<FullSetModel[]> setsTask = setsService.GetSetsAsync(UserName, cancellationToken);
        Task<SettingsModel> settingsTask = settingsService.GetSettingsAsync(UserName, cancellationToken);
        stateModel.UserName = UserName;

        stateModel.Sets = await setsTask;
        stateModel.Settings = await settingsTask;

        return Ok(stateModel);
    }


    [HttpGet("ip")]
    public ActionResult<string> Ip()
    {
        return Ok(IpAddress);
    }

    [HttpGet("test-logging")]
    public async Task<IActionResult> TestLogging(
    [FromServices] KramarDev.LogPlatform.LogClient.ILogger logger)
    {
        try
        {
            throw new InvalidOperationException(
                "Test exception from controller.");
        }
        catch (Exception ex)
        {
            await logger.LogAspNetExceptionAsync(
                ex,
                "Exception logged in controller",
                Severity.Medium,
                SourceType.Backend);

            throw;
        }
    }
}