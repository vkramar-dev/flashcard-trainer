using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class SettingsService( FlashcardsDbContext dbContext) : ISettingsService
{
    readonly FlashcardsDbContext _ctx = dbContext;
    const string DefaultColorScheme = "graphite";
    const bool DefaultHideKnownCards = true;

    public async Task<SettingsModel> GetSettingsAsync(string userName, CT cancellationToken)
    {
        var settings = await _ctx.Settings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserName == userName, cancellationToken);

        if (settings == null)
        {
            var newSettings = new Database.Tables.Settings
            {
                UserName = userName,
                ColorScheme = DefaultColorScheme,
                HideKnownCards = DefaultHideKnownCards
            };

            _ctx.Settings.Add(newSettings);
            await _ctx.SaveChangesAsync(cancellationToken);

            return new SettingsModel
            {
                ColorScheme = newSettings.ColorScheme,
                HideKnownCards = newSettings.HideKnownCards
            };
        }

        return new SettingsModel
        {
            ColorScheme = settings.ColorScheme,
            HideKnownCards = settings.HideKnownCards
        };
    }

    public Task CreateDefaultSettingsAsync(string userName, CT cancellationToken)
    {
        var newSettings = new Database.Tables.Settings
        {
            UserName = userName,
            ColorScheme = DefaultColorScheme,
            HideKnownCards = DefaultHideKnownCards
        };
        _ctx.Settings.Add(newSettings);
        return _ctx.SaveChangesAsync(cancellationToken);
    }

    public async Task SetColorSchemeAsync(string userName, string schemeName, CT cancellationToken)
    {
        int rows = await _ctx.Settings
            .Where(s => s.UserName == userName)
            .ExecuteUpdateAsync(setters => setters.SetProperty(s => s.ColorScheme, _ => schemeName),
                cancellationToken);

        if (rows == 0)
        {
            throw new InvalidOperationException(
                $"Color settings for user '{userName}' were not found.");
        }
    }

    public async Task SetHideKnownCardsAsync(string userName, bool hideKnownCards, CT cancellationToken)
    {
        int rows = await _ctx.Settings
            .Where(s => s.UserName == userName)
            .ExecuteUpdateAsync(setters => setters.SetProperty(s => s.HideKnownCards, _ => hideKnownCards),
                cancellationToken);

        if (rows == 0)
        {
            throw new InvalidOperationException(
                $"HideKnown settings for user '{userName}' were not found.");
        }
    }
}
