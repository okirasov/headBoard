using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Headboard.Api.Projects;
using Headboard.Api.Tasks;

namespace Headboard.Api.Tests;

public class TasksTests(ApiFactory f) : IClassFixture<ApiFactory>
{
    private static readonly JsonSerializerOptions J = ApiFactory.Json;

    [Fact]
    public async Task Crud_Flow_CreateListPatchCommentDelete()
    {
        var (c, _) = await f.LoginAsync("tasks-crud@example.com");

        // create (server assigns id when empty)
        var create = await c.PostAsJsonAsync("/tasks", new TaskDto { Title = "Write the API", Pr = 0, Tags = ["api", "dotnet"] }, J);
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var t = (await create.Content.ReadFromJsonAsync<TaskDto>(J))!;
        Assert.StartsWith("n", t.Id);
        Assert.Equal("Write the API", t.Title);
        Assert.Equal(0, t.Pr);
        Assert.Equal("inbox", t.Status);
        Assert.True(t.Created > 0 && t.Touched > 0);
        Assert.Null(t.Due);
        Assert.Null(t.DoneAt);
        Assert.Equal(["api", "dotnet"], t.Tags);

        // list
        var list = (await c.GetFromJsonAsync<List<TaskDto>>("/tasks", J))!;
        Assert.Contains(list, x => x.Id == t.Id);

        // patch status -> done with doneAt from body
        var doneAt = 1_800_000_000_000L;
        var patch = await c.PatchAsJsonAsync($"/tasks/{t.Id}", new { status = "done", doneAt, touched = doneAt }, J);
        Assert.Equal(HttpStatusCode.OK, patch.StatusCode);
        var patched = (await patch.Content.ReadFromJsonAsync<TaskDto>(J))!;
        Assert.Equal("done", patched.Status);
        Assert.Equal(doneAt, patched.DoneAt);
        Assert.Equal(doneAt, patched.Touched);
        Assert.Equal("Write the API", patched.Title); // untouched field preserved

        // comment
        var cm = await c.PostAsJsonAsync($"/tasks/{t.Id}/comments", new { text = "first!" }, J);
        Assert.Equal(HttpStatusCode.Created, cm.StatusCode);
        var comment = (await cm.Content.ReadFromJsonAsync<CommentDto>(J))!;
        Assert.Equal("first!", comment.Text);
        var withComment = (await c.GetFromJsonAsync<TaskDto>($"/tasks/{t.Id}", J))!;
        Assert.Single(withComment.Comments);
        Assert.Equal(comment.Id, withComment.Comments[0].Id);

        // delete comment then task
        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/tasks/{t.Id}/comments/{comment.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/tasks/{t.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await c.GetAsync($"/tasks/{t.Id}")).StatusCode);
    }

    [Fact]
    public async Task Tasks_AreIsolatedPerUser()
    {
        var (a, _) = await f.LoginAsync("iso-a@example.com", "User A");
        var (b, _) = await f.LoginAsync("iso-b@example.com", "User B");

        var created = await (await a.PostAsJsonAsync("/tasks", new TaskDto { Id = "n-iso-1", Title = "Only A sees this" }, J)).Content.ReadFromJsonAsync<TaskDto>(J);
        Assert.Equal("n-iso-1", created!.Id);

        var bList = (await b.GetFromJsonAsync<List<TaskDto>>("/tasks", J))!;
        Assert.DoesNotContain(bList, x => x.Id == "n-iso-1");
        Assert.Equal(HttpStatusCode.NotFound, (await b.GetAsync("/tasks/n-iso-1")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.PatchAsJsonAsync("/tasks/n-iso-1", new { title = "hijack" }, J)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.DeleteAsync("/tasks/n-iso-1")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.PostAsJsonAsync("/tasks/n-iso-1/comments", new { text = "x" }, J)).StatusCode);

        var aTask = (await a.GetFromJsonAsync<TaskDto>("/tasks/n-iso-1", J))!;
        Assert.Equal("Only A sees this", aTask.Title);
    }

    [Fact]
    public async Task Tasks_RequireAuth()
    {
        var res = await f.CreateClient().GetAsync("/tasks");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task WireShape_MatchesCoreModel()
    {
        var (c, _) = await f.LoginAsync("shape@example.com");
        var res = await c.PostAsJsonAsync("/tasks", new TaskDto { Title = "Shape" }, J);
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        var names = doc.RootElement.EnumerateObject().Select(p => p.Name).ToArray();
        string[] expected = ["id", "title", "proj", "pr", "status", "touched", "created", "due", "snoozedUntil", "recur", "tags", "note", "chat", "files", "comments", "doneAt", "archivedAt", "remindDays", "history", "seriesId"];
        Assert.Equal(expected, names);
        foreach (var nullable in new[] { "proj", "due", "recur", "chat", "doneAt" })
            Assert.Equal(JsonValueKind.Null, doc.RootElement.GetProperty(nullable).ValueKind);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.GetProperty("tags").ValueKind);
        Assert.Equal(0, doc.RootElement.GetProperty("snoozedUntil").GetInt64());
        Assert.Equal("", doc.RootElement.GetProperty("note").GetString());
    }

    [Fact]
    public async Task Patch_NullClearsField_AbsentKeepsIt()
    {
        var (c, _) = await f.LoginAsync("patch@example.com");
        var t = (await (await c.PostAsJsonAsync("/tasks", new TaskDto { Title = "P", Due = 123, Recur = "weekly", Note = "keep" }, J)).Content.ReadFromJsonAsync<TaskDto>(J))!;
        var patched = (await (await c.PatchAsJsonAsync($"/tasks/{t.Id}", new { due = (long?)null, recur = (string?)null }, J)).Content.ReadFromJsonAsync<TaskDto>(J))!;
        Assert.Null(patched.Due);
        Assert.Null(patched.Recur);
        Assert.Equal("keep", patched.Note);
    }

    [Fact]
    public async Task IncludeArchived_FlagControlsListing()
    {
        var (c, _) = await f.LoginAsync("archive@example.com");
        var t = (await (await c.PostAsJsonAsync("/tasks", new TaskDto { Title = "Old", Status = "archived" }, J)).Content.ReadFromJsonAsync<TaskDto>(J))!;
        Assert.DoesNotContain((await c.GetFromJsonAsync<List<TaskDto>>("/tasks", J))!, x => x.Id == t.Id);
        Assert.Contains((await c.GetFromJsonAsync<List<TaskDto>>("/tasks?includeArchived=true", J))!, x => x.Id == t.Id);
    }

    [Theory]
    [InlineData("{\"title\":\"\"}", "title_required")]
    [InlineData("{\"title\":\"x\",\"pr\":5}", "invalid_pr")]
    [InlineData("{\"title\":\"x\",\"status\":\"later\"}", "invalid_status")]
    [InlineData("{\"title\":\"x\",\"recur\":\"yearly\"}", "invalid_recur")]
    [InlineData("{\"title\":\"x\",\"proj\":\"nope\"}", "invalid_proj")]
    public async Task Create_ValidatesBody(string json, string error)
    {
        var (c, _) = await f.LoginAsync("validate@example.com");
        var res = await c.PostAsync("/tasks", new StringContent(json, System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        Assert.Equal(error, doc.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task Projects_CrudAndTaskLink()
    {
        var (c, _) = await f.LoginAsync("projects@example.com");
        var (other, _) = await f.LoginAsync("projects-other@example.com");

        var create = await c.PostAsJsonAsync("/projects", new { id = "p4", name = "Home Ops", color = "#9A7B2D" }, J);
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var p = (await create.Content.ReadFromJsonAsync<ProjectDto>(J))!;
        Assert.Equal("p4", p.Id);
        Assert.Empty(p.Files);

        var t = (await (await c.PostAsJsonAsync("/tasks", new TaskDto { Title = "Renew domain", Proj = "p4" }, J)).Content.ReadFromJsonAsync<TaskDto>(J))!;
        Assert.Equal("p4", t.Proj);

        var patched = (await (await c.PatchAsJsonAsync("/projects/p4", new { color = "#000000" }, J)).Content.ReadFromJsonAsync<ProjectDto>(J))!;
        Assert.Equal("#000000", patched.Color);
        Assert.Equal("Home Ops", patched.Name);

        Assert.Empty((await other.GetFromJsonAsync<List<ProjectDto>>("/projects", J))!);
        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync("/projects/p4")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync("/projects/p4")).StatusCode);
        var after = (await c.GetFromJsonAsync<TaskDto>($"/tasks/{t.Id}", J))!;
        Assert.Null(after.Proj); // task survives, unlinked
    }

    [Fact]
    public async Task Settings_DefaultsThenPut()
    {
        var (c, _) = await f.LoginAsync("settings@example.com");
        var defaults = (await c.GetFromJsonAsync<Headboard.Api.Settings.SettingsDto>("/settings", J))!;
        Assert.Equal(new Headboard.Api.Settings.SettingsDto("en", "light", true, null, null, null, true, true), defaults);

        var put = await c.PutAsJsonAsync("/settings", new { lang = "ru", theme = "dark", showDone = false, digestText = "Спокойный день" }, J);
        Assert.Equal(HttpStatusCode.OK, put.StatusCode);
        var got = (await c.GetFromJsonAsync<Headboard.Api.Settings.SettingsDto>("/settings", J))!;
        Assert.Equal(("ru", "dark", false, "Спокойный день"), (got.Lang, got.Theme, got.ShowDone, got.DigestText));
        Assert.NotNull(got.DigestAt); // digest text changed → server stamps the time

        var bad = await c.PutAsJsonAsync("/settings", new { lang = "de", theme = "dark", showDone = true }, J);
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
    }
}

public class TagOpTests
{
    [Fact]
    public async Task RenameMergesAcrossAllTasks_RemoveStrips_AndUsersAreIsolated()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("tags@example.com");
        var (other, _) = await f.LoginAsync("other-tags@example.com");
        object Body(string id, string status, params string[] tags) => new { id, title = id, pr = 1, status, touched = 1L, created = 1L, tags, note = "", files = new object[0], comments = new object[0] };
        (await c.PostAsJsonAsync("/tasks", Body("tg1", "inbox", "ux", "infra"), ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c.PostAsJsonAsync("/tasks", Body("tg2", "archived", "ux"), ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c.PostAsJsonAsync("/tasks", Body("tg3", "done", "design", "ux"), ApiFactory.Json)).EnsureSuccessStatusCode();
        (await c.PostAsJsonAsync("/tasks", Body("tg4", "inbox", "uxr"), ApiFactory.Json)).EnsureSuccessStatusCode();
        (await other.PostAsJsonAsync("/tasks", Body("tg9", "inbox", "ux"), ApiFactory.Json)).EnsureSuccessStatusCode();

        var r = await c.PostAsJsonAsync("/tags/rename", new { from = "#UX", to = "Design" }, ApiFactory.Json);
        r.EnsureSuccessStatusCode();
        var res = await r.Content.ReadFromJsonAsync<Headboard.Api.Tags.TagOpResult>(ApiFactory.Json);
        Assert.Equal(3, res!.Changed);
        Assert.Equal(["tg1", "tg2", "tg3"], res.Tasks.Select(t => t.Id).OrderBy(x => x));
        Assert.Equal(["design", "infra"], res.Tasks.Single(t => t.Id == "tg1").Tags);
        Assert.Equal(["design"], res.Tasks.Single(t => t.Id == "tg3").Tags); // merged, no duplicate
        Assert.Equal("tags", res.Tasks.Single(t => t.Id == "tg1").History.Last().Kind);
        Assert.Equal("api", res.Tasks.Single(t => t.Id == "tg1").History.Last().Source);
        Assert.Equal(["uxr"], (await c.GetFromJsonAsync<Headboard.Api.Tasks.TaskDto>("/tasks/tg4", ApiFactory.Json))!.Tags); // substring untouched
        Assert.Equal(["ux"], (await other.GetFromJsonAsync<Headboard.Api.Tasks.TaskDto>("/tasks/tg9", ApiFactory.Json))!.Tags); // other user untouched

        var rm = await c.PostAsJsonAsync("/tags/remove", new { tag = "design" }, ApiFactory.Json);
        var rmRes = await rm.Content.ReadFromJsonAsync<Headboard.Api.Tags.TagOpResult>(ApiFactory.Json);
        Assert.Equal(3, rmRes!.Changed);
        Assert.Empty(rmRes.Tasks.Single(t => t.Id == "tg3").Tags);

        Assert.Equal(HttpStatusCode.BadRequest, (await c.PostAsJsonAsync("/tags/rename", new { from = "", to = "x" }, ApiFactory.Json)).StatusCode);
        var noop = await (await c.PostAsJsonAsync("/tags/rename", new { from = "a", to = "A" }, ApiFactory.Json)).Content.ReadFromJsonAsync<Headboard.Api.Tags.TagOpResult>(ApiFactory.Json);
        Assert.Equal(0, noop!.Changed);
    }
}

public class SeriesTests
{
    [Fact]
    public async Task SeriesId_RoundTrips_AndCanBeCleared()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("series@example.com");
        var create = await c.PostAsJsonAsync("/tasks", new { id = "sr1", title = "Standup", pr = 1, status = "inbox", touched = 1L, created = 1L, recur = "daily", tags = new string[0], note = "", files = new object[0], comments = new object[0], seriesId = "sr1" }, ApiFactory.Json);
        create.EnsureSuccessStatusCode();
        var t = await create.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json);
        Assert.Equal("sr1", t!.SeriesId);
        var next = await c.PostAsJsonAsync("/tasks", new { id = "sr2", title = "Standup", pr = 1, status = "inbox", touched = 2L, created = 2L, recur = "daily", tags = new string[0], note = "", files = new object[0], comments = new object[0], seriesId = "sr1" }, ApiFactory.Json);
        next.EnsureSuccessStatusCode();
        var list = await c.GetFromJsonAsync<List<Headboard.Api.Tasks.TaskDto>>("/tasks", ApiFactory.Json);
        Assert.Equal(2, list!.Count(x => x.SeriesId == "sr1"));
        var clear = await c.PatchAsJsonAsync("/tasks/sr2", new { seriesId = (string?)null }, ApiFactory.Json);
        clear.EnsureSuccessStatusCode();
        Assert.Null((await clear.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json))!.SeriesId);
    }
}

public class HistoryTests
{
    [Fact]
    public async Task History_RoundTrips_AndRejectsUnknownKinds()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("history@example.com");
        var created = new { id = "h1", at = 1_700_000_000_000L, kind = "created" };
        var create = await c.PostAsJsonAsync("/tasks", new { id = "hs1", title = "Track me", pr = 1, status = "inbox", touched = 1L, created = 1L, tags = new string[0], note = "", files = new object[0], comments = new object[0], history = new[] { created } }, ApiFactory.Json);
        create.EnsureSuccessStatusCode();
        var t = await create.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json);
        Assert.Single(t!.History);
        Assert.Equal("created", t.History[0].Kind);

        var patch = await c.PatchAsJsonAsync("/tasks/hs1", new { pr = 0, history = new object[] { created, new { id = "h2", at = 1_700_000_001_000L, kind = "priority", from = "1", to = "0" } } }, ApiFactory.Json);
        patch.EnsureSuccessStatusCode();
        var p = await patch.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json);
        Assert.Equal(["created", "priority"], p!.History.Select(h => h.Kind));
        Assert.Equal("0", p.History[1].To);

        var list = await c.GetFromJsonAsync<List<Headboard.Api.Tasks.TaskDto>>("/tasks", ApiFactory.Json);
        Assert.Equal(2, list!.Single(x => x.Id == "hs1").History.Count);

        var bad = await c.PatchAsJsonAsync("/tasks/hs1", new { history = new[] { new { id = "h3", at = 1L, kind = "teleported" } } }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
    }

    [Fact]
    public async Task BareApiEdits_AreLoggedServerSide_ButClientLogsAreTrusted()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("apihist@example.com");
        (await c.PostAsJsonAsync("/tasks", new { id = "ah1", title = "Plain", pr = 1, status = "inbox", touched = 1L, created = 1L, tags = new string[0], note = "", files = new object[0], comments = new object[0] }, ApiFactory.Json)).EnsureSuccessStatusCode();

        // curl-style patch without a history field → the server diffs
        var p1 = await c.PatchAsJsonAsync("/tasks/ah1", new { status = "focus", pr = 0, title = "Plain v2", touched = 5L }, ApiFactory.Json);
        p1.EnsureSuccessStatusCode();
        var t1 = await p1.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json);
        Assert.Equal(["status", "priority", "title"], t1!.History.Select(h => h.Kind));
        Assert.All(t1.History, h => Assert.Equal("api", h.Source));
        Assert.Equal("Plain", t1.History[2].From);

        // only touched moved → bumped
        var p2 = await c.PatchAsJsonAsync("/tasks/ah1", new { touched = 9L }, ApiFactory.Json);
        Assert.Equal("bumped", (await p2.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json))!.History.Last().Kind);

        // comment endpoints log too
        (await c.PostAsJsonAsync("/tasks/ah1/comments", new { text = "hi there" }, ApiFactory.Json)).EnsureSuccessStatusCode();
        var t3 = await c.GetFromJsonAsync<Headboard.Api.Tasks.TaskDto>("/tasks/ah1", ApiFactory.Json);
        Assert.Equal("comment", t3!.History.Last().Kind);
        Assert.Equal("hi there", t3.History.Last().To);
        (await c.DeleteAsync($"/tasks/ah1/comments/{t3.Comments.Single().Id}")).EnsureSuccessStatusCode();
        Assert.Equal("comment_removed", (await c.GetFromJsonAsync<Headboard.Api.Tasks.TaskDto>("/tasks/ah1", ApiFactory.Json))!.History.Last().Kind);

        // a client patch carrying its own log is stored as-is, no extra server entries
        var own = new object[] { new { id = "h1", at = 1L, kind = "created" } };
        var p4 = await c.PatchAsJsonAsync("/tasks/ah1", new { pr = 2, history = own }, ApiFactory.Json);
        var t4 = await p4.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json);
        Assert.Equal(["created"], t4!.History.Select(h => h.Kind));
    }

    [Fact]
    public void HistoryJson_KeepsOnlyTheNewest200()
    {
        var many = Enumerable.Range(0, 250).Select(i => new Headboard.Api.Tasks.HistoryEntryDto { Id = "h" + i, At = i + 1, Kind = "bumped" });
        var kept = Headboard.Api.Tasks.TaskMapper.ParseHistory(Headboard.Api.Tasks.TaskMapper.HistoryJson(many));
        Assert.Equal(200, kept.Count);
        Assert.Equal("h50", kept[0].Id);
    }
}

public class ArchiveTests
{
    [Fact]
    public async Task ArchivedAt_RoundTrips_ThroughCreatePatchAndList()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("archive@example.com");
        var create = await c.PostAsJsonAsync("/tasks", new { id = "ar1", title = "Old idea", pr = 1, status = "inbox", touched = 1L, created = 1L, tags = new string[0], note = "", files = new object[0], comments = new object[0] }, ApiFactory.Json);
        create.EnsureSuccessStatusCode();

        var patch = await c.PatchAsJsonAsync("/tasks/ar1", new { status = "archived", archivedAt = 1_700_000_000_000L }, ApiFactory.Json);
        patch.EnsureSuccessStatusCode();
        var t = await patch.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json);
        Assert.Equal("archived", t!.Status);
        Assert.Equal(1_700_000_000_000L, t.ArchivedAt);

        var live = await c.GetFromJsonAsync<List<Headboard.Api.Tasks.TaskDto>>("/tasks", ApiFactory.Json);
        Assert.DoesNotContain(live!, x => x.Id == "ar1");
        var all = await c.GetFromJsonAsync<List<Headboard.Api.Tasks.TaskDto>>("/tasks?includeArchived=true", ApiFactory.Json);
        Assert.Contains(all!, x => x.Id == "ar1" && x.ArchivedAt == 1_700_000_000_000L);

        var restore = await c.PatchAsJsonAsync("/tasks/ar1", new { status = "inbox", archivedAt = (long?)null }, ApiFactory.Json);
        restore.EnsureSuccessStatusCode();
        var r = await restore.Content.ReadFromJsonAsync<Headboard.Api.Tasks.TaskDto>(ApiFactory.Json);
        Assert.Null(r!.ArchivedAt);
    }
}
