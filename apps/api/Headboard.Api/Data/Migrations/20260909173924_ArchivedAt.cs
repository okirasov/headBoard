using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Headboard.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ArchivedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "ArchivedAt",
                table: "Tasks",
                type: "INTEGER",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "Tasks");
        }
    }
}
