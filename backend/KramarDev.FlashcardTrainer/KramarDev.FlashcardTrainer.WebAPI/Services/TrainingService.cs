using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class TrainingService(FlashcardsDbContext dbContext) : ITrainingService
{
    readonly FlashcardsDbContext _ctx = dbContext;

    public async Task AnswerAsync(string userName, int cardId, bool isKnown, CT cancellationToken)
    {
        int rowsAffected;

        if (isKnown)
        {
            rowsAffected = await _ctx.Cards
                .Where(c => c.Id == cardId && c.ParentSet.UserName == userName)
                .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.KnowCounter, c => c.KnowCounter + 1),
                    cancellationToken);
        }
        else
        {
            rowsAffected = await _ctx.Cards
                .Where(c => c.Id == cardId && c.ParentSet.UserName == userName)
                .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.NotKnowCounter, c => c.NotKnowCounter + 1),
                    cancellationToken);
        }

        if (rowsAffected == 0)
        {
            throw new InvalidOperationException($"Card with Id {cardId} not found or does not belong to user {userName}");
        }
    }

    public async Task<CardModel[]> StartAsync(string userName, int setId, bool shouldHide, CT cancellationToken)
    {
        Set set = await (from s in _ctx.Sets.Include(s => s.Cards)
                         where s.Id == setId && s.UserName == userName
                         select s).AsNoTracking().SingleOrDefaultAsync(cancellationToken);


        return ShapeCards(set.Cards, set.IsShuffled, shouldHide);
    }

    private CardModel[] ShapeCards(ICollection<Card> cards, bool shuffle, bool shouldHide)
    {
        CardModel[] selectedCards = (from card in cards
                                     where !shouldHide || IsCardSelected(card)
                                     select new CardModel
                                     {
                                         Id = card.Id,
                                         Front = card.FrontSide,
                                         Back = card.BackSide
                                     }).ToArray();

        if (shuffle)
        {
            Random.Shared.Shuffle(selectedCards);
        }

        return selectedCards;
    }

    private bool IsCardSelected(Card card)
    {
        int koef = card.KnowCounter / (card.NotKnowCounter + 1);

        return Random.Shared.Next(koef) == 0;
    }
}
