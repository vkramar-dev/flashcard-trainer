using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class StatisticsService(FlashcardsDbContext dbContext) : IStatisticsService
{
    readonly FlashcardsDbContext _ctx = dbContext;

    public async Task<SetStatisticsModel[]> GetStatisticsAsync(string userName, CT cancellationToken)
    {
        var stats = await _ctx.Sets
            .AsNoTracking()
            .Where(s => s.UserName == userName)
            .Select(s => new SetStatisticsModel
            {
                SetId = s.Id,
                SetName = s.Name,
                LearntCards = s.Cards.Count(c => c.KnowCounter > c.NotKnowCounter + Constants.LearntThreshold),
                TotalCardsShown = s.Cards.Sum(c => c.KnowCounter + c.NotKnowCounter),
                HardestCards = s.Cards
                    .Where(c => c.NotKnowCounter > c.KnowCounter)
                    .OrderByDescending(c => c.NotKnowCounter)
                    .Take(3)
                    .Select(c => new FullCardModel
                    {
                        Id = c.Id,
                        Front = c.FrontSide,
                        Back = c.BackSide,
                        UnknownCount = c.NotKnowCounter,
                        ShownCount = c.KnowCounter + c.NotKnowCounter
                    })
                    .ToArray()
            })
            .ToArrayAsync(cancellationToken);

        return stats;
    }
}
