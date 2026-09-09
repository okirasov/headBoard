using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Headboard.Api.Data;
using WebPush;

namespace Headboard.Api.Push;

/// <summary>What a notification carries; <c>Url</c> is an app-relative deep link (e.g. <c>/?view=review</c>).</summary>
public record PushPayload(string Title, string Body, string Url, string Tag);

public enum PushResult { Ok, Gone, Failed }

public interface IPushSender
{
    /// <summary>Kinds this sender handles ("webpush", "expo").</summary>
    string Kind { get; }
    bool IsConfigured { get; }
    Task<PushResult> SendAsync(PushSubscriptionRow sub, PushPayload payload, CancellationToken ct);
}

/// <summary>Web Push (RFC 8030/8291) with VAPID keys from <c>Push:VapidPublicKey</c> / <c>Push:VapidPrivateKey</c>.</summary>
public class WebPushSender(IConfiguration cfg, ILogger<WebPushSender> log) : IPushSender
{
    public string Kind => "webpush";
    public string? PublicKey => cfg["Push:VapidPublicKey"];
    public bool IsConfigured => !string.IsNullOrWhiteSpace(PublicKey) && !string.IsNullOrWhiteSpace(cfg["Push:VapidPrivateKey"]);

    public async Task<PushResult> SendAsync(PushSubscriptionRow sub, PushPayload payload, CancellationToken ct)
    {
        if (!IsConfigured) return PushResult.Failed;
        var vapid = new VapidDetails(cfg["Push:Subject"] is { Length: > 0 } s ? s : "mailto:hello@headboard.app", PublicKey!, cfg["Push:VapidPrivateKey"]!);
        var subscription = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
        try
        {
            await new WebPushClient().SendNotificationAsync(subscription, JsonSerializer.Serialize(payload, JsonSerializerOptions.Web), vapid, ct);
            return PushResult.Ok;
        }
        catch (WebPushException e) when (e.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
        {
            return PushResult.Gone;
        }
        catch (WebPushException e)
        {
            log.LogWarning(e, "Web push failed ({Status})", e.StatusCode);
            return PushResult.Failed;
        }
    }
}

/// <summary>Expo Push API (<c>exp.host</c>); tokens come from <c>expo-notifications</c> in the mobile app.</summary>
public class ExpoPushSender(IHttpClientFactory http, ILogger<ExpoPushSender> log) : IPushSender
{
    public const string HttpClientName = "expo-push";
    public const string Endpoint = "https://exp.host/--/api/v2/push/send";
    public string Kind => "expo";
    public bool IsConfigured => true;

    public async Task<PushResult> SendAsync(PushSubscriptionRow sub, PushPayload payload, CancellationToken ct)
    {
        try
        {
            using var res = await http.CreateClient(HttpClientName).PostAsJsonAsync(Endpoint, new
            {
                to = sub.Endpoint, title = payload.Title, body = payload.Body, sound = "default", channelId = "default",
                data = new { url = payload.Url, tag = payload.Tag },
            }, ct);
            if (!res.IsSuccessStatusCode) { log.LogWarning("Expo push HTTP {Status}", (int)res.StatusCode); return PushResult.Failed; }
            var json = await res.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            // {"data":{"status":"ok"}} or {"data":{"status":"error","details":{"error":"DeviceNotRegistered"}}}
            if (json.TryGetProperty("data", out var data) && data.TryGetProperty("status", out var st) && st.GetString() != "ok")
            {
                var err = data.TryGetProperty("details", out var d) && d.TryGetProperty("error", out var e) ? e.GetString() : null;
                return err == "DeviceNotRegistered" ? PushResult.Gone : PushResult.Failed;
            }
            return PushResult.Ok;
        }
        catch (HttpRequestException e) { log.LogWarning(e, "Expo push network error"); return PushResult.Failed; }
    }
}
