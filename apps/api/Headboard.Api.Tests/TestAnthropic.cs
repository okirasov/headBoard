using System.Net;
using System.Text;
using Headboard.Api.Ai;
using Microsoft.Extensions.DependencyInjection;

namespace Headboard.Api.Tests;

internal static class TestAnthropic
{
    /// <summary>Swaps the primary handler of the named Anthropic HttpClient so no network call is made.</summary>
    public static void Register(IServiceCollection services, HttpMessageHandler handler)
    {
        services.AddHttpClient(AnthropicClient.HttpClientName).ConfigurePrimaryHttpMessageHandler(() => handler);
    }
}

/// <summary>Fake Anthropic server: records the last request and answers with a Messages API payload.</summary>
internal sealed class FakeAnthropicHandler(Func<string, HttpResponseMessage> respond) : HttpMessageHandler
{
    public HttpRequestMessage? LastRequest { get; private set; }
    public string? LastBody { get; private set; }

    public static FakeAnthropicHandler ReturningText(string text) => new(_ => Ok(text));
    public static FakeAnthropicHandler Failing(HttpStatusCode status) =>
        new(_ => new HttpResponseMessage(status) { Content = new StringContent("{\"type\":\"error\"}", Encoding.UTF8, "application/json") });

    public static HttpResponseMessage Ok(string text)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(new
        {
            id = "msg_test", type = "message", role = "assistant", model = "claude-sonnet-5",
            content = new object[] { new { type = "text", text } },
            stop_reason = "end_turn",
        });
        return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") };
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        LastRequest = request;
        LastBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(ct);
        return respond(LastBody ?? "");
    }
}
