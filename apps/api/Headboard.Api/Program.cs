using System.Text.Json;
using System.Text.Json.Serialization;
using Headboard.Api.Ai;
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
// Resolved lazily from DI so the final configuration (incl. test overrides) is used.
builder.Services.AddDbContext<AppDb>((sp, o) =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var postgres = cfg.GetConnectionString("Postgres");
    if (!string.IsNullOrWhiteSpace(postgres)) o.UseNpgsql(postgres);
    else o.UseSqlite(cfg.GetConnectionString("Sqlite") is { Length: > 0 } s ? s : "Data Source=headboard.db");
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
builder.Services.AddHttpClient<AnthropicClient>(AnthropicClient.HttpClientName, c => c.Timeout = TimeSpan.FromSeconds(60));
builder.Services.AddHttpClient(GoogleVerifier.HttpClientName, c => c.Timeout = TimeSpan.FromSeconds(15));
builder.Services.AddScoped<Headboard.Api.Digest.DigestService>();
builder.Services.AddSingleton<Headboard.Api.Digest.DigestScheduler>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<Headboard.Api.Digest.DigestScheduler>());

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddOpenApi();
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

if (app.Environment.IsDevelopment())
{
    app.UseCors();
    app.MapOpenApi(); // GET /openapi/v1.json
}
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { ok = true }));
app.MapAuth();
app.MapTasks();
app.MapComments();
app.MapProjects();
app.MapSettings();
app.MapFiles();
app.MapAi();

app.Run();

public partial class Program { }
