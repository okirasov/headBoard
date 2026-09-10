using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Headboard.Api.Calendar;
using Headboard.Api.Data;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Headboard.Api.Tests;

/// <summary>In-memory Google: token endpoint + one calendar with events and incremental sync tokens.</summary>
internal sealed class FakeGoogleCalendar : HttpMessageHandler
{
    public readonly Dictionary<string, JsonObject> Events = new();
    public readonly List<string> Log = new();
    public int Version { get; private set; } = 1;
    public string? CalendarId { get; private set; }
    private readonly Dictionary<string, Dictionary<string, JsonObject>> snapshots = new();

    /// <summary>Simulates a user editing the calendar directly.</summary>
    public string UpsertExternal(string? id, string summary, string date, string? taskId = null)
    {
        id ??= "ext" + Guid.NewGuid().ToString("N")[..6];
        var ev = new JsonObject { ["id"] = id, ["status"] = "confirmed", ["summary"] = summary, ["start"] = new JsonObject { ["date"] = date }, ["end"] = new JsonObject { ["date"] = date }, ["updated"] = DateTimeOffset.UtcNow.AddSeconds(5).ToString("o") };
        if (taskId is not null) ev["extendedProperties"] = new JsonObject { ["private"] = new JsonObject { [EventMapper.TaskIdKey] = taskId } };
        Events[id] = ev; Version++;
        return id;
    }
    public void CancelExternal(string id) { Events[id]["status"] = "cancelled"; Events[id]["updated"] = DateTimeOffset.UtcNow.AddSeconds(5).ToString("o"); Version++; }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage req, CancellationToken ct)
    {
        var url = req.RequestUri!.ToString();
        var body = req.Content is null ? "" : await req.Content.ReadAsStringAsync(ct);
        Log.Add(req.Method + " " + req.RequestUri.AbsolutePath);
        if (url.StartsWith("https://oauth2.googleapis.com/token"))
            return Json(new { access_token = "acc-" + Guid.NewGuid().ToString("N")[..6], refresh_token = body.Contains("authorization_code") ? "refresh-1" : null, expires_in = 3600 });
        if (url.StartsWith("https://oauth2.googleapis.com/revoke")) return new HttpResponseMessage(HttpStatusCode.OK);
        if (req.Method == HttpMethod.Post && url.EndsWith("/calendar/v3/calendars"))
        { CalendarId = "cal_headboard"; return Json(new { id = CalendarId, summary = "Headboard" }); }
        var evBase = $"/calendar/v3/calendars/{CalendarId}/events";
        var path = req.RequestUri.AbsolutePath;
        if (req.Method == HttpMethod.Get && path == evBase)
        {
            var q = System.Web.HttpUtility.ParseQueryString(req.RequestUri.Query);
            var sync = q["syncToken"];
            IEnumerable<JsonObject> items = Events.Values;
            if (sync is not null && snapshots.TryGetValue(sync, out var seen))
                items = Events.Values.Where(e => !seen.TryGetValue(e["id"]!.GetValue<string>(), out var prev) || prev.ToJsonString() != e.ToJsonString());
            var token = "sync" + Version;
            snapshots[token] = Events.ToDictionary(kv => kv.Key, kv => (JsonObject)JsonNode.Parse(kv.Value.ToJsonString())!);
            return Json(new JsonObject { ["items"] = new JsonArray(items.Select(e => (JsonNode)JsonNode.Parse(e.ToJsonString())!).ToArray()), ["nextSyncToken"] = token });
        }
        if (req.Method == HttpMethod.Post && path == evBase)
        {
            var ev = (JsonObject)JsonNode.Parse(body)!; var id = "ev" + Guid.NewGuid().ToString("N")[..6];
            ev["id"] = id; ev["status"] = "confirmed"; ev["updated"] = DateTimeOffset.UtcNow.ToString("o");
            Events[id] = ev; Version++;
            return Json(ev);
        }
        if (path.StartsWith(evBase + "/"))
        {
            var id = Uri.UnescapeDataString(path[(evBase.Length + 1)..]);
            if (!Events.TryGetValue(id, out var ev)) return new HttpResponseMessage(HttpStatusCode.NotFound) { Content = new StringContent("{}") };
            if (req.Method == HttpMethod.Delete) { Events.Remove(id); Version++; return new HttpResponseMessage(HttpStatusCode.NoContent); }
            if (req.Method == HttpMethod.Patch)
            {
                foreach (var kv in (JsonObject)JsonNode.Parse(body)!) ev[kv.Key] = kv.Value is null ? null : JsonNode.Parse(kv.Value.ToJsonString());
                ev["updated"] = DateTimeOffset.UtcNow.ToString("o"); Version++;
                return Json(ev);
            }
        }
        return new HttpResponseMessage(HttpStatusCode.NotFound) { Content = new StringContent("{\"error\":\"unhandled " + url + "\"}") };
    }
    private static HttpResponseMessage Json(object o) => new(HttpStatusCode.OK) { Content = new StringContent(o is JsonNode n ? n.ToJsonString() : JsonSerializer.Serialize(o), Encoding.UTF8, "application/json") };
}

public class CalendarTests
{
    private static ApiFactory Factory(FakeGoogleCalendar google) => new()
    {
        GoogleWebClientId = "web-client", GoogleClientSecret = "secret", GoogleCalendarHandler = google,
    };

    private static async Task<HttpClient> ConnectedClientAsync(ApiFactory f, FakeGoogleCalendar google, string email = "cal@example.com")
    {
        var (c, _) = await f.LoginAsync(email);
        var start = await c.PostAsJsonAsync("/calendar/connect", new { returnUrl = "http://localhost:5173/" }, ApiFactory.Json);
        start.EnsureSuccessStatusCode();
        var url = (await start.Content.ReadFromJsonAsync<JsonObject>())!["url"]!.GetValue<string>();
        Assert.Contains("scope=" + Uri.EscapeDataString(GoogleCalendarClient.Scope), url);
        Assert.Contains("access_type=offline", url);
        var state = System.Web.HttpUtility.ParseQueryString(new Uri(url).Query)["state"];
        var cb = f.CreateClient(new() { AllowAutoRedirect = false });
        var res = await cb.GetAsync("/calendar/oauth/callback?code=4/abc&state=" + Uri.EscapeDataString(state!));
        Assert.Equal(HttpStatusCode.Redirect, res.StatusCode);
        Assert.Equal("http://localhost:5173/?calendar=connected", res.Headers.Location!.ToString());
        return c;
    }

    [Fact]
    public async Task Status_NotConnected_And_ConnectUnavailableWithoutSecret()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("nocal@example.com");
        var st = await c.GetFromJsonAsync<CalendarStatusDto>("/calendar", ApiFactory.Json);
        Assert.False(st!.Available); Assert.False(st.Connected);
        var res = await c.PostAsJsonAsync("/calendar/connect", new { returnUrl = "http://localhost:5173/" }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
    }

    [Fact]
    public async Task Connect_RejectsUnknownReturnUrl_And_BadState()
    {
        var google = new FakeGoogleCalendar();
        using var f = Factory(google);
        var (c, _) = await f.LoginAsync("cal2@example.com");
        var bad = await c.PostAsJsonAsync("/calendar/connect", new { returnUrl = "https://evil.example/" }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
        var cb = await f.CreateClient().GetAsync("/calendar/oauth/callback?code=x&state=forged.sig");
        Assert.Equal(HttpStatusCode.BadRequest, cb.StatusCode);
    }

    [Fact]
    public async Task Outbound_TaskWithDue_BecomesAllDayEvent_ThenPatched_ThenDeletedWhenDone()
    {
        var google = new FakeGoogleCalendar();
        using var f = Factory(google);
        var c = await ConnectedClientAsync(f, google);
        var scheduler = f.Services.GetRequiredService<CalendarSyncScheduler>();
        var due = new DateTimeOffset(2026, 9, 15, 12, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
        (await c.PostAsJsonAsync("/tasks", new { id = "c1", title = "Dentist", pr = 1, status = "inbox", touched = 1L, created = 1L, due, tags = new string[0], note = "Bring the card", files = new object[0], comments = new object[0] }, ApiFactory.Json)).EnsureSuccessStatusCode();

        var link = await scheduler.ReconcileAsync(UidOf(f, "cal@example.com"), CancellationToken.None);
        Assert.Null(link!.LastError);
        Assert.Equal("cal_headboard", link.CalendarId);
        var ev = Assert.Single(google.Events.Values);
        Assert.Equal("Dentist", ev["summary"]!.GetValue<string>());
        Assert.Equal("2026-09-15", ev["start"]!["date"]!.GetValue<string>());
        Assert.Equal("2026-09-16", ev["end"]!["date"]!.GetValue<string>());
        Assert.Equal("c1", EventMapper.TaskIdOf(ev));

        // move the date on the task → event patched
        var newDue = due + 2 * 86_400_000L;
        (await c.PatchAsJsonAsync("/tasks/c1", new { due = newDue, touched = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() }, ApiFactory.Json)).EnsureSuccessStatusCode();
        await scheduler.ReconcileAsync(UidOf(f, "cal@example.com"), CancellationToken.None);
        Assert.Equal("2026-09-17", google.Events.Values.Single()["start"]!["date"]!.GetValue<string>());

        // done → event removed
        (await c.PatchAsJsonAsync("/tasks/c1", new { status = "done", doneAt = 5L }, ApiFactory.Json)).EnsureSuccessStatusCode();
        await scheduler.ReconcileAsync(UidOf(f, "cal@example.com"), CancellationToken.None);
        Assert.Empty(google.Events);
    }

    [Fact]
    public async Task Inbound_DateMove_TitleEdit_Cancel_And_ForeignEvent()
    {
        var google = new FakeGoogleCalendar();
        using var f = Factory(google);
        var c = await ConnectedClientAsync(f, google);
        var scheduler = f.Services.GetRequiredService<CalendarSyncScheduler>();
        var uid = UidOf(f, "cal@example.com");
        var due = new DateTimeOffset(2026, 9, 15, 12, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
        (await c.PostAsJsonAsync("/tasks", new { id = "c2", title = "Pay taxes", pr = 0, status = "focus", touched = 1L, created = 1L, due, tags = new string[0], note = "", files = new object[0], comments = new object[0] }, ApiFactory.Json)).EnsureSuccessStatusCode();
        await scheduler.ReconcileAsync(uid, CancellationToken.None);
        var eventId = google.Events.Keys.Single();

        // user drags the event to another day and renames it in Google Calendar
        google.UpsertExternal(eventId, "Pay taxes (accountant)", "2026-09-20", "c2");
        // and creates a brand-new event in the Headboard calendar
        var foreign = google.UpsertExternal(null, "Book flights", "2026-10-01");
        await scheduler.ReconcileAsync(uid, CancellationToken.None);

        var tasks = await c.GetFromJsonAsync<List<TaskDto>>("/tasks", ApiFactory.Json);
        var t = tasks!.Single(x => x.Id == "c2");
        Assert.Equal("Pay taxes (accountant)", t.Title);
        Assert.Equal("2026-09-20", EventMapper.LocalDate(t.Due!.Value, TimeZoneInfo.Utc));
        Assert.Equal(["due", "title"], t.History.Select(h => h.Kind)); // server-side edits are logged with source = calendar
        Assert.All(t.History, h => Assert.Equal("calendar", h.Source));
        Assert.Equal("Pay taxes", t.History[1].From);
        var created = Assert.Single(tasks, x => x.Title == "Book flights");
        Assert.Equal("inbox", created.Status);
        Assert.Equal("created", Assert.Single(created.History).Kind);
        Assert.Equal("2026-10-01", EventMapper.LocalDate(created.Due!.Value, TimeZoneInfo.Utc));
        Assert.Equal(created.Id, EventMapper.TaskIdOf(google.Events[foreign])); // event tagged back

        // deleting the event in Google clears the task's date but keeps the task
        google.CancelExternal(eventId);
        await scheduler.ReconcileAsync(uid, CancellationToken.None);
        var after = (await c.GetFromJsonAsync<List<TaskDto>>("/tasks", ApiFactory.Json))!.Single(x => x.Id == "c2");
        Assert.Null(after.Due);
        Assert.Equal("due", after.History.Last().Kind);
        Assert.Null(after.History.Last().To);
    }

    [Fact]
    public async Task DeletingTask_RemovesEvent_And_DisconnectKeepsCalendar()
    {
        var google = new FakeGoogleCalendar();
        using var f = Factory(google);
        var c = await ConnectedClientAsync(f, google);
        var scheduler = f.Services.GetRequiredService<CalendarSyncScheduler>();
        var uid = UidOf(f, "cal@example.com");
        var due = new DateTimeOffset(2026, 9, 15, 12, 0, 0, TimeSpan.Zero).ToUnixTimeMilliseconds();
        (await c.PostAsJsonAsync("/tasks", new { id = "c3", title = "Gone", pr = 1, status = "inbox", touched = 1L, created = 1L, due, tags = new string[0], note = "", files = new object[0], comments = new object[0] }, ApiFactory.Json)).EnsureSuccessStatusCode();
        await scheduler.ReconcileAsync(uid, CancellationToken.None);
        Assert.Single(google.Events);
        (await c.DeleteAsync("/tasks/c3")).EnsureSuccessStatusCode();
        await scheduler.ReconcileAsync(uid, CancellationToken.None);
        Assert.Empty(google.Events);

        var st = await c.GetFromJsonAsync<CalendarStatusDto>("/calendar", ApiFactory.Json);
        Assert.True(st!.Connected); Assert.NotNull(st.LastSyncAt);
        (await c.DeleteAsync("/calendar")).EnsureSuccessStatusCode();
        var st2 = await c.GetFromJsonAsync<CalendarStatusDto>("/calendar", ApiFactory.Json);
        Assert.False(st2!.Connected);
        Assert.Contains("POST /revoke", google.Log);
    }

    private static Guid UidOf(ApiFactory f, string email)
    {
        using var scope = f.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<AppDb>().Users.Single(u => u.Email == email).Id;
    }
}
