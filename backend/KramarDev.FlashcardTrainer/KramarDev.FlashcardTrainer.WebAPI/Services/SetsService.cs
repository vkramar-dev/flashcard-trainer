using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using KramarDev.FlashcardTrainer.WebAPI.Models;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class SetsService(FlashcardsDbContext Ctx) : ISetsService
{
    const int LearntThreshold = 2;

    public Task<FullSetModel[]> GetSetsAsync(string userName, CT cancellationToken)
    {
        return (from s in Ctx.Sets
                where s.UserName == userName
                select new FullSetModel
                {
                    Id = s.Id,
                    Name = s.Name,
                    Shuffle = s.IsShuffled,
                    TotalCards = s.Cards.Count,
                    LearntCards = s.Cards.Count(card => card.KnowCounter > card.NotKnowCounter + LearntThreshold),
                    Created = s.Created,
                    Modified = s.Modified
                }).ToArrayAsync(cancellationToken);
    }

    public async Task<ExportDataModel> ExportAsync(int setId, string userName, CT cancellationToken)
    {
        var set = await Ctx.Sets
            .Include(s => s.Cards)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == setId && s.UserName == userName, cancellationToken);

        if (set == null)
        {
            throw new InvalidOperationException($"Set with Id {setId} not found or does not belong to user {userName}");
        }

        var cards = set.Cards.Select(c => new ExportCardModel { Front = c.FrontSide, Back = c.BackSide }).ToArray();
        return new ExportDataModel { Name = set.Name, Cards = cards };
    }

    public Task<CardModel> GetCardAsync(int cardId, CT cancellationToken)
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

    public Task<FullSetModel> CreateOrUpdateAsync(SetWithCardsModel set, string userName, CT cancellationToken)
    {
        if (set.Id > 0)
        {
            return UpdateAsync(set, userName, cancellationToken);
        }
        else
        {
            return CreateAsync(set, userName, cancellationToken);
        }
    }

    public async Task<SetWithCardsModel> GetSetWithCardsAsync(string userName, int setId, CT cancellationToken)
    {
        var set = await Ctx.Sets
            .Include(s => s.Cards)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == setId && s.UserName == userName, cancellationToken);

        if (set == null)
        {
            return null;
        }

        return new SetWithCardsModel
        {
            Id = set.Id,
            Name = set.Name,
            Cards = set.Cards.Select(c => new CardModel
            {
                Id = c.Id,
                Front = c.FrontSide,
                Back = c.BackSide
            }).ToArray()
        };
    }

    public Task<int> DeleteSetAsync(int setId, string userName, CT cancellationToken)
    {
        return Ctx.Sets
            .Where(s => s.Id == setId && s.UserName == userName)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<ImportResultModel> ImportAsync(
        int setId, bool append, CardModel[] cards, string userName, CT cancellationToken)
    {
        if (setId == 0)
        {
            throw new InvalidOperationException("setId cannot be 0 for import");
        }

        cards ??= Array.Empty<CardModel>();

        var factory = Ctx.GetService<IDbContextFactory<FlashcardsDbContext>>();
        var strategy = Ctx.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync<ImportResultModel>(async (ct) =>
        {
            await using var ctx = factory.CreateDbContext();
            await using var transaction = await ctx.Database.BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead, ct);

            try
            {
                var existingSet = await ctx.Sets
                    .Include(s => s.Cards)
                    .FirstOrDefaultAsync(s => s.Id == setId && s.UserName == userName, ct);

                if (existingSet == null)
                {
                    throw new InvalidOperationException($"Set with Id {setId} not found or does not belong to user {userName}");
                }

                if (!append)
                {
                    // remove existing cards
                    if (existingSet.Cards.Any())
                    {
                        ctx.Cards.RemoveRange(existingSet.Cards);
                    }
                }

                int imported = 0;
                foreach (var cardModel in cards)
                {
                    // create new card entries regardless of provided Ids
                    var dbCard = new Database.Tables.Card
                    {
                        FrontSide = cardModel.Front,
                        BackSide = cardModel.Back,
                        KnowCounter = 0,
                        NotKnowCounter = 0
                    };
                    existingSet.Cards.Add(dbCard);
                    imported++;
                }

                await ctx.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                var resultSet = await (from s in ctx.Sets
                                       where s.Id == existingSet.Id && s.UserName == userName
                                       select new FullSetWithCardsModel
                                       {
                                           Id = s.Id,
                                           Name = s.Name,
                                           Shuffle = s.IsShuffled,
                                           TotalCards = s.Cards.Count,
                                           LearntCards = s.Cards.Count(card => card.KnowCounter > card.NotKnowCounter + LearntThreshold),
                                           Created = s.Created,
                                           Modified = s.Modified,
                                           Cards = s.Cards.Select(c => new CardModel { Id = c.Id, Front = c.FrontSide, Back = c.BackSide }).ToArray()
                                       }).SingleAsync(ct);

                return new ImportResultModel { Imported = imported, Set = resultSet };
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }, cancellationToken);
    }

    private async Task<FullSetModel> CreateAsync(SetWithCardsModel set, string userName, CT cancellationToken)
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
        return await GetSetAsync(newSet.Id, userName, cancellationToken);
    }

    private async Task<FullSetModel> UpdateAsync(SetWithCardsModel set, string userName, CT cancellationToken)
    {
        // Obtain IDbContextFactory from the injected context's internal services
        var factory = Ctx.GetService<IDbContextFactory<FlashcardsDbContext>>();

        var strategy = Ctx.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync<FullSetModel>(async (ct) =>
        {
            await using var ctx = factory.CreateDbContext();
            await using var transaction = await ctx.Database.BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead, ct);

            try
            {
                var existingSet = await ctx.Sets
                    .Include(s => s.Cards)
                    .FirstOrDefaultAsync(s => s.Id == set.Id && s.UserName == userName, ct);

                if (existingSet == null)
                {
                    throw new InvalidOperationException($"Set with Id {set.Id} not found or does not belong to user {userName}");
                }

                existingSet.Name = set.Name;
                existingSet.Modified = DateTime.UtcNow;

                var newCardIds = set.Cards.Where(c => c.Id > 0).Select(c => c.Id).ToHashSet();
                var cardsToRemove = existingSet.Cards.Where(c => !newCardIds.Contains(c.Id)).ToList();
                foreach (var card in cardsToRemove)
                {
                    ctx.Cards.Remove(card);
                }

                foreach (var cardModel in set.Cards)
                {
                    if (cardModel.Id > 0)
                    {
                        var existingCard = existingSet.Cards.FirstOrDefault(c => c.Id == cardModel.Id);
                        if (existingCard == null)
                        {
                            throw new InvalidOperationException($"Card with Id {cardModel.Id} not found.");
                        }
                        existingCard.FrontSide = cardModel.Front;
                        existingCard.BackSide = cardModel.Back;
                    }
                    else
                    {
                        existingSet.Cards.Add(new Database.Tables.Card
                        {
                            FrontSide = cardModel.Front,
                            BackSide = cardModel.Back,
                            KnowCounter = 0,
                            NotKnowCounter = 0
                        });
                    }
                }

                await ctx.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                return await (from s in ctx.Sets
                              where s.Id == existingSet.Id && s.UserName == userName
                              select new FullSetModel
                              {
                                  Id = s.Id,
                                  Name = s.Name,
                                  Shuffle = s.IsShuffled,
                                  TotalCards = s.Cards.Count,
                                  LearntCards = s.Cards.Count(card => card.KnowCounter > card.NotKnowCounter + LearntThreshold),
                                  Created = s.Created,
                                  Modified = s.Modified
                              }).SingleAsync(ct);
            }
            catch
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }, cancellationToken);
    }

    private Task<FullSetModel> GetSetAsync(int setId, string userName, CT cancellationToken)
    {
        return (from s in Ctx.Sets
                where s.Id == setId && s.UserName == userName
                select new FullSetModel
                {
                    Id = s.Id,
                    Name = s.Name,
                    Shuffle = s.IsShuffled,
                    TotalCards = s.Cards.Count,
                    LearntCards = s.Cards.Count(card => card.KnowCounter > card.NotKnowCounter + LearntThreshold),
                    Created = s.Created,
                    Modified = s.Modified
                }).SingleAsync(cancellationToken);
    }
}
