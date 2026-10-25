using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KramarDev.FlashcardTrainer.WebAPI.Database.Migrations;

public partial class AddPasswordResetEmailQuota : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "PasswordResetEmails",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                EmailHash = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                IpAddress = table.Column<string>(type: "varchar(45)", unicode: false, maxLength: 45, nullable: false),
                SentAt = table.Column<DateTime>(type: "datetime2", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_PasswordResetEmails", x => x.Id));

        migrationBuilder.CreateIndex(name: "IX_PasswordResetEmails_EmailHash_SentAt", table: "PasswordResetEmails", columns: new[] { "EmailHash", "SentAt" });
        migrationBuilder.CreateIndex(name: "IX_PasswordResetEmails_IpAddress_SentAt", table: "PasswordResetEmails", columns: new[] { "IpAddress", "SentAt" });
        migrationBuilder.CreateIndex(name: "IX_PasswordResetEmails_SentAt", table: "PasswordResetEmails", column: "SentAt");
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropTable(name: "PasswordResetEmails");
}
