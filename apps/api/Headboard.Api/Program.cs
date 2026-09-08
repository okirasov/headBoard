using System.Text.Json;
using System.Text.Json.Serialization;
using Headboard.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// JSON: camelCase, nulls serialized (never omitted) so DTOs match packages/core/src/model.ts.
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    o.SerializerOptions.PropertyNameCaseInsensitive = true;
});

// Database: SQLite by default, PostgreSQL when ConnectionStrings:Postgres is present.
var postgres = builder.Configuration.GetConnectionString("Postgres");
var sqlite = builder.Configuration.GetConnectionString("Sqlite") ?? "Data Source=headboard.db";
builder.Services.AddDbContext<AppDb>(o =>
{
    if (!string.IsNullOrWhiteSpace(postgres)) o.UseNpgsql(postgres);
    else o.UseSqlite(sqlite);
});

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173", "http://localhost:8081")
        .AllowAnyHeader()
        .AllowAnyMethod()));
}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    if (db.Database.IsSqlite()) db.Database.Migrate();
    else db.Database.EnsureCreated(); // Postgres: migrations are SQLite-generated; see README.
}

if (app.Environment.IsDevelopment()) app.UseCors();

app.MapGet("/health", () => Results.Ok(new { ok = true }));

app.Run();

public partial class Program { }
