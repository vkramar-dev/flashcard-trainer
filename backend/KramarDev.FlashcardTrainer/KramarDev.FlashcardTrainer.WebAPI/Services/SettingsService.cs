using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class SettingsService(FlashcardsDbContext Ctx) : ISettingsService
{
    const string DefaultColorScheme = "graphite";
    const bool DefaultHideKnownCards = true;

    public async Task<SettingsModel> GetSettingsAsync(string userName, CancellationToken cancellationToken = default)
    {
        var settings = await Ctx.Settings
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

            Ctx.Settings.Add(newSettings);
            await Ctx.SaveChangesAsync(cancellationToken);

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

    public async Task SetColorSchemeAsync(string schemeName, string userName, CancellationToken cancellationToken = default)
    {
        int rows = await Ctx.Settings
            .Where(s => s.UserName == userName)
            .ExecuteUpdateAsync(setters => setters.SetProperty(s => s.ColorScheme, _ => schemeName),
                cancellationToken);

        if (rows == 0)
        {
            var newSettings = new Database.Tables.Settings
            {
                UserName = userName,
                ColorScheme = schemeName,
                HideKnownCards = DefaultHideKnownCards
            };

            Ctx.Settings.Add(newSettings);
            await Ctx.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task SetHideKnownWordsAsync(bool hideKnownWords, string userName, CancellationToken cancellationToken = default)
    {
        int rows = await Ctx.Settings
            .Where(s => s.UserName == userName)
            .ExecuteUpdateAsync(setters => setters.SetProperty(s => s.HideKnownCards, _ => hideKnownWords),
                cancellationToken);

        if (rows == 0)
        {
            var newSettings = new Database.Tables.Settings
            {
                UserName = userName,
                ColorScheme = DefaultColorScheme,
                HideKnownCards = hideKnownWords
            };

            Ctx.Settings.Add(newSettings);
            await Ctx.SaveChangesAsync(cancellationToken);
        }
    }
}
