using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public sealed class SettingsController(ISettingsService settingsService) : BaseController
{
    readonly ISettingsService _settingsService = settingsService;

    [Authorize]
    [HttpPut("scheme")]
    public async Task<ActionResult> Scheme(string scheme, CancellationToken cancellationToken)
    {
        await _settingsService.SetColorSchemeAsync(scheme, UserName, cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpPut("hide-known-words")]
    public async Task<ActionResult> HideKnownWords(bool hideKnownWords, CancellationToken cancellationToken)
    {
        await _settingsService.SetHideKnownWordsAsync(hideKnownWords, UserName, cancellationToken);
        return NoContent();
    }
}
