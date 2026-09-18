namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface ITrainingService
{
    Task<CardModel[]> StartAsync(string userName, int setId, bool shouldHide, CT cancellationToken);

    Task AnswerAsync(string userName, int cardId, bool isKnown, CT cancellationToken);
}
