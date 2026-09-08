using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace Headboard.Api.Ai;

public class AnthropicException(int status, string body) : Exception($"Anthropic API returned {status}: {body}")
{
    public int Status { get; } = status;
    public string Body { get; } = body;
}

/// <summary>Thin client over <c>POST https://api.anthropic.com/v1/messages</c>; returns the concatenated text blocks.</summary>
public class AnthropicClient(HttpClient http, IConfiguration cfg)
{
    public const string HttpClientName = "anthropic";
    public const string Endpoint = "https://api.anthropic.com/v1/messages";
    public const string ApiVersion = "2023-06-01";
    public const string DefaultModel = "claude-sonnet-5";
    public const int MaxTokens = 800;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(cfg["Anthropic:ApiKey"]);
    public string Model => cfg["Anthropic:Model"] is { Length: > 0 } m ? m : DefaultModel;

    public async Task<string> CompleteAsync(string prompt, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, Endpoint);
        req.Headers.Add("x-api-key", cfg["Anthropic:ApiKey"]);
        req.Headers.Add("anthropic-version", ApiVersion);
        req.Content = JsonContent.Create(new
        {
            model = Model,
            max_tokens = MaxTokens,
            messages = new[] { new { role = "user", content = prompt } },
        });

        using var res = await http.SendAsync(req, ct);
        var body = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode) throw new AnthropicException((int)res.StatusCode, body);

        using var doc = JsonDocument.Parse(body);
        var sb = new StringBuilder();
        if (doc.RootElement.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.Array)
        {
            foreach (var block in content.EnumerateArray())
            {
                if (block.TryGetProperty("type", out var type) && type.GetString() == "text" &&
                    block.TryGetProperty("text", out var text) && text.ValueKind == JsonValueKind.String)
                    sb.Append(text.GetString());
            }
        }
        return sb.ToString();
    }
}
