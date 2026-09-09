using System.Net;
using System.Net.Http.Json;
using Headboard.Api.Ai;
using Headboard.Api.Data;
using Headboard.Api.Push;
using Microsoft.Extensions.DependencyInjection;

namespace Headboard.Api.Tests;

internal sealed class FakePushSender : IPushSender
{
    public readonly List<(string Endpoint, PushPayload Payload)> Sent = new();
    public HashSet<string> GoneEndpoints { get; } = new();
    public string Kind => "webpush";
    public bool IsConfigured => true;
    public Task<PushResult> SendAsync(PushSubscriptionRow sub, PushPayload payload, CancellationToken ct)
    {
        if (GoneEndpoints.Contains(sub.Endpoint)) return Task.FromResult(PushResult.Gone);
        Sent.Add((sub.Endpoint, payload));
        return Task.FromResult(PushResult.Ok);
    }
}

public class PushTests
{
    private static readonly object WebSub = new { kind = "webpush", endpoint = "https://push.example/abc", keys = new { p256dh = "p", auth = "a" }, label = "Chrome" };

    [Fact]
    public async Task Config_ReportsChannels_And_SubscribeUnavailableWithoutVapid()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("push0@example.com");
        var cfg = await c.GetFromJsonAsync<PushConfigDto>("/push/config", ApiFactory.Json);
        Assert.False(cfg!.WebPush); Assert.Null(cfg.VapidPublicKey); Assert.True(cfg.Expo);
        var res = await c.PostAsJsonAsync("/push/subscribe", WebSub, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
    }

    [Fact]
    public async Task Subscribe_List_Test_Unsubscribe()
    {
        var fake = new FakePushSender();
        using var f = new ApiFactory { VapidPublicKey = "BPUBLIC", PushSender = fake };
        var (c, _) = await f.LoginAsync("push1@example.com");
        var cfg = await c.GetFromJsonAsync<PushConfigDto>("/push/config", ApiFactory.Json);
        Assert.True(cfg!.WebPush); Assert.Equal("BPUBLIC", cfg.VapidPublicKey);

        (await c.PostAsJsonAsync("/push/subscribe", WebSub, ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c.PostAsJsonAsync("/push/subscribe", WebSub, ApiFactory.Json)).EnsureSuccessStatusCode(); // idempotent
        (await c.PostAsJsonAsync("/push/subscribe", new { kind = "expo", token = "ExponentPushToken[xyz]", label = "iPhone" }, ApiFactory.Json)).EnsureSuccessStatusCode();
        var bad = await c.PostAsJsonAsync("/push/subscribe", new { kind = "webpush", endpoint = "https://x" }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);

        var list = await c.GetFromJsonAsync<List<PushSubscriptionDto>>("/push/subscriptions", ApiFactory.Json);
        Assert.Equal(2, list!.Count);
        Assert.Equal(new[] { "webpush", "expo" }, list.Select(x => x.Kind).ToArray());

        var test = await c.PostAsJsonAsync("/push/test", new { }, ApiFactory.Json);
        test.EnsureSuccessStatusCode();
        Assert.Equal(2, fake.Sent.Count);
        Assert.Equal("test", fake.Sent[0].Payload.Tag);

        var del = await c.SendAsync(new HttpRequestMessage(HttpMethod.Delete, "/push/subscribe") { Content = JsonContent.Create(new { endpoint = "https://push.example/abc" }) });
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);
        var after = await c.GetFromJsonAsync<List<PushSubscriptionDto>>("/push/subscriptions", ApiFactory.Json);
        Assert.Single(after!);
    }

    [Fact]
    public void StaleMessage_Text_EN_RU_And_NothingWhenNoneForgotten()
    {
        var s = new DigestStatsDto(0, "—", 3, "Calendar API beta invite", 15, 0, 0, 0);
        var en = StaleMessage.Build(s, "en")!;
        Assert.Equal("3 forgotten tasks", en.Title);
        Assert.Contains("Calendar API beta invite", en.Body);
        Assert.Contains("15 days", en.Body);
        Assert.Equal("/?view=review", en.Url);
        var ru = StaleMessage.Build(s with { StaleN = 1 }, "ru")!;
        Assert.Equal("1 забытая задача", ru.Title);
        Assert.Null(StaleMessage.Build(s with { StaleN = 0 }, "en"));
    }

    [Fact]
    public async Task Notifier_SendsOncePerDay_OnlyToOptedInUsersWithForgottenTasks_AndDropsGoneDevices()
    {
        var fake = new FakePushSender();
        using var f = new ApiFactory { VapidPublicKey = "BPUBLIC", PushSender = fake };
        var (c, _) = await f.LoginAsync("push2@example.com");
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        (await c.PutAsJsonAsync("/settings", new { lang = "en", theme = "light", showDone = true, digestText = (string?)null, timeZone = "UTC", notifyStale = true }, ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c.PostAsJsonAsync("/push/subscribe", WebSub, ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c.PostAsJsonAsync("/push/subscribe", new { kind = "webpush", endpoint = "https://push.example/gone", keys = new { p256dh = "p", auth = "a" } }, ApiFactory.Json)).EnsureSuccessStatusCode();
        fake.GoneEndpoints.Add("https://push.example/gone");
        (await c.PostAsJsonAsync("/tasks", new { id = "s1", title = "Old loop", pr = 1, status = "inbox", touched = now - 12 * 86_400_000L, created = now, tags = new string[0], note = "", files = new object[0], comments = new object[0] }, ApiFactory.Json)).EnsureSuccessStatusCode();

        // an opted-out user with forgotten tasks gets nothing
        var (c2, _) = await f.LoginAsync("push3@example.com");
        (await c2.PutAsJsonAsync("/settings", new { lang = "ru", theme = "light", showDone = true, digestText = (string?)null, timeZone = "UTC", notifyStale = false }, ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c2.PostAsJsonAsync("/push/subscribe", WebSub, ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c2.PostAsJsonAsync("/tasks", new { id = "s2", title = "Ignored", pr = 1, status = "inbox", touched = now - 20 * 86_400_000L, created = now, tags = new string[0], note = "", files = new object[0], comments = new object[0] }, ApiFactory.Json)).EnsureSuccessStatusCode();

        var notifier = f.Services.GetRequiredService<StaleNotifier>();
        var nineUtc = new DateTimeOffset(DateTimeOffset.UtcNow.Year + 1, 3, 3, 9, 5, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
        var sent = await notifier.RunOnceAsync(9, nineUtc, CancellationToken.None);
        Assert.Equal(1, sent);
        var (endpoint, payload) = Assert.Single(fake.Sent);
        Assert.Equal("https://push.example/abc", endpoint);
        Assert.Equal("1 forgotten task", payload.Title);
        Assert.Contains("Old loop", payload.Body);

        // same day again → nothing; gone device removed
        Assert.Equal(0, await notifier.RunOnceAsync(9, nineUtc + 3_600_000, CancellationToken.None));
        var subs = await c.GetFromJsonAsync<List<PushSubscriptionDto>>("/push/subscriptions", ApiFactory.Json);
        Assert.Single(subs!);
        // next day → again
        Assert.Equal(1, await notifier.RunOnceAsync(9, nineUtc + 86_400_000, CancellationToken.None));
    }
}
