namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface ISettingsService
{
    Task<SettingsModel> GetSettingsAsync(string userName, CT cancellationToken);

    Task SetColorSchemeAsync(string schemeName, string userName, CT cancellationToken);

    Task SetHideKnownCardsAsync(bool hideKnownCards, string userName, CT cancellationToken);
}
