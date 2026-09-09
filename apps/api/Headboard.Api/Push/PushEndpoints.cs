using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Push;

public record SubscribeRequest(string? Kind, string? Endpoint, string? Token, SubscribeKeys? Keys, string? Label);
public record SubscribeKeys(string? P256dh, string? Auth);
public record UnsubscribeRequest(string? Endpoint, string? Token);
public record PushConfigDto(bool WebPush, string? VapidPublicKey, bool Expo);
public record PushSubscriptionDto(string Id, string Kind, string? Label, long CreatedAt, long? LastSentAt);

public static class PushEndpoints
{
    public static IEndpointRouteBuilder MapPush(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/push");

        // GET /push/config → which channels work and the VAPID public key for the browser
        g.MapGet("/config", (WebPushSender web) => Results.Ok(new PushConfigDto(web.IsConfigured, web.IsConfigured ? web.PublicKey : null, true)));

        // GET /push/subscriptions → this user's devices
        g.MapGet("/subscriptions", async (HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            var rows = await db.PushSubscriptions.Where(p => p.UserId == uid).OrderBy(p => p.CreatedAt).ToListAsync();
            return Results.Ok(rows.Select(r => new PushSubscriptionDto(r.Id, r.Kind, r.Label, r.CreatedAt, r.LastSentAt)).ToList());
        }).RequireAuthorization();

        // POST /push/subscribe {kind:"webpush", endpoint, keys:{p256dh,auth}} | {kind:"expo", token}
        g.MapPost("/subscribe", async (SubscribeRequest body, HttpContext ctx, AppDb db, PushDispatcher dispatcher) =>
        {
            var uid = CurrentUser.Id(ctx);
            var kind = (body.Kind ?? "webpush").ToLowerInvariant();
            if (dispatcher.For(kind) is not { } sender) return Results.BadRequest(new { error = "invalid_kind" });
            if (!sender.IsConfigured) return Results.Json(new { error = "push_unavailable" }, statusCode: 503);
            var endpoint = kind == "expo" ? body.Token : body.Endpoint;
            if (string.IsNullOrWhiteSpace(endpoint)) return Results.BadRequest(new { error = kind == "expo" ? "token_required" : "endpoint_required" });
            if (kind == "webpush" && (string.IsNullOrWhiteSpace(body.Keys?.P256dh) || string.IsNullOrWhiteSpace(body.Keys?.Auth))) return Results.BadRequest(new { error = "keys_required" });

            var row = await db.PushSubscriptions.SingleOrDefaultAsync(p => p.UserId == uid && p.Endpoint == endpoint);
            if (row is null) { row = new PushSubscriptionRow { Id = Wire.NewId('s'), UserId = uid, Endpoint = endpoint, CreatedAt = Wire.Now() }; db.PushSubscriptions.Add(row); }
            row.Kind = kind; row.P256dh = body.Keys?.P256dh; row.Auth = body.Keys?.Auth; row.Label = body.Label; row.FailCount = 0;
            await db.SaveChangesAsync();
            return Results.Ok(new PushSubscriptionDto(row.Id, row.Kind, row.Label, row.CreatedAt, row.LastSentAt));
        }).RequireAuthorization();

        // DELETE /push/subscribe {endpoint} | {token}
        g.MapDelete("/subscribe", async ([Microsoft.AspNetCore.Mvc.FromBody] UnsubscribeRequest body, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            var endpoint = body.Endpoint ?? body.Token;
            if (string.IsNullOrWhiteSpace(endpoint)) return Results.BadRequest(new { error = "endpoint_required" });
            var rows = await db.PushSubscriptions.Where(p => p.UserId == uid && p.Endpoint == endpoint).ToListAsync();
            db.PushSubscriptions.RemoveRange(rows);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();

        // POST /push/test → a test notification to every device of the caller
        g.MapPost("/test", async (HttpContext ctx, AppDb db, PushDispatcher dispatcher, CancellationToken ct) =>
        {
            var uid = CurrentUser.Id(ctx);
            var settings = await db.Settings.FindAsync([uid], ct);
            var ru = settings?.Lang == "ru";
            var subs = await db.PushSubscriptions.Where(p => p.UserId == uid).ToListAsync(ct);
            var n = await dispatcher.SendToAllAsync(subs, new PushPayload(ru ? "Headboard на связи" : "Headboard is connected", ru ? "Так будут приходить напоминания о забытых задачах." : "This is how reminders about forgotten tasks will arrive.", StaleMessage.Url, "test"), Wire.Now(), ct);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { sent = n });
        }).RequireAuthorization();

        return app;
    }
}
