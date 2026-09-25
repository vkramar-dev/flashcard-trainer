using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

using DB = KramarDev.FlashcardTrainer.WebAPI.Database.Tables;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class SetsService(FlashcardsDbContext dbContext) : ISetsService
{
    readonly FlashcardsDbContext _ctx = dbContext;

    public Task<FullSetModel[]> GetSetsAsync(string userName, CT cancellationToken)
    {
        return (from s in _ctx.Sets
                where s.UserName == userName
                select new FullSetModel
                {
                    Id = s.Id,
                    Name = s.Name,
                    Shuffle = s.IsShuffled,
                    TotalCards = s.Cards.Count,
                    LearntCards = s.Cards.Count(card => card.KnowCounter > card.NotKnowCounter + Constants.LearntThreshold),
                    Created = s.Created,
                    Modified = s.Modified
                }).ToArrayAsync(cancellationToken);
    }

    public async Task<ExportDataModel> ExportAsync(string userName, int setId, CT cancellationToken)
    {
        var set = await _ctx.Sets
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

    public Task<FullSetModel> CreateOrUpdateAsync(string userName, SetWithCardsModel set, CT cancellationToken)
    {
        if (set.Id > 0)
        {
            return UpdateAsync(userName, set, cancellationToken);
        }
        else
        {
            return CreateAsync(userName, set, cancellationToken);
        }
    }

    public async Task<SetWithCardsModel> GetSetWithCardsAsync(string userName, int setId, CT cancellationToken)
    {
        var set = await _ctx.Sets
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
            }).OrderBy(c => c.Id).ToArray()
        };
    }

    public Task<int> DeleteSetAsync(string userName, int setId, CT cancellationToken)
    {
        return _ctx.Sets
            .Where(s => s.Id == setId && s.UserName == userName)
            .ExecuteDeleteAsync(cancellationToken);
    }

    public async Task<ImportResultModel> ImportAsync(string userName,
        int setId, bool append, CardModel[] cards, CT cancellationToken)
    {
        if (setId == 0)
        {
            throw new InvalidOperationException("setId cannot be 0 for import");
        }

        var factory = _ctx.GetService<IDbContextFactory<FlashcardsDbContext>>();
        var strategy = _ctx.Database.CreateExecutionStrategy();

        ImportParam param = new(
            factory,
            userName,
            setId,
            append,
            cards);

        return await strategy.ExecuteAsync<ImportResultModel>(
            ct => ImportInternalAsync(param, ct),
            cancellationToken);
    }

    private async Task<FullSetModel> CreateAsync(string userName, SetWithCardsModel set, CT cancellationToken)
    {
        var newSet = new DB.Set
        {
            UserName = userName,
            Name = set.Name,
            IsShuffled = false,
            Created = DateTime.UtcNow,
            Modified = DateTime.UtcNow,
            Cards = set.Cards.Select(c => new DB.Card
            {
                FrontSide = c.Front,
                BackSide = c.Back,
                KnowCounter = 0,
                NotKnowCounter = 0
            }).ToList()
        };

        _ctx.Sets.Add(newSet);
        await _ctx.SaveChangesAsync(cancellationToken);
        return await ReadSetAsync(_ctx, newSet.Id, userName, false, cancellationToken);
    }

    private async Task<FullSetModel> UpdateAsync(string userName, SetWithCardsModel set, CT cancellationToken)
    {
        int setId = set.Id ?? throw new InvalidOperationException("Set Id must be greater than 0 for update");

        // Obtain IDbContextFactory from the injected context's internal services
        var factory = _ctx.GetService<IDbContextFactory<FlashcardsDbContext>>();
        var strategy = _ctx.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync<FullSetModel>(
            ct => UpdateInternalAsync(factory, userName, set, ct), cancellationToken);
    }

    private static async Task<FullSetModel> UpdateInternalAsync(
        IDbContextFactory<FlashcardsDbContext> factory, string userName, SetWithCardsModel set, CT ct)
    {
        await using var ctx = factory.CreateDbContext();
        await using var transaction = await ctx.Database.BeginTransactionAsync(ct);

        DB.Set existingSet = await ReadSetWithUpdateLockAsync(ctx, set.Id.Value, userName, ct);

        if (existingSet == null)
        {
            throw new InvalidOperationException($"Set with Id {set.Id} not found or does not belong to user {userName}");
        }

        ProcessUpdatingSet(ctx, existingSet, set);

        await ctx.SaveChangesAsync(ct);

        FullSetModel setResult = await ReadSetAsync(ctx, set.Id.Value, userName, false, ct);

        await transaction.CommitAsync(ct);

        return setResult;
    }

    private static async Task<ImportResultModel> ImportInternalAsync(ImportParam param, CT ct)
    {
        var (factory, userName, setId, append, cards) = param;

        await using var ctx = factory.CreateDbContext();
        await using var transaction = await ctx.Database.BeginTransactionAsync(ct);

        var existingSet = await ReadSetWithUpdateLockAsync(ctx, setId, userName, ct);

        if (existingSet == null)
        {
            throw new InvalidOperationException($"Set with Id {setId} not found or does not belong to user {userName}");
        }

        ProcessAddingCardsToSet(ctx, existingSet, cards, append);

        await ctx.SaveChangesAsync(ct);

        FullSetWithCardsModel resultSet = await ReadSetAsync(ctx, setId, userName, true, ct);

        await transaction.CommitAsync(ct);

        return new ImportResultModel { Imported = cards.Length, Set = resultSet };
    }

    private static Task<DB.Set> ReadSetWithUpdateLockAsync(FlashcardsDbContext ctx, int setId, string userName, CT ct)
    {
        // Serialize concurrent modifications of the same set
        // (e.g. double submit, multiple tabs/devices, or repeated requests).
        return ctx.Sets
            .FromSqlInterpolated($"""
                SELECT *
                FROM [Sets] WITH (UPDLOCK, ROWLOCK)
                WHERE Id = {setId}
                  AND UserName = {userName}
                """)
            .Include(s => s.Cards)
            .AsTracking()
            .SingleOrDefaultAsync(ct);
    }

    private static void ProcessUpdatingSet(FlashcardsDbContext ctx, DB.Set existingSet, SetWithCardsModel set)
    {
        existingSet.Name = set.Name;
        existingSet.Modified = DateTime.UtcNow;

        var newCardIds = set.Cards
            .Where(c => c.Id > 0)
            .Select(c => c.Id)
            .ToHashSet();

        var cardsToRemove = existingSet.Cards
            .Where(c => !newCardIds.Contains(c.Id))
            .ToList();

        ctx.Cards.RemoveRange(cardsToRemove);

        foreach (CardModel cardModel in set.Cards)
        {
            if (cardModel.Id > 0)
            {
                DB.Card existingCard = existingSet.Cards
                    .FirstOrDefault(c => c.Id == cardModel.Id);

                if (existingCard == null)
                {
                    throw new InvalidOperationException(
                        $"Card with Id {cardModel.Id} not found.");
                }

                existingCard.FrontSide = cardModel.Front;
                existingCard.BackSide = cardModel.Back;
            }
            else
            {
                existingSet.Cards.Add(new DB.Card
                {
                    FrontSide = cardModel.Front,
                    BackSide = cardModel.Back,
                    KnowCounter = 0,
                    NotKnowCounter = 0
                });
            }
        }
    }

    private static void ProcessAddingCardsToSet(FlashcardsDbContext ctx, Set existingSet, CardModel[] cards, bool append)
    {
        if (!append)
        {
            ctx.Cards.RemoveRange(existingSet.Cards);
        }

        foreach (CardModel cardModel in cards)
        {
            var dbCard = new DB.Card
            {
                FrontSide = cardModel.Front,
                BackSide = cardModel.Back,
                KnowCounter = 0,
                NotKnowCounter = 0
            };
            existingSet.Cards.Add(dbCard);
        }

        existingSet.Modified = DateTime.UtcNow;
    }

    private static Task<FullSetWithCardsModel> ReadSetAsync(
        FlashcardsDbContext ctx, int setId, string userName, bool includeCards, CT cancellationToken)
    {
        return (from s in ctx.Sets
                where s.Id == setId && s.UserName == userName
                select new FullSetWithCardsModel
                {
                    Id = s.Id,
                    Name = s.Name,
                    Shuffle = s.IsShuffled,
                    TotalCards = s.Cards.Count,
                    LearntCards = s.Cards.Count(card => card.KnowCounter > card.NotKnowCounter + Constants.LearntThreshold),
                    Created = s.Created,
                    Modified = s.Modified,
                    Cards = (includeCards ? s.Cards.Select(c => new CardModel
                    {
                        Id = c.Id,
                        Front = c.FrontSide,
                        Back = c.BackSide
                    }).OrderBy(c => c.Id).ToArray() : null)
                }).SingleAsync(cancellationToken);
    }
}
