namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface IStatisticsService
{
    Task<SetStatisticsModel[]> GetStatisticsAsync(string userName, CT cancellationToken);
}
