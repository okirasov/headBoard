using System.Text.Json;
using System.Text.Json.Serialization;
using Headboard.Api.Ai;
using Headboard.Api.Auth;
using Headboard.Api.Calendar;
using Headboard.Api.Push;
using Headboard.Api.Templates;
using Headboard.Api.Tags;
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
builder.Services.AddHttpClient(Headboard.Api.Calendar.GoogleCalendarClient.HttpClientName, c => c.Timeout = TimeSpan.FromSeconds(30));
builder.Services.AddSingleton<Headboard.Api.Jobs.LeaderLease>();
builder.Services.AddSingleton<Headboard.Api.Calendar.GoogleCalendarClient>();
builder.Services.AddSingleton<Headboard.Api.Calendar.CalendarState>();
builder.Services.AddScoped<Headboard.Api.Calendar.CalendarSyncService>();
builder.Services.AddSingleton<Headboard.Api.Calendar.CalendarSyncScheduler>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<Headboard.Api.Calendar.CalendarSyncScheduler>());
builder.Services.AddHttpClient(Headboard.Api.Push.ExpoPushSender.HttpClientName, c => c.Timeout = TimeSpan.FromSeconds(20));
builder.Services.AddSingleton<Headboard.Api.Push.WebPushSender>();
builder.Services.AddSingleton<Headboard.Api.Push.IPushSender>(sp => sp.GetRequiredService<Headboard.Api.Push.WebPushSender>());
builder.Services.AddSingleton<Headboard.Api.Push.IPushSender, Headboard.Api.Push.ExpoPushSender>();
builder.Services.AddScoped<Headboard.Api.Push.PushDispatcher>();
builder.Services.AddSingleton<Headboard.Api.Push.StaleNotifier>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<Headboard.Api.Push.StaleNotifier>());
builder.Services.AddSingleton<Headboard.Api.Push.DueNotifier>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<Headboard.Api.Push.DueNotifier>());
builder.Services.AddSingleton<Headboard.Api.Digest.DigestScheduler>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<Headboard.Api.Digest.DigestScheduler>());

if (builder.Environment.IsDevelopment()) builder.Services.AddOpenApi();
// Browser origins: the dev servers in Development, plus whatever Cors:Origins lists (the deployed web app) everywhere.
var corsOrigins = (builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? []).Where(o => !string.IsNullOrWhiteSpace(o)).ToList();
if (builder.Environment.IsDevelopment()) corsOrigins.AddRange(["http://localhost:5173", "http://localhost:8081"]);
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins([.. corsOrigins.Distinct()])
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDb>();
    if (db.Database.IsSqlite()) db.Database.Migrate();
    else db.Database.EnsureCreated(); // Postgres: migrations are SQLite-generated; see README.
}

app.UseCors();
// Production image ships the web app in wwwroot: static assets plus an index.html fallback for SPA routes (?view=…).
var spa = Directory.Exists(Path.Combine(app.Environment.ContentRootPath, "wwwroot"));
if (spa)
{
    app.UseDefaultFiles();
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = ctx =>
        {
            // Hashed assets may be cached forever; the entry point and the service worker must always be fresh.
            var cache = ctx.File.Name == "index.html" || ctx.File.Name == "sw.js" ? "no-cache" : "public, max-age=31536000, immutable";
            ctx.Context.Response.Headers.CacheControl = cache;
        },
    });
}
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // GET /openapi/v1.json
}
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", (Headboard.Api.Jobs.LeaderLease lease) => Results.Ok(new { ok = true, instance = lease.InstanceId, leader = !lease.Enabled || lease.IsLeader }));
app.MapAuth();
app.MapTasks();
app.MapComments();
app.MapProjects();
app.MapSettings();
app.MapFiles();
app.MapAi();
app.MapCalendar();
app.MapPush();
app.MapTemplates();
app.MapTags();

if (spa) app.MapFallbackToFile("index.html");

app.Run();

public partial class Program { }
