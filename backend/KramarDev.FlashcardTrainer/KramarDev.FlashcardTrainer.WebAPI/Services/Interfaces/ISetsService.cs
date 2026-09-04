namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface ISetsService
{
    Task<SetModel[]> GetSetsAsync(string userName,
        CancellationToken cancellationToken = default);

    Task<CardModel> GetCardAsync(int cardId,
        CancellationToken cancellationToken = default);

    Task CreateOrUpdateAsync(SetWithCards set, string userName,
        CancellationToken cancellationToken = default);
}
