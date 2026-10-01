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

        builder.Entity<Set>(entity =>
        {
            entity.Property(e => e.UserName)
                .HasMaxLength(ModelConstraints.UserNameMaxLength)
                .IsRequired();

            entity.Property(e => e.Name)
                .HasMaxLength(ModelConstraints.SetNameMaxLength)
                .IsRequired();

            entity.HasIndex(e => e.UserName);

            entity.HasMany(e => e.Cards)
                .WithOne(e => e.ParentSet)
                .HasForeignKey(e => e.SetId)
                .HasPrincipalKey(e => e.Id)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Settings>(entity =>
        {
            entity.Property(e => e.UserName)
                .HasMaxLength(ModelConstraints.UserNameMaxLength)
                .IsRequired();

            entity.Property(e => e.ColorScheme)
                .HasMaxLength(ModelConstraints.ColorSchemeMaxLength)
                .IsRequired();

            entity.HasIndex(e => e.UserName)
                .IsUnique();
        });

        builder.Entity<Card>(entity =>
        {
            entity.Property(e => e.FrontSide)
                .HasMaxLength(ModelConstraints.CardFrontMaxLength)
                .IsRequired();

            entity.Property(e => e.BackSide)
                .HasMaxLength(ModelConstraints.CardBackMaxLength);

            entity.HasIndex(c => new { c.SetId, c.FrontSide })
                .IsUnique();
        });

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

        builder.Entity<RegisteringUser>(entity =>
        {
            entity.ToTable("RegisteringUsers");

            entity.Property(e => e.Email)
                .HasMaxLength(256)
                .IsRequired();

            entity.Property(e => e.Code)
                .HasMaxLength(3)
                .IsFixedLength()
                .IsUnicode(false)
                .IsRequired();

            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .IsUnicode(false)
                .IsRequired();

            entity.Property(e => e.FailCount)
                .HasColumnType("tinyint")
                .IsRequired();

            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.Property(e => e.CodeExpAt)
                .IsRequired();

            entity.Property(e => e.IsCompleted)
                .IsRequired();

            entity.HasIndex(e => new { e.Email, e.Id });
            entity.HasIndex(e => new { e.IpAddress, e.CreatedAt });
        });

        builder.Entity<BlockedIpAddress>(entity =>
        {
            entity.ToTable("BlockedIpAddress");
            entity.HasKey(e => new { e.ExpAt, e.IpAddress });

            entity.Property(e => e.ExpAt)
                .IsRequired();

            entity.Property(e => e.IpAddress)
                .HasMaxLength(45)
                .IsUnicode(false)
                .IsRequired();
        });
    }

    public DbSet<Set> Sets { get; set; }

    public DbSet<Card> Cards { get; set; }

    public DbSet<Settings> Settings { get; set; }

    public DbSet<RegisteringUser> RegisteringUsers { get; set; }

    public DbSet<BlockedIpAddress> BlockedIpAddresses { get; set; }
}
