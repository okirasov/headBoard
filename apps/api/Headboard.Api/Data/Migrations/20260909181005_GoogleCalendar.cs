using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Headboard.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class GoogleCalendar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CalendarEventId",
                table: "Tasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CalendarHash",
                table: "Tasks",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CalendarLinks",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RefreshToken = table.Column<string>(type: "TEXT", nullable: false),
                    AccessToken = table.Column<string>(type: "TEXT", nullable: true),
                    AccessTokenExpiresAt = table.Column<long>(type: "INTEGER", nullable: true),
                    CalendarId = table.Column<string>(type: "TEXT", nullable: true),
                    SyncToken = table.Column<string>(type: "TEXT", nullable: true),
                    LastSyncAt = table.Column<long>(type: "INTEGER", nullable: true),
                    LastError = table.Column<string>(type: "TEXT", nullable: true),
                    ConnectedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    PendingDeletesJson = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarLinks", x => x.UserId);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalendarLinks");

            migrationBuilder.DropColumn(
                name: "CalendarEventId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "CalendarHash",
                table: "Tasks");
        }
    }
}
