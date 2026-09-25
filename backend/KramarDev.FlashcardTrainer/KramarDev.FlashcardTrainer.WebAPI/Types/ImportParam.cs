using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Types;

public sealed record ImportParam(
    IDbContextFactory<FlashcardsDbContext> DbContextFactory,
    string UserName,
    int SetId,
    bool Append,
    CardModel[] Cards);
