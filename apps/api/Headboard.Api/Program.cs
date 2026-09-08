using System.Text.Json;
using System.Text.Json.Serialization;
using Headboard.Api.Auth;
using Headboard.Api.Comments;
using Headboard.Api.Files;
using Headboard.Api.Projects;
using Headboard.Api.Settings;
using Headboard.Api.Tasks;
using Headboard.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

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

// Auth: HS256 JWT issued by TokenService; external id-tokens verified per provider.
// Options are bound lazily so they see the final configuration (tests override it in memory).
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IConfiguration>((o, cfg) =>
    {
        var issuer = TokenService.Issuer(cfg);
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = issuer,
            ValidAudience = issuer,
            IssuerSigningKey = TokenService.SigningKey(cfg),
            NameClaimType = "name",
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<GoogleVerifier>();
builder.Services.AddSingleton<AppleVerifier>();
builder.Services.AddSingleton<LocalStorage>();

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
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { ok = true }));
app.MapAuth();
app.MapTasks();
app.MapComments();
app.MapProjects();
app.MapSettings();

app.Run();

public partial class Program { }
