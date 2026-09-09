using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Tasks;

namespace Headboard.Api.Settings;

/// <summary>Wire shape of core <c>Settings</c>. <c>DigestAt</c> is server-owned; <c>TimeZone</c> is an IANA id.</summary>
public record SettingsDto(string Lang, string Theme, bool ShowDone, string? DigestText, long? DigestAt, string? TimeZone, bool? NotifyStale)
{
    public static SettingsDto Defaults => new("en", "light", true, null, null, null, true);
    public static SettingsDto From(SettingsRow r) => new(r.Lang, r.Theme, r.ShowDone, r.DigestText, r.DigestAt, r.TimeZone, r.NotifyStale);
}

public static class SettingsEndpoints
{
    public static IEndpointRouteBuilder MapSettings(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/settings").RequireAuthorization();

        g.MapGet("/", async (HttpContext ctx, AppDb db) =>
        {
            var row = await db.Settings.FindAsync(CurrentUser.Id(ctx));
            return Results.Ok(row is null ? SettingsDto.Defaults : SettingsDto.From(row));
        });

        g.MapPut("/", async (SettingsDto body, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            if (!Wire.Langs.Contains(body.Lang)) return Results.BadRequest(new { error = "invalid_lang" });
            if (!Wire.Themes.Contains(body.Theme)) return Results.BadRequest(new { error = "invalid_theme" });
            if (body.TimeZone is { Length: > 0 } tz && !Digest.DigestSchedule.IsValidTimeZone(tz)) return Results.BadRequest(new { error = "invalid_timeZone" });
            var row = await db.Settings.FindAsync(uid);
            if (row is null) { row = new SettingsRow { UserId = uid }; db.Settings.Add(row); }
            row.Lang = body.Lang;
            row.Theme = body.Theme;
            row.ShowDone = body.ShowDone;
            // null means "no change": a client that never had a digest must not erase the scheduled one.
            if (body.DigestText is not null && body.DigestText != row.DigestText) { row.DigestText = body.DigestText; row.DigestAt = Wire.Now(); }
            if (!string.IsNullOrWhiteSpace(body.TimeZone)) row.TimeZone = body.TimeZone;
            if (body.NotifyStale is { } ns) row.NotifyStale = ns;
            await db.SaveChangesAsync();
            return Results.Ok(SettingsDto.From(row));
        });

        return app;
    }
}
