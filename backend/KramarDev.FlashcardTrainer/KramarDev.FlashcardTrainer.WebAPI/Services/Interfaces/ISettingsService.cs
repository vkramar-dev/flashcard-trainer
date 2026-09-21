namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface ISettingsService
{
    Task<SettingsModel> GetSettingsAsync(string userName, CT cancellationToken);

    Task SetColorSchemeAsync(string userName, string schemeName, CT cancellationToken);

    Task SetHideKnownCardsAsync(string userName, bool hideKnownCards, CT cancellationToken);
}
