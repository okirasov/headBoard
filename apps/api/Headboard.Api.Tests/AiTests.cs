using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Headboard.Api.Ai;

namespace Headboard.Api.Tests;

public class AiTests
{
    private static readonly JsonSerializerOptions J = ApiFactory.Json;
    private static readonly object ExtractBody = new { text = "fix the tax renewal today", projects = new[] { new { id = "p4", name = "Home Ops" }, new { id = "p1", name = "Research" } } };
    private static readonly object DigestBody = new { stats = new { dueN = 2, dueFirst = "Renew domain", staleN = 3, oldT = "Fix sink", oldI = 12, doneW = 5, focusN = 4, recN = 1 }, lang = "en" };

    private static void AssertItem(CaptureItemDto item, string title, int pr, string[] tags, string? proj)
    {
        Assert.Equal(title, item.Title);
        Assert.Equal(pr, item.Pr);
        Assert.Equal(tags, item.Tags);
        Assert.Equal(proj, item.Proj);
    }

    [Fact]
    public async Task WithoutApiKey_Extract_And_Digest_Are503()
    {
        using var f = new ApiFactory();
        var (c, _) = await f.LoginAsync("ai-nokey@example.com");
        foreach (var (path, body) in new[] { ("/ai/extract", ExtractBody), ("/ai/digest", DigestBody) })
        {
            var res = await c.PostAsJsonAsync(path, body, J);
            Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
            using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
            Assert.Equal("ai_unavailable", doc.RootElement.GetProperty("error").GetString());
        }
    }

    [Fact]
    public async Task Extract_ParsesModelAnswer_ClampsAndMapsProject()
    {
        var fake = FakeAnthropicHandler.ReturningText("[{\"title\":\"Do it\",\"priority\":2,\"tags\":[\"a\",\"b\",\"c\"],\"project\":\"Home Ops\"}]");
        using var f = new ApiFactory { AnthropicApiKey = "sk-test-key", AnthropicHandler = fake };
        var (c, _) = await f.LoginAsync("ai-extract@example.com");

        var res = await c.PostAsJsonAsync("/ai/extract", ExtractBody, J);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var raw = await res.Content.ReadAsStringAsync();
        var items = JsonSerializer.Deserialize<List<CaptureItemDto>>(raw, J)!;
        var item = Assert.Single(items);
        AssertItem(item, "Do it", 2, ["a", "b"], "p4");

        using var doc = JsonDocument.Parse(raw);
        Assert.Equal(["title", "pr", "tags", "proj"], doc.RootElement[0].EnumerateObject().Select(p => p.Name).ToArray());

        // Request shape: endpoint, headers, body, verbatim prompt.
        Assert.Equal(AnthropicClient.Endpoint, fake.LastRequest!.RequestUri!.ToString());
        Assert.Equal("sk-test-key", fake.LastRequest.Headers.GetValues("x-api-key").Single());
        Assert.Equal("2023-06-01", fake.LastRequest.Headers.GetValues("anthropic-version").Single());
        using var sent = JsonDocument.Parse(fake.LastBody!);
        Assert.Equal("claude-sonnet-5", sent.RootElement.GetProperty("model").GetString());
        Assert.Equal(800, sent.RootElement.GetProperty("max_tokens").GetInt32());
        var msg = sent.RootElement.GetProperty("messages")[0];
        Assert.Equal("user", msg.GetProperty("role").GetString());
        Assert.Equal(Prompts.Extract("fix the tax renewal today", ["Home Ops", "Research"]), msg.GetProperty("content").GetString());
    }

    [Fact]
    public async Task Digest_ReturnsText_WithVerbatimPrompt()
    {
        var fake = FakeAnthropicHandler.ReturningText("  Two things are due today. Start with Renew domain.\n");
        using var f = new ApiFactory { AnthropicApiKey = "sk-test-key", AnthropicHandler = fake };
        var (c, _) = await f.LoginAsync("ai-digest@example.com");

        var res = await c.PostAsJsonAsync("/ai/digest", DigestBody, J);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        Assert.Equal("Two things are due today. Start with Renew domain.", doc.RootElement.GetProperty("text").GetString());

        using var sent = JsonDocument.Parse(fake.LastBody!);
        var prompt = sent.RootElement.GetProperty("messages")[0].GetProperty("content").GetString();
        Assert.Equal(
            "You write a terse daily digest for a personal task board. Stats: 2 due today (Renew domain); 3 forgotten tasks, oldest \"Fix sink\" idle 12 days; 5 completed in the last week; 4 in focus. Write 2-3 plain sentences, direct, second person, no emoji, no markdown, no preamble.",
            prompt);
    }

    [Fact]
    public async Task UpstreamFailure_Is502()
    {
        using var f = new ApiFactory { AnthropicApiKey = "sk-test-key", AnthropicHandler = FakeAnthropicHandler.Failing(HttpStatusCode.TooManyRequests) };
        var (c, _) = await f.LoginAsync("ai-fail@example.com");
        var res = await c.PostAsJsonAsync("/ai/extract", ExtractBody, J);
        Assert.Equal(HttpStatusCode.BadGateway, res.StatusCode);
    }

    [Fact]
    public async Task Ai_RequiresAuth()
    {
        using var f = new ApiFactory();
        Assert.Equal(HttpStatusCode.Unauthorized, (await f.CreateClient().PostAsJsonAsync("/ai/extract", ExtractBody, J)).StatusCode);
    }

    [Fact]
    public void ExtractPrompt_MatchesCoreTs()
    {
        var expected = "Extract actionable tasks from the text below. Respond with ONLY a JSON array, no prose. Each item: {\"title\": short imperative string in the same language as the input, \"priority\": 0|1|2 (0=high, 1=medium, 2=low), \"tags\": array of 0-2 lowercase single words, \"project\": one of [\"Home Ops\", \"Research\"] or null}.\n\nTEXT:\nhello";
        Assert.Equal(expected, Prompts.Extract("hello", ["Home Ops", "Research"]));
        Assert.Contains("\"project\": one of [] or null}", Prompts.Extract("x", []));
    }

    [Fact]
    public void DigestPrompt_RussianSuffix()
    {
        var s = new DigestStatsDto(0, "—", 0, "—", 0, 0, 0, 0);
        Assert.EndsWith("no preamble. Answer in Russian.", Prompts.Digest(s, "ru"));
        Assert.EndsWith("no preamble.", Prompts.Digest(s, "en"));
        Assert.EndsWith("no preamble.", Prompts.Digest(s, null));
    }

    [Fact]
    public void ParseExtractResponse_FollowsTsRules()
    {
        List<ExtractProject> projects = [new("p4", "Home Ops")];

        // prose around the array is sliced away; priority is clamped; tags limited to 2; unknown project -> null
        var items = Prompts.ParseExtractResponse(
            "Sure! Here you go:\n[{\"title\":\"A\",\"priority\":7,\"tags\":[\"x\",\"y\",\"z\"],\"project\":\"Nope\"},{\"title\":\"\",\"priority\":1},{\"priority\":\"1\",\"title\":\"B\",\"tags\":\"notarray\",\"project\":\"Home Ops\"}]\nDone.",
            projects);
        Assert.Equal(2, items.Count);
        AssertItem(items[0], "A", 2, ["x", "y"], null);
        AssertItem(items[1], "B", 1, [], "p4");

        // Number(x) || 0 semantics and truncation
        Assert.Equal(0, Prompts.ParseExtractResponse("[{\"title\":\"t\",\"priority\":\"high\"}]", projects)[0].Pr);
        Assert.Equal(1, Prompts.ParseExtractResponse("[{\"title\":\"t\",\"priority\":1.9}]", projects)[0].Pr);
        Assert.Equal(0, Prompts.ParseExtractResponse("[{\"title\":\"t\",\"priority\":-3}]", projects)[0].Pr);
        Assert.Equal(0, Prompts.ParseExtractResponse("[{\"title\":\"t\"}]", projects)[0].Pr);

        // title truncated to 90 chars
        Assert.Equal(90, Prompts.ParseExtractResponse("[{\"title\":\"" + new string('a', 120) + "\"}]", projects)[0].Title.Length);

        // failures -> []
        Assert.Empty(Prompts.ParseExtractResponse("no json here", projects));
        Assert.Empty(Prompts.ParseExtractResponse("[{broken", projects));
        Assert.Empty(Prompts.ParseExtractResponse("{\"title\":\"obj not array\"}", projects));
    }
}
