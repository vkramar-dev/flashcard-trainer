using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KramarDev.FlashcardTrainer.WebAPI.Database.Migrations
{
    /// <inheritdoc />
    public partial class ReduceCardFrontMaxLength : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // DATALENGTH / 2 is the UTF-16 length. Fail instead of truncating.
            migrationBuilder.Sql(
                """
                IF EXISTS (
                    SELECT 1
                    FROM [Cards]
                    WHERE DATALENGTH([FrontSide]) / 2 > 200
                )
                THROW 50000, 'Cards.FrontSide cannot be shortened to nvarchar(200) because at least one value is longer than 200 characters. Shorten those cards first. Nothing was truncated.', 1;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "FrontSide",
                table: "Cards",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(300)",
                oldMaxLength: 300);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "FrontSide",
                table: "Cards",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);
        }
    }
}
