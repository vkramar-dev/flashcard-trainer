using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class TrainingService(FlashcardsDbContext Ctx) : ITrainingService
{
    public async Task AnswerAsync(string userName, int cardId,
        bool isKnown, CancellationToken cancellationToken = default)
    {
        int rowsAffected;

        if (isKnown)
        {
            rowsAffected = await Ctx.Cards
                .Where(c => c.Id == cardId && c.ParentSet.UserName == userName)
                .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.KnowCounter, c => c.KnowCounter + 1),
                    cancellationToken);
        }
        else
        {
            rowsAffected = await Ctx.Cards
                .Where(c => c.Id == cardId && c.ParentSet.UserName == userName)
                .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.NotKnowCounter, c => c.NotKnowCounter + 1),
                    cancellationToken);
        }

        if (rowsAffected == 0)
        {
            throw new InvalidOperationException($"Card with Id {cardId} not found or does not belong to user {userName}");
        }
    }

    public async Task<CardModel[]> StartAsync(
        string userName, int setId, CancellationToken cancellationToken = default)
    {
        Set set = await (from s in Ctx.Sets.Include(s => s.Cards)
                         where s.Id == setId && s.UserName == userName
                         select s).AsNoTracking().SingleOrDefaultAsync(cancellationToken);


        return ShapeCards(set.Cards, set.IsShuffled);
    }

    private CardModel[] ShapeCards(ICollection<Card> cards, bool shuffle)
    {
        CardModel[] selectedCards = (from card in cards
                                     where IsCardSelected(card)
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
        float koeff = card.KnowCounter / (card.NotKnowCounter + 1f);

        if (koeff > 2.3f)
        {
            int level = (card.KnowCounter / (card.NotKnowCounter + 1)) + 1;
            return Random.Shared.Next(level) == 0;
        }

        return true;
    }
}
