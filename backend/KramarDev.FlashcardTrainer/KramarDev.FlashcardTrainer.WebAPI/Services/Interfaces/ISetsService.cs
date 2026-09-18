namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface ISetsService
{
    Task<FullSetModel[]> GetSetsAsync(string userName, CT cancellationToken);

    Task<CardModel> GetCardAsync(int cardId, CT cancellationToken);

    Task<FullSetModel> CreateOrUpdateAsync(SetWithCardsModel set, string userName, CT cancellationToken);

    Task<SetWithCardsModel> GetSetWithCardsAsync(string userName, int setId, CT cancellationToken);

    Task<int> DeleteSetAsync(int setId, string userName, CT cancellationToken);

    Task<ImportResultModel> ImportAsync(
        int setId, bool append, CardModel[] cards, string userName, CT cancellationToken);

    Task<ExportDataModel> ExportAsync(int setId, string userName, CT cancellationToken);
}
