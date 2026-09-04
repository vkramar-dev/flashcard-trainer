namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface ITrainingService
{
    Task<CardModel[]> StartAsync(string userName, int setId,
        CancellationToken cancellationToken = default);

    Task AnswerAsync(string userName, int cardId, bool isKnown,
        CancellationToken cancellationToken = default);
}
