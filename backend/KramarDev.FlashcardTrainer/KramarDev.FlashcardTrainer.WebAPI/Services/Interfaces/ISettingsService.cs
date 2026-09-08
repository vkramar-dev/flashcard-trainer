namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface ISettingsService
{
    Task<SettingsModel> GetSettingsAsync(string userName, CancellationToken cancellationToken = default);

    Task SetColorSchemeAsync(string schemeName, string userName, CancellationToken cancellationToken = default);

    Task SetHideKnownWordsAsync(bool hideKnownWords, string userName, CancellationToken cancellationToken = default);
}
