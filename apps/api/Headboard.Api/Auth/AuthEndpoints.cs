using Headboard.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Auth;

public record IdTokenRequest(string IdToken, string? Name);
/// <summary>Google sign-in: either an id-token (native apps) or an authorization code from the web code-flow popup.</summary>
public record GoogleLoginRequest(string? IdToken, string? Code, string? RedirectUri);
public record DevLoginRequest(string Email, string? Name, string? Provider);
public record UserDto(string Name, string Email, string Provider, string Initials);
public record AuthResponse(string Token, UserDto User);

public static class AuthEndpoints
{
    public static readonly string[] Providers = ["Google", "Apple"];

    public static IEndpointRouteBuilder MapAuth(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/auth");

        g.MapPost("/google", async (GoogleLoginRequest req, GoogleVerifier verifier, AppDb db, TokenService tokens, CancellationToken ct) =>
        {
            if (!verifier.IsConfigured) return Results.Json(new { error = "auth_unavailable" }, statusCode: 503);
            var idToken = req.IdToken;
            if (string.IsNullOrWhiteSpace(idToken) && !string.IsNullOrWhiteSpace(req.Code))
            {
                if (!verifier.CanExchangeCode) return Results.Json(new { error = "code_exchange_unavailable" }, statusCode: 503);
                idToken = await verifier.ExchangeCodeAsync(req.Code, req.RedirectUri ?? "postmessage", ct);
                if (idToken is null) return Results.Unauthorized();
            }
            if (string.IsNullOrWhiteSpace(idToken)) return Results.BadRequest(new { error = "id_token_or_code_required" });
            var id = await verifier.VerifyAsync(idToken);
            if (id is null) return Results.Unauthorized();
            return Results.Ok(await Login(db, tokens, "Google", id));
        });

        g.MapPost("/apple", async (IdTokenRequest req, AppleVerifier verifier, AppDb db, TokenService tokens, CancellationToken ct) =>
        {
            if (!verifier.IsConfigured) return Results.Json(new { error = "auth_unavailable" }, statusCode: 503);
            if (string.IsNullOrWhiteSpace(req.IdToken)) return Results.BadRequest(new { error = "id_token_required" });
            var id = await verifier.VerifyAsync(req.IdToken, req.Name, ct);
            if (id is null) return Results.Unauthorized();
            return Results.Ok(await Login(db, tokens, "Apple", id));
        });

        g.MapPost("/dev", async (DevLoginRequest req, IConfiguration cfg, IWebHostEnvironment env, AppDb db, TokenService tokens) =>
        {
            var allow = cfg.GetValue<bool?>("Auth:AllowDevLogin") ?? env.IsDevelopment();
            if (!allow) return Results.NotFound();
            if (string.IsNullOrWhiteSpace(req.Email)) return Results.BadRequest(new { error = "email_required" });
            var provider = Providers.FirstOrDefault(p => p.Equals(req.Provider, StringComparison.OrdinalIgnoreCase)) ?? "Google";
            var email = req.Email.Trim();
            var name = string.IsNullOrWhiteSpace(req.Name) ? AppleVerifier.LocalPart(email) : req.Name.Trim();
            var id = new ExternalIdentity("dev:" + email.ToLowerInvariant(), email, name);
            return Results.Ok(await Login(db, tokens, provider, id));
        });

        app.MapGet("/me", async (HttpContext ctx, AppDb db) =>
        {
            var user = await db.Users.FindAsync(CurrentUser.Id(ctx));
            return user is null ? Results.Unauthorized() : Results.Ok(ToDto(user));
        }).RequireAuthorization();

        // Account deletion: every row the user owns plus stored file bytes. Idempotent; tokens stop working because the user row is gone.
        app.MapDelete("/me", async (HttpContext ctx, AppDb db, Headboard.Api.Files.LocalStorage storage) =>
        {
            var uid = CurrentUser.Id(ctx);
            var user = await db.Users.FindAsync(uid);
            if (user is null) return Results.NoContent();
            var files = await db.Files.Where(f => f.UserId == uid).ToListAsync();
            foreach (var f in files) storage.Delete(f.StoragePath);
            db.Files.RemoveRange(files);
            db.Comments.RemoveRange(db.Comments.Where(c => c.UserId == uid));
            db.Tasks.RemoveRange(db.Tasks.Where(t => t.UserId == uid));
            db.Projects.RemoveRange(db.Projects.Where(p => p.UserId == uid));
            db.Templates.RemoveRange(db.Templates.Where(t => t.UserId == uid));
            db.PushSubscriptions.RemoveRange(db.PushSubscriptions.Where(p => p.UserId == uid));
            db.CalendarLinks.RemoveRange(db.CalendarLinks.Where(l => l.UserId == uid));
            db.Settings.RemoveRange(db.Settings.Where(s => s.UserId == uid));
            db.Users.Remove(user);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();

        return app;
    }

    /// <summary>Upserts the user by (provider, subject) and issues a JWT.</summary>
    private static async Task<AuthResponse> Login(AppDb db, TokenService tokens, string provider, ExternalIdentity id)
    {
        var user = await db.Users.SingleOrDefaultAsync(u => u.Provider == provider && u.Subject == id.Subject);
        if (user is null)
        {
            user = new UserRow
            {
                Id = Guid.NewGuid(),
                Provider = provider,
                Subject = id.Subject,
                Email = id.Email,
                Name = id.Name,
                Initials = Initials(id.Name, id.Email),
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            };
            db.Users.Add(user);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(id.Email)) user.Email = id.Email;
            if (!string.IsNullOrWhiteSpace(id.Name)) { user.Name = id.Name; user.Initials = Initials(id.Name, id.Email); }
        }
        await db.SaveChangesAsync();
        return new AuthResponse(tokens.Create(user), ToDto(user));
    }

    public static UserDto ToDto(UserRow u) => new(u.Name, u.Email, u.Provider, u.Initials);

    /// <summary>First letters of up to two name words; falls back to the email's first letter.</summary>
    public static string Initials(string name, string email = "")
    {
        var words = name.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var s = string.Concat(words.Take(2).Select(w => char.ToUpperInvariant(w[0])));
        if (s.Length == 0 && email.Length > 0) s = char.ToUpperInvariant(email[0]).ToString();
        return s.Length == 0 ? "?" : s;
    }
}
