using KramarDev.FlashcardTrainer.WebAPI.Database.Tables;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Database;

public class FlashcardsDbContext : IdentityDbContext<IdentityUser>
{
    public FlashcardsDbContext()
    {
    }

    public FlashcardsDbContext(DbContextOptions options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Set>()
            .HasMany(e => e.Cards)
            .WithOne(e => e.ParentSet)
            .HasForeignKey(e => e.SetId)
            .HasPrincipalKey(e => e.Id)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<IdentityRole>()
            .HasData(
                new IdentityRole
                {
                    Id = "7B4E9D6D-41C3-4E22-9B28-111111111111",
                    Name = Constants.UserRole,
                    NormalizedName = Constants.UserRole.ToUpper(),
                    ConcurrencyStamp = "A1C7E8D4-1111-4444-8888-111111111111"
                },
                new IdentityRole
                {
                    Id = "8C5F0E7E-52D4-5F33-AB39-222222222222",
                    Name = Constants.PowerUserRole,
                    NormalizedName = Constants.PowerUserRole.ToUpper(),
                    ConcurrencyStamp = "B2D8F9E5-2222-5555-9999-222222222222"
                }
            );

        builder.Entity<Set>().HasIndex(e => e.UserName);
    }

    public DbSet<Set> Sets { get; set; }

    public DbSet<Card> Cards { get; set; }
}
