namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface ISetsService
{
    Task<FullSetModel[]> GetSetsAsync(string userName, CT cancellationToken);

    Task<FullSetModel> CreateOrUpdateAsync(string userName, SetWithCardsModel set, CT cancellationToken);

    Task<SetWithCardsModel> GetSetWithCardsAsync(string userName, int setId, CT cancellationToken);

    Task<int> DeleteSetAsync(string userName, int setId, CT cancellationToken);

    Task<ImportResultModel> ImportAsync(string userName,
        int setId, bool append, CardModel[] cards, CT cancellationToken);

    Task<ExportDataModel> ExportAsync(string userName, int setId, CT cancellationToken);
}
