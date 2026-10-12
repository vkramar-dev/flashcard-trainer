using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class TrainingService(FlashcardsDbContext dbContext) : ITrainingService
{
    readonly FlashcardsDbContext _ctx = dbContext;


    public async Task AnswerAsync(string userName, int cardId, bool isKnown, CT cancellationToken)
    {
        Card card = await _ctx.Cards
            .FirstOrDefaultAsync(
                c => c.Id == cardId && c.ParentSet.UserName == userName,
                cancellationToken)
            ?? throw new Http404NotFoundException("Card not found.");

        if (isKnown)
        {
            card.KnowCounter++;
        }
        else
        {
            card.NotKnowCounter++;
        }

        // Remember the learned status before normalization.
        bool wasLearnt = card.KnowCounter >
            card.NotKnowCounter + Constants.LearntThreshold;

        // Gradually reduce the influence of older answers so cards can
        // adapt to the user's current knowledge rather than their entire history.
        if (card.KnowCounter >= 8 || card.NotKnowCounter >= 8)
        {
            card.KnowCounter /= 4;
            card.NotKnowCounter /= 4;

            // Preserve the learned status.
            if (wasLearnt)
            {
                card.KnowCounter = Math.Max(
                    card.KnowCounter,
                    card.NotKnowCounter + Constants.LearntThreshold + 1);
            }
        }

        await _ctx.SaveChangesAsync(cancellationToken);
    }

    public async Task<CardModel[]> StartAsync(string userName, int setId, bool shouldHide, CT cancellationToken)
    {
        Set set = await (from s in _ctx.Sets.Include(s => s.Cards)
                         where s.Id == setId && s.UserName == userName
                         select s).SingleAsync(cancellationToken);

        int maxCards = await _ctx.Settings.Where(s => s.UserName == userName)
            .Select(s => (int?)s.MaxCardsPerTrainingSession)
            .SingleOrDefaultAsync(cancellationToken) ?? Constants.MaxCardsPerTrainingSessionDefault;
        CardModel[] cards = ShapeCards(set.Cards, shouldHide, maxCards);
        if (cards.Length > 0)
        {
            set.LastTrained = DateTime.UtcNow;
            await _ctx.SaveChangesAsync(cancellationToken);
        }

        return cards;
    }

    private CardModel[] ShapeCards(ICollection<Card> cards, bool shouldHide, int maxCards)
    {
        if (cards.Count < 1)
        {
            throw new Http404NotFoundException("No cards available for training.");
        }
        else if (cards.Count < Constants.MinCardsPerTrainingSession)
        {
            CardModel[] allCards = (from card in cards
                                    select new CardModel
                                    {
                                        Id = card.Id,
                                        Front = card.FrontSide,
                                        Back = card.BackSide
                                    }).ToArray();

            Random.Shared.Shuffle(allCards);

            return allCards;
        }

        CardModel[] selectedCards = (from card in cards
                                     where !shouldHide || IsCardSelected(card)
                                     select new CardModel
                                     {
                                         Id = card.Id,
                                         Front = card.FrontSide,
                                         Back = card.BackSide
                                     }).ToArray();

        if (selectedCards.Length < Constants.MinCardsPerTrainingSession)
        {
            CardModel[] addingCards = (from card in cards
                                       where !selectedCards.Any(sc => sc.Id == card.Id)
                                       select new CardModel
                                       {
                                           Id = card.Id,
                                           Front = card.FrontSide,
                                           Back = card.BackSide
                                       })
                           .Take(Constants.MinCardsPerTrainingSession - selectedCards.Length)
                           .ToArray();

            selectedCards = selectedCards.Concat(addingCards).ToArray();
        }

        Random.Shared.Shuffle(selectedCards);

        return maxCards == 0 ? selectedCards : selectedCards.Take(maxCards).ToArray();
    }

    private bool IsCardSelected(Card card)
    {
        int koef = card.KnowCounter / (card.NotKnowCounter + 1);

        return Random.Shared.Next(koef) == 0;
    }
}
