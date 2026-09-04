using KramarDev.FlashcardTrainer.WebAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class SetsService(FlashcardsDbContext Ctx) : ISetsService
{
    public Task<SetModel[]> GetSetsAsync(string userName, CancellationToken cancellationToken = default)
    {
        return (from s in Ctx.Sets
                where s.UserName == userName
                select new SetModel
                {
                    Id = s.Id,
                    Name = s.Name,
                    Shuffle = s.IsShuffled,
                    TotalCards = s.Cards.Count,
                    LearntCards = s.Cards.Count(c => c.KnowCounter > 3),
                    Created = s.Created,
                    Modified = s.Modified
                }).ToArrayAsync(cancellationToken);
    }

    public Task<CardModel> GetCardAsync(int cardId, CancellationToken cancellationToken = default)
    {
        return (from c in Ctx.Cards
                where c.Id == cardId
                select new CardModel
                {
                    Id = cardId,
                    Front = c.FrontSide,
                    Back = c.BackSide

                }).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task CreateOrUpdateAsync(SetWithCards set, string userName, CancellationToken cancellationToken = default)
    {
        if (set.Id > 0)
        {
            await UpdateAsync(set, userName, cancellationToken);
        }
        else
        {
            await CreateAsync(set, userName, cancellationToken);
        }
    }

    private async Task CreateAsync(SetWithCards set, string userName, CancellationToken cancellationToken = default)
    {
        var newSet = new Database.Tables.Set
        {
            UserName = userName,
            Name = set.Name,
            IsShuffled = false,
            Created = DateTime.UtcNow,
            Modified = DateTime.UtcNow,
            Cards = set.Cards.Select(c => new Database.Tables.Card
            {
                FrontSide = c.Front,
                BackSide = c.Back,
                KnowCounter = 0,
                NotKnowCounter = 0
            }).ToList()
        };

        Ctx.Sets.Add(newSet);
        await Ctx.SaveChangesAsync(cancellationToken);
    }

    private async Task UpdateAsync(SetWithCards set, string userName, CancellationToken cancellationToken = default)
    {
        var existingSet = await Ctx.Sets
            .Include(s => s.Cards)
            .FirstOrDefaultAsync(s => s.Id == set.Id && s.UserName == userName, cancellationToken);

        if (existingSet == null)
        {
            throw new InvalidOperationException($"Set with Id {set.Id} not found or does not belong to user {userName}");
        }

        existingSet.Name = set.Name;
        existingSet.Modified = DateTime.UtcNow;

        // Remove cards that are not in the new set
        var newCardIds = set.Cards.Where(c => c.Id > 0).Select(c => c.Id).ToHashSet();
        var cardsToRemove = existingSet.Cards.Where(c => !newCardIds.Contains(c.Id)).ToList();
        foreach (var card in cardsToRemove)
        {
            Ctx.Cards.Remove(card);
        }

        // Update existing cards and add new ones
        foreach (var cardModel in set.Cards)
        {
            if (cardModel.Id > 0)
            {
                // Update existing card
                var existingCard = existingSet.Cards.FirstOrDefault(c => c.Id == cardModel.Id);
                if (existingCard != null)
                {
                    existingCard.FrontSide = cardModel.Front;
                    existingCard.BackSide = cardModel.Back;
                }
            }
            else
            {
                // Add new card
                existingSet.Cards.Add(new Database.Tables.Card
                {
                    FrontSide = cardModel.Front,
                    BackSide = cardModel.Back,
                    KnowCounter = 0,
                    NotKnowCounter = 0
                });
            }
        }

        await Ctx.SaveChangesAsync(cancellationToken);
    }
}
