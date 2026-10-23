using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KramarDev.FlashcardTrainer.WebAPI.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddSetUsedCharacters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "UsedCharacters",
                table: "Sets",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            // DATALENGTH / 2 matches nvarchar character length, including trailing spaces.
            migrationBuilder.Sql(
                """
                UPDATE s
                SET s.UsedCharacters = totals.UsedCharacters
                FROM [Sets] AS s
                INNER JOIN (
                    SELECT
                        c.SetId,
                        SUM(
                            CAST(ISNULL(DATALENGTH(c.FrontSide), 0) / 2 AS bigint)
                            + CAST(ISNULL(DATALENGTH(c.BackSide), 0) / 2 AS bigint)
                        ) AS UsedCharacters
                    FROM [Cards] AS c
                    GROUP BY c.SetId
                ) AS totals ON totals.SetId = s.Id
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UsedCharacters",
                table: "Sets");
        }
    }
}
