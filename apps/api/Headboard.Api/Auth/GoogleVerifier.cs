using System.Net.Http.Json;
using System.Text.Json;
using Google.Apis.Auth;

namespace Headboard.Api.Auth;

/// <summary>Identity asserted by an external id-token.</summary>
public record ExternalIdentity(string Subject, string Email, string Name);

/// <summary>
/// Verifies Google id-tokens against every configured client id (web, iOS and Android apps each have their own),
/// and exchanges web authorization codes for id-tokens with the web client secret.
/// </summary>
public class GoogleVerifier(IConfiguration cfg, IHttpClientFactory http)
{
    public const string HttpClientName = "google-oauth";
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";

    /// <summary>All accepted audiences: <c>Auth:GoogleClientIds</c> (array) plus legacy <c>Auth:GoogleClientId</c> and <c>Auth:GoogleWebClientId</c>.</summary>
    public string[] ClientIds =>
        cfg.GetSection("Auth:GoogleClientIds").Get<string[]>()?.Where(s => !string.IsNullOrWhiteSpace(s)).ToArray() is { Length: > 0 } list
            ? list.Concat(Legacy()).Distinct().ToArray()
            : Legacy().Distinct().ToArray();

    private IEnumerable<string> Legacy()
    {
        if (cfg["Auth:GoogleClientId"] is { Length: > 0 } a) yield return a;
        if (cfg["Auth:GoogleWebClientId"] is { Length: > 0 } b) yield return b;
    }

    public bool IsConfigured => ClientIds.Length > 0;

    /// <summary>Code exchange needs the web client id and its secret.</summary>
    public bool CanExchangeCode => !string.IsNullOrWhiteSpace(WebClientId) && !string.IsNullOrWhiteSpace(cfg["Auth:GoogleClientSecret"]);

    private string? WebClientId => cfg["Auth:GoogleWebClientId"] is { Length: > 0 } w ? w : cfg["Auth:GoogleClientId"];

    public async Task<ExternalIdentity?> VerifyAsync(string idToken)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings { Audience = ClientIds };
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            var email = payload.Email ?? "";
            return new ExternalIdentity(payload.Subject, email, payload.Name ?? email);
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }

    /// <summary>
    /// Exchanges an authorization code from the browser code-flow popup (redirect uri <c>postmessage</c>) for tokens
    /// and returns the id-token, or null when Google rejects the code.
    /// </summary>
    public async Task<string?> ExchangeCodeAsync(string code, string redirectUri, CancellationToken ct)
    {
        if (!CanExchangeCode) return null;
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = WebClientId!,
            ["client_secret"] = cfg["Auth:GoogleClientSecret"]!,
            ["redirect_uri"] = string.IsNullOrWhiteSpace(redirectUri) ? "postmessage" : redirectUri,
            ["grant_type"] = "authorization_code",
        });
        using var res = await http.CreateClient(HttpClientName).PostAsync(TokenEndpoint, form, ct);
        if (!res.IsSuccessStatusCode) return null;
        var json = await res.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        return json.TryGetProperty("id_token", out var t) ? t.GetString() : null;
    }
}
