using System.Net;
using System.Net.Http.Json;
using Headboard.Api.Tasks;

namespace Headboard.Api.Tests;

public class RecurTests
{
    [Fact]
    public async Task Recur_AcceptsDailyWeeklyMonthly_RejectsOthers()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("recur@example.com");
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var create = await c.PostAsJsonAsync("/tasks", new { id = "q1", title = "Water plants", pr = 2, status = "focus", touched = now, created = now, due = now, recur = "monthly", tags = new string[0], note = "", files = new object[0], comments = new object[0] }, ApiFactory.Json);
        create.EnsureSuccessStatusCode();
        Assert.Equal("monthly", (await create.Content.ReadFromJsonAsync<TaskDto>(ApiFactory.Json))!.Recur);
        foreach (var ok in new[] { "daily", "weekly" })
        {
            var res = await c.PatchAsJsonAsync("/tasks/q1", new { recur = ok }, ApiFactory.Json);
            res.EnsureSuccessStatusCode();
            Assert.Equal(ok, (await res.Content.ReadFromJsonAsync<TaskDto>(ApiFactory.Json))!.Recur);
        }
        var bad = await c.PatchAsJsonAsync("/tasks/q1", new { recur = "yearly" }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
        var off = await c.PatchAsJsonAsync("/tasks/q1", new { recur = (string?)null }, ApiFactory.Json);
        Assert.Null((await off.Content.ReadFromJsonAsync<TaskDto>(ApiFactory.Json))!.Recur);
    }
}
