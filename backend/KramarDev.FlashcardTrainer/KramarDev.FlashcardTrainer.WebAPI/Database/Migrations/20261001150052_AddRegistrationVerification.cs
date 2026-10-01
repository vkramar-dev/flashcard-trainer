using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KramarDev.FlashcardTrainer.WebAPI.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddRegistrationVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BlockedIpAddress",
                columns: table => new
                {
                    ExpAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IpAddress = table.Column<string>(type: "varchar(45)", unicode: false, maxLength: 45, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlockedIpAddress", x => new { x.ExpAt, x.IpAddress });
                });

            migrationBuilder.CreateTable(
                name: "RegisteringUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Code = table.Column<string>(type: "char(3)", unicode: false, fixedLength: true, maxLength: 3, nullable: false),
                    IpAddress = table.Column<string>(type: "varchar(45)", unicode: false, maxLength: 45, nullable: false),
                    FailCount = table.Column<byte>(type: "tinyint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CodeExpAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegisteringUsers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RegisteringUsers_Email_Id",
                table: "RegisteringUsers",
                columns: new[] { "Email", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_RegisteringUsers_IpAddress_CreatedAt",
                table: "RegisteringUsers",
                columns: new[] { "IpAddress", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BlockedIpAddress");

            migrationBuilder.DropTable(
                name: "RegisteringUsers");
        }
    }
}
