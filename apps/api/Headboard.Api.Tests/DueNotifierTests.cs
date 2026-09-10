using System.Net.Http.Json;
using Headboard.Api.Data;
using Headboard.Api.Push;
using Microsoft.Extensions.DependencyInjection;

namespace Headboard.Api.Tests;

public class DueNotifierTests
{
    private const long Day = 86_400_000;

    [Fact]
    public void Targets_And_Message()
    {
        var tz = TimeZoneInfo.Utc;
        var now = new DateTimeOffset(2026, 9, 9, 12, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
        var rows = new List<TaskRow>
        {
            new() { Id = "a", Title = "Renew domain", Status = "focus", Due = now, RemindDays = 0 },
            new() { Id = "b", Title = "Dentist", Status = "inbox", Due = now + Day, RemindDays = 1 },
            new() { Id = "c", Title = "Skip (tomorrow, on-the-day)", Status = "inbox", Due = now + Day, RemindDays = 0 },
            new() { Id = "d", Title = "Old", Status = "inbox", Due = now - 2 * Day, RemindDays = 0 },
            new() { Id = "e", Title = "No reminder", Status = "inbox", Due = now, RemindDays = null },
            new() { Id = "f", Title = "Done", Status = "done", Due = now, RemindDays = 0 },
        };
        var targets = DueNotifier.Targets(rows, now, tz);
        Assert.Equal(new[] { "d", "a", "b" }, targets.Select(t => t.Id).ToArray());
        var en = DueNotifier.Build(targets, now, tz, "en")!;
        Assert.Equal("Deadlines — 1 overdue · 1 due today · 1 due tomorrow", en.Title);
        Assert.Contains("Old", en.Body);
        Assert.Equal("/?view=due", en.Url);
        var ru = DueNotifier.Build(targets.Take(1).ToList(), now, tz, "ru")!;
        Assert.Equal("Сроки — просрочено: 1", ru.Title);
        Assert.Null(DueNotifier.Build(new(), now, tz, "en"));
    }

    [Fact]
    public async Task RemindDays_RoundTrips_And_NotifierSendsOncePerDay()
    {
        var fake = new FakePushSender();
        using var f = new ApiFactory { VapidPublicKey = "BPUBLIC", PushSender = fake };
        var (c, _) = await f.LoginAsync("due@example.com");
        (await c.PutAsJsonAsync("/settings", new { lang = "en", theme = "light", showDone = true, digestText = (string?)null, timeZone = "UTC", notifyDue = true }, ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c.PostAsJsonAsync("/push/subscribe", new { kind = "webpush", endpoint = "https://push.example/due", keys = new { p256dh = "p", auth = "a" } }, ApiFactory.Json)).EnsureSuccessStatusCode();
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var create = await c.PostAsJsonAsync("/tasks", new { id = "r1", title = "Pay rent", pr = 0, status = "inbox", touched = now, created = now, due = now, remindDays = 0, tags = new string[0], note = "", files = new object[0], comments = new object[0] }, ApiFactory.Json);
        create.EnsureSuccessStatusCode();
        var t = await create.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json);
        Assert.Equal(0, t!.RemindDays);
        var bad = await c.PatchAsJsonAsync("/tasks/r1", new { remindDays = 5 }, ApiFactory.Json);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, bad.StatusCode);
        (await c.PatchAsJsonAsync("/tasks/r1", new { remindDays = 1 }, ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c.PatchAsJsonAsync("/tasks/r1", new { remindDays = 0 }, ApiFactory.Json)).EnsureSuccessStatusCode();

        var notifier = f.Services.GetRequiredService<DueNotifier>();
        var nine = new DateTimeOffset(DateTimeOffset.UtcNow.Year + 1, 4, 4, 9, 5, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
        // the task is overdue by then with a reminder on → included
        Assert.Equal(1, await notifier.RunOnceAsync(9, nine, CancellationToken.None));
        Assert.Equal("due", fake.Sent.Single().Payload.Tag);
        Assert.Contains("Pay rent", fake.Sent.Single().Payload.Body);
        Assert.Equal(0, await notifier.RunOnceAsync(9, nine + 3_600_000, CancellationToken.None));
    }
}
