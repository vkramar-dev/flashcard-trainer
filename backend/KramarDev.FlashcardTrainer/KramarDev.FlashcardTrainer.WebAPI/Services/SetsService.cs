using System.Globalization;
using KramarDev.FlashcardTrainer.WebAPI.Utils;
using Microsoft.EntityFrameworkCore;

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
                    TotalCards = s.Cards.Count,
                    LearntCards = s.Cards.AsQueryable().Count(Card.IsLearntExpression),
                    Created = s.Created,
                    Modified = s.Modified,
                    LastTrained = s.LastTrained,
                    UsedCharacters = s.UsedCharacters
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
            throw new Http404NotFoundException($"Set with Id {setId} not found or does not belong to user {userName}");
        }

        var cards = set.Cards.Select(c => new ExportCardModel { Front = c.FrontSide, Back = c.BackSide }).ToArray();
        return new ExportDataModel { Name = set.Name, Cards = cards };
    }

    public async Task<CardModel> UpdateCardSideAsync(string userName, int cardId, UpdateCardSideModel model, CT cancellationToken)
    {
        if (model.Text is null)
        {
            throw new Http400BadRequestException("Text is required.");
        }

        string text = model.Text;

        if (model.IsFrontSide)
        {
            text = text.Trim();
            if (text.Length == 0)
            {
                throw new Http400BadRequestException("Enter a front value.");
            }

            if (text.Length > ModelConstraints.CardFrontMaxLength)
            {
                throw new Http400BadRequestException(
                    $"Front text cannot be longer than {ModelConstraints.CardFrontMaxLength} characters.");
            }
        }
        else if (text.Length > ModelConstraints.CardBackMaxLength)
        {
            throw new Http400BadRequestException(
                $"Back text cannot be longer than {ModelConstraints.CardBackMaxLength} characters.");
        }

        try
        {
            await using var transaction = await _ctx.Database.BeginTransactionAsync(cancellationToken);
            long accountUsedBefore = await LockAccountAndSumUsedCharactersAsync(userName, cancellationToken);

            DB.Card card = await _ctx.Cards
                .Include(c => c.ParentSet)
                .FirstOrDefaultAsync(c => c.Id == cardId && c.ParentSet.UserName == userName, cancellationToken);

            if (card == null)
            {
                throw new Http404NotFoundException(
                    $"Card with Id {cardId} not found or does not belong to user {userName}");
            }

            long setUsedBefore = card.ParentSet.UsedCharacters;
            long oldLength = CardCharacters(card);

            if (model.IsFrontSide)
            {
                card.FrontSide = text;
            }
            else
            {
                card.BackSide = text;
            }

            card.ParentSet.UsedCharacters += CardCharacters(card) - oldLength;
            EnsureWithinAccountLimit(accountUsedBefore, setUsedBefore, card.ParentSet.UsedCharacters);

            card.ParentSet.Modified = DateTime.UtcNow;
            await _ctx.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new CardModel
            {
                Id = card.Id,
                Front = card.FrontSide,
                Back = card.BackSide ?? ""
            };
        }
        catch (Exception ex) when (ex is not Http404NotFoundException and not Http400BadRequestException)
        {
            ExceptionHelper.ThrowIfDuplicateCard(ex);
            throw;
        }
    }

    public async Task<FullSetModel> CreateOrUpdateAsync(string userName, SetWithCardsModel set, CT cancellationToken)
    {
        try
        {
            return set.Id > 0
                ? await UpdateAsync(userName, set, cancellationToken)
                : await CreateAsync(userName, set, cancellationToken);
        }
        catch (Exception ex)
        {
            ExceptionHelper.ThrowIfDuplicateCard(ex);

            throw;
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

    public async Task<StorageUsageModel> GetStorageUsageAsync(string userName, CT cancellationToken)
    {
        long used = await _ctx.Sets
            .Where(s => s.UserName == userName)
            .SumAsync(s => (long?)s.UsedCharacters, cancellationToken) ?? 0;

        return new StorageUsageModel
        {
            UsedCharacters = used,
            CharacterLimit = Constants.AccountCharacterLimit
        };
    }

    public async Task<ImportResultModel> ImportAsync(string userName,
        int setId, bool append, CardModel[] cards, CT ct)
    {
        if (setId == 0)
        {
            throw new Http400BadRequestException("setId cannot be 0 for import");
        }

        try
        {
            await using var transaction = await _ctx.Database.BeginTransactionAsync(ct);
            long accountUsedBefore = await LockAccountAndSumUsedCharactersAsync(userName, ct);

            var existingSet = await ReadSetWithUpdateLockAsync(_ctx, setId, userName, ct);

            if (existingSet == null)
            {
                throw new Http404NotFoundException($"Set with Id {setId} not found or does not belong to user {userName}");
            }

            long setUsedBefore = existingSet.UsedCharacters;
            long persistedCharacters = CountCardCharacters(existingSet.Cards);
            ProcessAddingCardsToSet(_ctx, existingSet, cards, append);
            existingSet.UsedCharacters = append
                ? persistedCharacters + CountModelCharacters(cards)
                : CountModelCharacters(cards);
            EnsureWithinAccountLimit(accountUsedBefore, setUsedBefore, existingSet.UsedCharacters);

            await _ctx.SaveChangesAsync(ct);

            FullSetWithCardsModel resultSet = await ReadSetAsync(_ctx, setId, userName, true, ct);

            await transaction.CommitAsync(ct);

            return new ImportResultModel { Imported = cards.Length, Set = resultSet };
        }
        catch (Exception ex)
        {
            ExceptionHelper.ThrowIfDuplicateCard(ex);

            throw;
        }
    }

    private async Task<FullSetModel> CreateAsync(string userName, SetWithCardsModel set, CT cancellationToken)
    {
        var newSet = new DB.Set
        {
            UserName = userName,
            Name = set.Name,
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

        newSet.UsedCharacters = CountCardCharacters(newSet.Cards);

        await using var transaction = await _ctx.Database.BeginTransactionAsync(cancellationToken);
        long accountUsedBefore = await LockAccountAndSumUsedCharactersAsync(userName, cancellationToken);
        EnsureWithinAccountLimit(accountUsedBefore, 0, newSet.UsedCharacters);

        _ctx.Sets.Add(newSet);
        await _ctx.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return await ReadSetAsync(_ctx, newSet.Id, userName, false, cancellationToken);
    }

    private async Task<FullSetModel> UpdateAsync(string userName, SetWithCardsModel set, CT ct)
    {
        await using var transaction = await _ctx.Database.BeginTransactionAsync(ct);
        long accountUsedBefore = await LockAccountAndSumUsedCharactersAsync(userName, ct);

        DB.Set existingSet = await ReadSetWithUpdateLockAsync(_ctx, set.Id.Value, userName, ct);

        if (existingSet == null)
        {
            throw new Http404NotFoundException(
                $"Set with Id {set.Id} not found or does not belong to user {userName}");
        }

        long setUsedBefore = existingSet.UsedCharacters;
        ProcessUpdatingSet(_ctx, existingSet, set);
        existingSet.UsedCharacters = CountModelCharacters(set.Cards);
        EnsureWithinAccountLimit(accountUsedBefore, setUsedBefore, existingSet.UsedCharacters);

        await _ctx.SaveChangesAsync(ct);

        FullSetModel setResult = await ReadSetAsync(_ctx, set.Id.Value, userName, false, ct);

        await transaction.CommitAsync(ct);

        return setResult;
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

        Dictionary<int, DB.Card> existingCards = existingSet.Cards.ToDictionary(c => c.Id);

        foreach (CardModel cardModel in set.Cards)
        {
            if (cardModel.Id > 0)
            {
                if (!existingCards.TryGetValue(cardModel.Id.Value, out DB.Card existingCard))
                {
                    throw new Http404NotFoundException(
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
                    TotalCards = s.Cards.Count,
                    LearntCards = s.Cards.AsQueryable().Count(Card.IsLearntExpression),
                    Created = s.Created,
                    Modified = s.Modified,
                    LastTrained = s.LastTrained,
                    Cards = (includeCards ? s.Cards.Select(c => new CardModel
                    {
                        Id = c.Id,
                        Front = c.FrontSide,
                        Back = c.BackSide
                    }).OrderBy(c => c.Id).ToArray() : null)
                }).SingleAsync(cancellationToken);
    }

    private Task<long> LockAccountAndSumUsedCharactersAsync(string userName, CT ct)
    {
        // Hold the user's set rows until the transaction commits so two
        // concurrent writes cannot both pass the account character limit.
        // An empty sum of a non-nullable long comes back as 0.
        return _ctx.Sets
            .FromSqlInterpolated($"""
                SELECT *
                FROM [Sets] WITH (UPDLOCK, HOLDLOCK)
                WHERE [UserName] = {userName}
                """)
            .AsNoTracking()
            .SumAsync(s => s.UsedCharacters, ct);
    }

    private static void EnsureWithinAccountLimit(long accountUsedBefore, long setUsedBefore, long setUsedAfter)
    {
        long accountUsedAfter = accountUsedBefore - setUsedBefore + setUsedAfter;
        if (setUsedAfter <= setUsedBefore || accountUsedAfter <= Constants.AccountCharacterLimit)
        {
            return;
        }

        string limit = Constants.AccountCharacterLimit.ToString("N0", CultureInfo.InvariantCulture);
        string used = accountUsedAfter.ToString("N0", CultureInfo.InvariantCulture);
        throw new Http400BadRequestException(
            $"This account is limited to {limit} characters. Saving these cards would use {used}.");
    }

    private static long CountCardCharacters(IEnumerable<DB.Card> cards)
    {
        if (cards == null)
        {
            return 0;
        }

        long total = 0;
        foreach (DB.Card card in cards)
        {
            total += CardCharacters(card);
        }

        return total;
    }

    private static long CountModelCharacters(IEnumerable<CardModel> cards)
    {
        if (cards == null)
        {
            return 0;
        }

        long total = 0;
        foreach (CardModel card in cards)
        {
            total += (card.Front?.Length ?? 0) + (card.Back?.Length ?? 0);
        }

        return total;
    }

    private static long CardCharacters(DB.Card card)
    {
        return (card.FrontSide?.Length ?? 0) + (card.BackSide?.Length ?? 0);
    }
}
