using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Tasks;

namespace Headboard.Api.Settings;

public record SettingsDto(string Lang, string Theme, bool ShowDone, string? DigestText)
{
    public static SettingsDto Defaults => new("en", "light", true, null);
    public static SettingsDto From(SettingsRow r) => new(r.Lang, r.Theme, r.ShowDone, r.DigestText);
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
            var row = await db.Settings.FindAsync(uid);
            if (row is null) { row = new SettingsRow { UserId = uid }; db.Settings.Add(row); }
            row.Lang = body.Lang;
            row.Theme = body.Theme;
            row.ShowDone = body.ShowDone;
            row.DigestText = body.DigestText;
            await db.SaveChangesAsync();
            return Results.Ok(SettingsDto.From(row));
        });

        return app;
    }
}
