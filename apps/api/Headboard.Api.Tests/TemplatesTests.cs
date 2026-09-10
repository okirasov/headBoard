using System.Net;
using System.Net.Http.Json;
using Headboard.Api.Templates;

namespace Headboard.Api.Tests;

public class TemplatesTests
{
    [Fact]
    public async Task Crud_And_Validation_And_Isolation()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("tpl@example.com");
        var body = new { id = "tp1", name = "Release retro", title = "Retro after {release}", proj = (string?)null, pr = 0, tags = new[] { "ops" }, note = "- what went well", dueInDays = 3, remindDays = 1, usedCount = 0 };
        var create = await c.PostAsJsonAsync("/templates", body, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var dup = await c.PostAsJsonAsync("/templates", body, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.Conflict, dup.StatusCode);
        var badProj = await c.PostAsJsonAsync("/templates", new { id = "tp2", name = "x", proj = "nope", pr = 1 }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.BadRequest, badProj.StatusCode);
        var badRemind = await c.PostAsJsonAsync("/templates", new { id = "tp3", name = "x", pr = 1, remindDays = 5 }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.BadRequest, badRemind.StatusCode);

        var patch = await c.PatchAsJsonAsync("/templates/tp1", new { usedCount = 2, dueInDays = (int?)null }, ApiFactory.Json);
        patch.EnsureSuccessStatusCode();
        var t = await patch.Content.ReadFromJsonAsync<TemplateDto>(ApiFactory.Json);
        Assert.Equal(2, t!.UsedCount);
        Assert.Null(t.DueInDays);
        Assert.Equal("Retro after {release}", t.Title); // untouched fields survive a partial patch
        Assert.Equal(new[] { "ops" }, t.Tags);

        var list = await c.GetFromJsonAsync<List<TemplateDto>>("/templates", ApiFactory.Json);
        Assert.Single(list!);

        var (other, _) = await f.LoginAsync("tpl-other@example.com");
        Assert.Empty((await other.GetFromJsonAsync<List<TemplateDto>>("/templates", ApiFactory.Json))!);
        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync("/templates/tp1")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync("/templates/tp1")).StatusCode);
        Assert.Empty((await c.GetFromJsonAsync<List<TemplateDto>>("/templates", ApiFactory.Json))!);
    }
}
