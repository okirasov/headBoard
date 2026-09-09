using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Headboard.Api.Auth;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Headboard.Api.Tests;

/// <summary>Boots the API against a fresh SQLite file and storage directory per factory instance.</summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public string Root { get; } = Path.Combine(Path.GetTempPath(), "headboard-api-tests", Guid.NewGuid().ToString("N"));

    /// <summary>When set, the Anthropic HttpClient uses this handler instead of the network.</summary>
    public HttpMessageHandler? AnthropicHandler { get; init; }
    public string AnthropicApiKey { get; init; } = "";
    /// <summary>When set, the Google OAuth HttpClient (code exchange) uses this handler instead of the network.</summary>
    public HttpMessageHandler? GoogleHandler { get; init; }
    /// <summary>When set, the Google Calendar HttpClient uses this handler (fake OAuth + Calendar v3).</summary>
    public HttpMessageHandler? GoogleCalendarHandler { get; init; }
    public string VapidPublicKey { get; init; } = "";
    /// <summary>When set, replaces both push senders with this fake (records payloads, never touches the network).</summary>
    public Headboard.Api.Push.IPushSender? PushSender { get; init; }
    public string GoogleWebClientId { get; init; } = "";
    public string GoogleClientSecret { get; init; } = "";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(Root);
        builder.UseEnvironment("Development");
        builder.ConfigureAppConfiguration(cfg => cfg.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Sqlite"] = $"Data Source={Path.Combine(Root, "test.db")}",
            ["ConnectionStrings:Postgres"] = "",
            ["Storage:Root"] = Path.Combine(Root, "storage"),
            ["Jwt:Secret"] = "headboard-test-secret-0123456789-0123456789-abcdef",
            ["Jwt:Issuer"] = "headboard-tests",
            ["Auth:AllowDevLogin"] = "true",
            ["Anthropic:ApiKey"] = AnthropicApiKey,
            ["Auth:GoogleWebClientId"] = GoogleWebClientId,
            ["Auth:GoogleClientSecret"] = GoogleClientSecret,
            ["Digest:Enabled"] = "false",
            ["Calendar:Enabled"] = "false",
            ["Notify:Enabled"] = "false",
            ["Push:VapidPublicKey"] = VapidPublicKey,
            ["Push:VapidPrivateKey"] = VapidPublicKey.Length > 0 ? "test-private" : "",
        }));
        if (AnthropicHandler is not null)
            builder.ConfigureTestServices(s => TestAnthropic.Register(s, AnthropicHandler));
        if (PushSender is not null)
            builder.ConfigureTestServices(s =>
            {
                s.RemoveAll<Headboard.Api.Push.IPushSender>();
                s.AddSingleton(PushSender);
                s.AddSingleton<Headboard.Api.Push.IPushSender>(new KindAlias(PushSender, "expo"));
            });
        if (GoogleCalendarHandler is not null)
            builder.ConfigureTestServices(s => s.AddHttpClient(Headboard.Api.Calendar.GoogleCalendarClient.HttpClientName).ConfigurePrimaryHttpMessageHandler(() => GoogleCalendarHandler));
        if (GoogleHandler is not null)
            builder.ConfigureTestServices(s => s.AddHttpClient(GoogleVerifier.HttpClientName).ConfigurePrimaryHttpMessageHandler(() => GoogleHandler));
    }

    /// <summary>Dev-logs in and returns an HttpClient carrying the bearer token.</summary>
    public async Task<(HttpClient Client, AuthResponse Auth)> LoginAsync(string email, string name = "Test User", string provider = "Google")
    {
        var client = CreateClient();
        var res = await client.PostAsJsonAsync("/auth/dev", new DevLoginRequest(email, name, provider), Json);
        res.EnsureSuccessStatusCode();
        var auth = (await res.Content.ReadFromJsonAsync<AuthResponse>(Json))!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return (client, auth);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        try { Directory.Delete(Root, recursive: true); } catch { /* best effort */ }
    }
}

/// <summary>Presents a fake sender under another kind so one fake serves both "webpush" and "expo".</summary>
internal sealed class KindAlias(Headboard.Api.Push.IPushSender inner, string kind) : Headboard.Api.Push.IPushSender
{
    public string Kind => kind;
    public bool IsConfigured => inner.IsConfigured;
    public Task<Headboard.Api.Push.PushResult> SendAsync(Headboard.Api.Data.PushSubscriptionRow sub, Headboard.Api.Push.PushPayload payload, CancellationToken ct) => inner.SendAsync(sub, payload, ct);
}
