using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Headboard.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class DigestSchedule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "DigestAt",
                table: "Settings",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimeZone",
                table: "Settings",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DigestAt",
                table: "Settings");

            migrationBuilder.DropColumn(
                name: "TimeZone",
                table: "Settings");
        }
    }
}
