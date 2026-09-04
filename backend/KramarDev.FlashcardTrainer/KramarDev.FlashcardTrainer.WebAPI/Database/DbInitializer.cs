using KramarDev.FlashcardTrainer.WebAPI.Database.Tables;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Database;

public static class DbInitializer
{
    // dotnet ef migrations add InitialCreate -o Database/Migrations

    // Add any initials here.
    public static async Task MigrateAndInitializeAsync(IServiceScope scope, CancellationToken cancellationToken = default)
    {
        var dbCtx = scope.ServiceProvider
            .GetRequiredService<FlashcardsDbContext>();

        await dbCtx.Database.MigrateAsync();

        var userManager = scope.ServiceProvider
       .GetRequiredService<UserManager<IdentityUser>>();

        var user1 = await userManager.FindByNameAsync("user17");

        if (user1 == null)
        {
            user1 = new IdentityUser
            {
                UserName = "user17",
                Email = "user17@test.com",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(
                user1,
                "user17");

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user1, Constants.UserRole);
            }
        }

        var user2 = await userManager.FindByNameAsync("PowerUser29");

        if (user2 == null)
        {
            user2 = new IdentityUser
            {
                UserName = "PowerUser29",
                Email = "PowerUser29@test.com",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(
                user2,
                "PowerUser29");

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user2, Constants.PowerUserRole);
            }
        }

        if (!await dbCtx.Sets.AnyAsync(cancellationToken))
        {
            var now = DateTime.UtcNow;

            var set1 = new Set
            {
                Name = "English - Basic Words",
                UserName = user1!.UserName!,
                Created = now,
                Modified = now,
                Cards =
                [
                    new Card { FrontSide = "стол", BackSide = "a table" },
                new Card { FrontSide = "яблоко", BackSide = "an apple" },
                new Card { FrontSide = "книга", BackSide = "a book" },
                new Card { FrontSide = "стул", BackSide = "a chair" },
                new Card { FrontSide = "окно", BackSide = "a window" },
                new Card { FrontSide = "дверь", BackSide = "a door" },
                new Card { FrontSide = "дом", BackSide = "a house" },
                new Card { FrontSide = "машина", BackSide = "a car" },
                new Card { FrontSide = "дерево", BackSide = "a tree" },
                new Card { FrontSide = "вода", BackSide = "water" }
                ]
            };

            var set2 = new Set
            {
                Name = "English - Verbs",
                UserName = user1.UserName!,
                Created = now,
                Modified = now,
                Cards =
                [
                    new Card { FrontSide = "идти", BackSide = "to go" },
                new Card { FrontSide = "приходить", BackSide = "to come" },
                new Card { FrontSide = "читать", BackSide = "to read" },
                new Card { FrontSide = "писать", BackSide = "to write" },
                new Card { FrontSide = "говорить", BackSide = "to speak" },
                new Card { FrontSide = "слушать", BackSide = "to listen" },
                new Card { FrontSide = "видеть", BackSide = "to see" },
                new Card { FrontSide = "знать", BackSide = "to know" },
                new Card { FrontSide = "думать", BackSide = "to think" },
                new Card { FrontSide = "работать", BackSide = "to work" }
                ]
            };

            var set3 = new Set
            {
                Name = "German - Basic Words",
                UserName = user1.UserName!,
                Created = now,
                Modified = now,
                Cards =
                [
                    new Card { FrontSide = "стол", BackSide = "der Tisch" },
                new Card { FrontSide = "яблоко", BackSide = "der Apfel" },
                new Card { FrontSide = "книга", BackSide = "das Buch" },
                new Card { FrontSide = "стул", BackSide = "der Stuhl" },
                new Card { FrontSide = "окно", BackSide = "das Fenster" },
                new Card { FrontSide = "дверь", BackSide = "die Tür" },
                new Card { FrontSide = "дом", BackSide = "das Haus" },
                new Card { FrontSide = "машина", BackSide = "das Auto" },
                new Card { FrontSide = "дерево", BackSide = "der Baum" },
                new Card { FrontSide = "вода", BackSide = "das Wasser" }
                ]
            };

            var set4 = new Set
            {
                Name = "English - IT",
                UserName = user2!.UserName!,
                Created = now,
                Modified = now,
                Cards =
                [
                    new Card { FrontSide = "база данных", BackSide = "database" },
                new Card { FrontSide = "запрос", BackSide = "query" },
                new Card { FrontSide = "поток", BackSide = "thread" },
                new Card { FrontSide = "исключение", BackSide = "exception" },
                new Card { FrontSide = "наследование", BackSide = "inheritance" },
                new Card { FrontSide = "интерфейс", BackSide = "interface" },
                new Card { FrontSide = "сборка", BackSide = "assembly" },
                new Card { FrontSide = "очередь", BackSide = "queue" },
                new Card { FrontSide = "стек", BackSide = "stack" },
                new Card { FrontSide = "куча", BackSide = "heap" }
                ]
            };

            var set5 = new Set
            {
                Name = "German - Verbs",
                UserName = user2.UserName!,
                Created = now,
                Modified = now,
                Cards =
                [
                    new Card { FrontSide = "идти", BackSide = "gehen" },
                new Card { FrontSide = "приходить", BackSide = "kommen" },
                new Card { FrontSide = "читать", BackSide = "lesen" },
                new Card { FrontSide = "писать", BackSide = "schreiben" },
                new Card { FrontSide = "говорить", BackSide = "sprechen" },
                new Card { FrontSide = "слушать", BackSide = "hören" },
                new Card { FrontSide = "видеть", BackSide = "sehen" },
                new Card { FrontSide = "знать", BackSide = "wissen" },
                new Card { FrontSide = "работать", BackSide = "arbeiten" },
                new Card { FrontSide = "учить", BackSide = "lernen" }
                ]
            };

            await dbCtx.Sets.AddRangeAsync(
                [set1, set2, set3, set4, set5],
                cancellationToken);

            await dbCtx.SaveChangesAsync(cancellationToken);
        }
    }
}
