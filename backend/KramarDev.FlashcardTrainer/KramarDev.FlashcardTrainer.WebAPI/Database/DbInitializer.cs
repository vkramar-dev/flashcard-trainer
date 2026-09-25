using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Database;

public static class DbInitializer
{
    // dotnet ef migrations add InitialCreate -o Database/Migrations

    // Add any initials here.
    public static async Task MigrateAndInitializeAsync(IServiceScope scope, CT cancellationToken = default)
    {
        var dbCtx = scope.ServiceProvider
            .GetRequiredService<FlashcardsDbContext>();

        await dbCtx.Database.MigrateAsync(cancellationToken);
    }
}
