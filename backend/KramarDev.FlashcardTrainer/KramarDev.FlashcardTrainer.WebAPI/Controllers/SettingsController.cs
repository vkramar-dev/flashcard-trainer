using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public sealed class SettingsController(ISettingsService settingsService) : BaseController
{
    readonly ISettingsService _settingsService = settingsService;

    [Authorize]
    [HttpPut("scheme")]
    public async Task<ActionResult> Scheme(string scheme, CT cancellationToken)
    {
        await _settingsService.SetColorSchemeAsync(UserName, scheme, cancellationToken);
        return NoContent();
    }

    [Authorize]
    [HttpPut("hide-known-cards")]
    public async Task<ActionResult> HideKnownCards(bool hideKnownCards, CT cancellationToken)
    {
        await _settingsService.SetHideKnownCardsAsync(UserName, hideKnownCards, cancellationToken);
        return NoContent();
    }
}
