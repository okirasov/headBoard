using System.Net.Http.Json;
using Headboard.Api.Data;
using Headboard.Api.Digest;
using Headboard.Api.Settings;
using Microsoft.Extensions.DependencyInjection;

namespace Headboard.Api.Tests;

public class DigestScheduleTests
{
    private static long Ms(int y, int mo, int d, int h, int mi, string tz) =>
        new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(new DateTime(y, mo, d, h, mi, 0, DateTimeKind.Unspecified), TimeZoneInfo.FindSystemTimeZoneById(tz))).ToUnixTimeMilliseconds();

    [Fact]
    public void NotDue_BeforeEightLocal()
    {
        Assert.False(DigestSchedule.IsDue(Ms(2026, 9, 9, 7, 59, "Europe/Belgrade"), "Europe/Belgrade", null));
    }

    [Fact]
    public void Due_AtEight_WhenNeverGenerated_AndAgainNextDay()
    {
        var eight = Ms(2026, 9, 9, 8, 0, "Europe/Belgrade");
        Assert.True(DigestSchedule.IsDue(eight, "Europe/Belgrade", null));
        var generated = eight;
        Assert.False(DigestSchedule.IsDue(Ms(2026, 9, 9, 18, 0, "Europe/Belgrade"), "Europe/Belgrade", generated));
        Assert.True(DigestSchedule.IsDue(Ms(2026, 9, 10, 8, 1, "Europe/Belgrade"), "Europe/Belgrade", generated));
    }

    [Fact]
    public void ClientRegenerationEarlierToday_CountsAsProduced()
    {
        var sixAm = Ms(2026, 9, 9, 6, 0, "Asia/Tokyo");
        Assert.False(DigestSchedule.IsDue(Ms(2026, 9, 9, 9, 0, "Asia/Tokyo"), "Asia/Tokyo", sixAm));
    }

    [Fact]
    public void UnknownZone_FallsBackToUtc()
    {
        Assert.True(DigestSchedule.IsDue(Ms(2026, 9, 9, 8, 0, "UTC"), "Mars/Olympus", null));
        Assert.False(DigestSchedule.IsValidTimeZone("Mars/Olympus"));
        Assert.True(DigestSchedule.IsValidTimeZone("America/New_York"));
    }

    [Fact]
    public async Task Generate_StoresCannedDigest_And_SchedulerRunsOncePerDay()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("digest@example.com");
        var put = await c.PutAsJsonAsync("/settings", new { lang = "ru", theme = "light", showDone = true, digestText = (string?)null, timeZone = "Europe/Belgrade" }, ApiFactory.Json);
        put.EnsureSuccessStatusCode();
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        foreach (var (id, title, status, due) in new[] { ("d1", "Renew domain", "focus", (long?)now), ("d2", "Old loop", "inbox", null) })
        {
            var res = await c.PostAsJsonAsync("/tasks", new { id, title, pr = 1, status, touched = id == "d2" ? now - 12 * 86_400_000L : now, created = now, due, tags = new string[0], note = "", files = new object[0], comments = new object[0] }, ApiFactory.Json);
            res.EnsureSuccessStatusCode();
        }

        var eight = Ms(2026, 9, 9, 8, 5, "Europe/Belgrade");
        var scheduler = f.Services.GetRequiredService<DigestScheduler>();
        Assert.Equal(1, await scheduler.RunOnceAsync(8, eight, CancellationToken.None));
        Assert.Equal(0, await scheduler.RunOnceAsync(8, eight + 3_600_000, CancellationToken.None));

        var s = await c.GetFromJsonAsync<SettingsDto>("/settings", ApiFactory.Json);
        Assert.NotNull(s!.DigestText);
        // Canned variant is picked by local day number; all three RU variants start with one of these.
        Assert.True(new[] { "На сегодня", "В фокусе", "Спокойный день" }.Any(p => s.DigestText!.StartsWith(p)), s.DigestText);
        Assert.Equal(eight, s.DigestAt);
        Assert.Equal("Europe/Belgrade", s.TimeZone);

        // A client PUT with digestText null (it never had one) must not erase the scheduled digest.
        var keep = await c.PutAsJsonAsync("/settings", new { lang = "ru", theme = "dark", showDone = true, digestText = (string?)null, timeZone = "Europe/Belgrade" }, ApiFactory.Json);
        keep.EnsureSuccessStatusCode();
        var after = await c.GetFromJsonAsync<SettingsDto>("/settings", ApiFactory.Json);
        Assert.Equal(s.DigestText, after!.DigestText);
        Assert.Equal(eight, after.DigestAt);
        Assert.Equal("dark", after.Theme);
    }

    [Fact]
    public void ComputeStats_MirrorsCoreRules()
    {
        var tz = TimeZoneInfo.Utc;
        var now = Ms(2026, 9, 9, 12, 0, "UTC");
        const long day = 86_400_000;
        var rows = new List<TaskRow>
        {
            new() { Id = "a", Title = "Due now", Status = "focus", Due = now, Touched = now },
            new() { Id = "b", Title = "Overdue", Status = "inbox", Due = now - day, Touched = now },
            new() { Id = "c", Title = "Old", Status = "inbox", Touched = now - 15 * day },
            new() { Id = "d", Title = "Older", Status = "waiting", Touched = now - 20 * day },
            new() { Id = "e", Title = "Done", Status = "done", DoneAt = now - day, Touched = now },
            new() { Id = "f", Title = "Done long ago", Status = "done", DoneAt = now - 10 * day, Touched = now },
            new() { Id = "g", Title = "Weekly", Status = "inbox", Recur = "weekly", Touched = now },
            new() { Id = "h", Title = "Archived", Status = "archived", Touched = now - 30 * day },
        };
        var s = DigestService.ComputeStats(rows, now, tz);
        Assert.Equal(2, s.DueN);
        Assert.Equal("Due now", s.DueFirst);
        Assert.Equal(2, s.StaleN);
        Assert.Equal("Older", s.OldT);
        Assert.Equal(20, s.OldI);
        Assert.Equal(1, s.DoneW);
        Assert.Equal(1, s.FocusN);
        Assert.Equal(1, s.RecN);
        Assert.Equal("2 due today · 2 forgotten", $"{s.DueN} due today · {s.StaleN} forgotten");
    }
}
