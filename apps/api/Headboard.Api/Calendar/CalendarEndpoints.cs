using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Tasks;

namespace Headboard.Api.Calendar;

public record CalendarStatusDto(bool Available, bool Connected, string? CalendarId, long? LastSyncAt, string? LastError, long? ConnectedAt);
public record ConnectRequest(string? ReturnUrl);

public static class CalendarEndpoints
{
    public static IEndpointRouteBuilder MapCalendar(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/calendar");

        // GET /calendar → connection status
        g.MapGet("/", async (HttpContext ctx, AppDb db, GoogleCalendarClient google) =>
        {
            var link = await db.CalendarLinks.FindAsync(CurrentUser.Id(ctx));
            return Results.Ok(new CalendarStatusDto(google.IsConfigured, link is not null, link?.CalendarId, link?.LastSyncAt, link?.LastError, link?.ConnectedAt));
        }).RequireAuthorization();

        // POST /calendar/connect {returnUrl} → {url}: Google consent screen with offline Calendar access
        g.MapPost("/connect", (ConnectRequest body, HttpContext ctx, GoogleCalendarClient google, CalendarState state, IConfiguration cfg) =>
        {
            if (!google.IsConfigured) return Results.Json(new { error = "calendar_unavailable" }, statusCode: 503);
            var ret = body.ReturnUrl ?? "";
            if (!IsAllowedReturn(ret, cfg)) return Results.BadRequest(new { error = "invalid_returnUrl" });
            var url = google.AuthorizationUrl(RedirectUri(cfg, ctx), state.Create(CurrentUser.Id(ctx), ret, TimeSpan.FromMinutes(15)));
            return Results.Ok(new { url });
        }).RequireAuthorization();

        // GET /calendar/oauth/callback?code&state → stores the refresh token, redirects to returnUrl?calendar=connected|error
        g.MapGet("/oauth/callback", async (string? code, string? state, string? error, HttpContext ctx, AppDb db, GoogleCalendarClient google, CalendarState st, CalendarSyncScheduler scheduler, IConfiguration cfg, CancellationToken ct) =>
        {
            var p = st.Verify(state);
            if (p is null) return Results.BadRequest(new { error = "invalid_state" });
            if (!string.IsNullOrEmpty(error) || string.IsNullOrEmpty(code)) return Results.Redirect(WithQuery(p.Ret, "calendar=denied"));
            GoogleTokens tokens;
            try { tokens = await google.ExchangeCodeAsync(code, RedirectUri(cfg, ctx), ct); }
            catch (GoogleApiException) { return Results.Redirect(WithQuery(p.Ret, "calendar=error")); }
            if (string.IsNullOrEmpty(tokens.RefreshToken)) return Results.Redirect(WithQuery(p.Ret, "calendar=error"));

            var link = await db.CalendarLinks.FindAsync([p.Uid], ct);
            if (link is null) { link = new CalendarLinkRow { UserId = p.Uid, ConnectedAt = Wire.Now() }; db.CalendarLinks.Add(link); }
            link.RefreshToken = tokens.RefreshToken;
            link.AccessToken = tokens.AccessToken;
            link.AccessTokenExpiresAt = Wire.Now() + tokens.ExpiresIn * 1000L;
            link.LastError = null;
            await db.SaveChangesAsync(ct);
            scheduler.Nudge(p.Uid);
            return Results.Redirect(WithQuery(p.Ret, "calendar=connected"));
        });

        // POST /calendar/sync → reconcile now, returns status
        g.MapPost("/sync", async (HttpContext ctx, CalendarSyncScheduler scheduler, GoogleCalendarClient google, CancellationToken ct) =>
        {
            var link = await scheduler.ReconcileAsync(CurrentUser.Id(ctx), ct);
            if (link is null) return Results.NotFound(new { error = "not_connected" });
            return Results.Ok(new CalendarStatusDto(google.IsConfigured, true, link.CalendarId, link.LastSyncAt, link.LastError, link.ConnectedAt));
        }).RequireAuthorization();

        // DELETE /calendar → disconnect (events stay in the user's calendar)
        g.MapDelete("/", async (HttpContext ctx, CalendarSyncService svc, CancellationToken ct) =>
        {
            await svc.DisconnectAsync(CurrentUser.Id(ctx), ct);
            return Results.NoContent();
        }).RequireAuthorization();

        return app;
    }

    /// <summary><c>Calendar:RedirectUri</c> or this host's <c>/calendar/oauth/callback</c>.</summary>
    public static string RedirectUri(IConfiguration cfg, HttpContext ctx) =>
        cfg["Calendar:RedirectUri"] is { Length: > 0 } r ? r : $"{ctx.Request.Scheme}://{ctx.Request.Host}/calendar/oauth/callback";

    public static bool IsAllowedReturn(string ret, IConfiguration cfg)
    {
        if (string.IsNullOrWhiteSpace(ret)) return false;
        var allowed = cfg.GetSection("Calendar:AllowedReturnUrls").Get<string[]>() ?? ["http://localhost:5173", "http://localhost:8081", "headboard://"];
        return allowed.Any(a => ret.StartsWith(a, StringComparison.OrdinalIgnoreCase));
    }

    private static string WithQuery(string url, string kv) => url + (url.Contains('?') ? "&" : "?") + kv;
}
