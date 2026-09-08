using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Headboard.Api.Files;
using Headboard.Api.Projects;
using Headboard.Api.Tasks;

namespace Headboard.Api.Tests;

public class FilesTests(ApiFactory f) : IClassFixture<ApiFactory>
{
    private static readonly JsonSerializerOptions J = ApiFactory.Json;

    // Minimal 1x1 PNG.
    private static readonly byte[] Png = Convert.FromBase64String(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");

    private static MultipartFormDataContent Multipart(byte[] bytes, string name, string contentType)
    {
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { content, "file", name } };
    }

    [Fact]
    public async Task UploadPng_IsImage_AndContentStreamsBack()
    {
        var (c, _) = await f.LoginAsync("files-png@example.com");
        var t = (await (await c.PostAsJsonAsync("/tasks", new TaskDto { Title = "With image" }, J)).Content.ReadFromJsonAsync<TaskDto>(J))!;

        var up = await c.PostAsync($"/files?taskId={t.Id}", Multipart(Png, "dot.png", "image/png"));
        Assert.Equal(HttpStatusCode.Created, up.StatusCode);
        var raw = await up.Content.ReadAsStringAsync();
        var fr = JsonSerializer.Deserialize<FileRefDto>(raw, J)!;
        Assert.Equal("img", fr.Kind);
        Assert.Equal("dot.png", fr.Name);
        Assert.Equal(Png.Length, fr.Size);
        Assert.Equal($"/files/{fr.Id}/content", fr.Src);

        var content = await c.GetAsync(fr.Src!);
        Assert.Equal(HttpStatusCode.OK, content.StatusCode);
        Assert.Equal("image/png", content.Content.Headers.ContentType!.MediaType);
        Assert.Equal(Png, await content.Content.ReadAsByteArrayAsync());

        var task = (await c.GetFromJsonAsync<TaskDto>($"/tasks/{t.Id}", J))!;
        Assert.Single(task.Files);
        Assert.Equal(fr.Id, task.Files[0].Id);

        Assert.Equal(HttpStatusCode.NoContent, (await c.DeleteAsync($"/files/{fr.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await c.GetAsync(fr.Src!)).StatusCode);
    }

    [Fact]
    public async Task UploadText_IsFile_WithoutSrc_AndShowsOnProject()
    {
        var (c, _) = await f.LoginAsync("files-txt@example.com");
        await c.PostAsJsonAsync("/projects", new { id = "pf", name = "Writing", color = "#333" }, J);

        var up = await c.PostAsync("/files?projectId=pf", Multipart("hello"u8.ToArray(), "notes.txt", "text/plain"));
        Assert.Equal(HttpStatusCode.Created, up.StatusCode);
        using var doc = JsonDocument.Parse(await up.Content.ReadAsStringAsync());
        Assert.Equal("file", doc.RootElement.GetProperty("kind").GetString());
        Assert.False(doc.RootElement.TryGetProperty("src", out _)); // optional in TS -> omitted
        var id = doc.RootElement.GetProperty("id").GetString()!;

        var projects = (await c.GetFromJsonAsync<List<ProjectDto>>("/projects", J))!;
        var p = Assert.Single(projects, x => x.Id == "pf");
        Assert.Equal(id, Assert.Single(p.Files).Id);

        var content = await c.GetAsync($"/files/{id}/content");
        Assert.Equal("text/plain", content.Content.Headers.ContentType!.MediaType);
        Assert.Equal("hello", await content.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Files_AreIsolatedPerUser_AndNeedTarget()
    {
        var (a, _) = await f.LoginAsync("files-a@example.com");
        var (b, _) = await f.LoginAsync("files-b@example.com");
        var t = (await (await a.PostAsJsonAsync("/tasks", new TaskDto { Title = "A's" }, J)).Content.ReadFromJsonAsync<TaskDto>(J))!;

        Assert.Equal(HttpStatusCode.NotFound, (await b.PostAsync($"/files?taskId={t.Id}", Multipart(Png, "x.png", "image/png"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await a.PostAsync("/files", Multipart(Png, "x.png", "image/png"))).StatusCode);

        var fr = (await (await a.PostAsync($"/files?taskId={t.Id}", Multipart(Png, "x.png", "image/png"))).Content.ReadFromJsonAsync<FileRefDto>(J))!;
        Assert.Equal(HttpStatusCode.NotFound, (await b.GetAsync(fr.Src!)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await b.DeleteAsync($"/files/{fr.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await f.CreateClient().GetAsync(fr.Src!)).StatusCode);
    }

    [Theory]
    [InlineData("image/png", "a.bin", "img")]
    [InlineData("image/jpeg", "a", "img")]
    [InlineData("application/octet-stream", "photo.HEIC", "img")]
    [InlineData("application/pdf", "doc.pdf", "file")]
    [InlineData("text/plain", "image.png.txt", "file")]
    public void DetectKind_UsesContentTypeThenExtension(string ct, string name, string expected) =>
        Assert.Equal(expected, FileEndpoints.DetectKind(ct, name));
}
