using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Headboard.Api.Calendar;

public class GoogleApiException(int status, string body) : Exception($"Google API returned {status}: {body}")
{
    public int Status => status;
}

public record GoogleTokens(string? AccessToken, string? RefreshToken, int ExpiresIn);
public record EventsPage(List<JsonObject> Items, string? NextPageToken, string? NextSyncToken);

/// <summary>Thin REST client for Google OAuth and Calendar v3 (raw JSON, no SDK, testable with a fake handler).</summary>
public class GoogleCalendarClient(IHttpClientFactory http, IConfiguration cfg)
{
    public const string HttpClientName = "google-calendar";
    public const string Scope = "https://www.googleapis.com/auth/calendar";
    private const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    private const string RevokeEndpoint = "https://oauth2.googleapis.com/revoke";
    private const string CalendarBase = "https://www.googleapis.com/calendar/v3";

    public string? ClientId => cfg["Auth:GoogleWebClientId"] is { Length: > 0 } w ? w : cfg["Auth:GoogleClientId"];
    public string? ClientSecret => cfg["Auth:GoogleClientSecret"];
    public bool IsConfigured => !string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret);

    private HttpClient Http => http.CreateClient(HttpClientName);

    /// <summary>Consent URL requesting offline access to Calendar; <paramref name="state"/> carries the signed user/return info.</summary>
    public string AuthorizationUrl(string redirectUri, string state) =>
        "https://accounts.google.com/o/oauth2/v2/auth?" + string.Join("&", new Dictionary<string, string>
        {
            ["client_id"] = ClientId ?? "", ["redirect_uri"] = redirectUri, ["response_type"] = "code", ["scope"] = Scope,
            ["access_type"] = "offline", ["prompt"] = "consent", ["include_granted_scopes"] = "true", ["state"] = state,
        }.Select(kv => kv.Key + "=" + Uri.EscapeDataString(kv.Value)));

    public async Task<GoogleTokens> ExchangeCodeAsync(string code, string redirectUri, CancellationToken ct)
    {
        var res = await Http.PostAsync(TokenEndpoint, new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code, ["client_id"] = ClientId!, ["client_secret"] = ClientSecret!, ["redirect_uri"] = redirectUri, ["grant_type"] = "authorization_code",
        }), ct);
        var j = await ReadAsync(res, ct);
        return new GoogleTokens(j["access_token"]?.GetValue<string>(), j["refresh_token"]?.GetValue<string>(), j["expires_in"]?.GetValue<int>() ?? 3600);
    }

    public async Task<GoogleTokens> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        var res = await Http.PostAsync(TokenEndpoint, new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["refresh_token"] = refreshToken, ["client_id"] = ClientId!, ["client_secret"] = ClientSecret!, ["grant_type"] = "refresh_token",
        }), ct);
        var j = await ReadAsync(res, ct);
        return new GoogleTokens(j["access_token"]?.GetValue<string>(), refreshToken, j["expires_in"]?.GetValue<int>() ?? 3600);
    }

    public async Task RevokeAsync(string token, CancellationToken ct)
    {
        using var res = await Http.PostAsync(RevokeEndpoint, new FormUrlEncodedContent(new Dictionary<string, string> { ["token"] = token }), ct);
        // best effort: an already-revoked token yields 400
    }

    public async Task<string> CreateCalendarAsync(string accessToken, string summary, string? timeZone, CancellationToken ct)
    {
        var body = new JsonObject { ["summary"] = summary };
        if (!string.IsNullOrWhiteSpace(timeZone)) body["timeZone"] = timeZone;
        var j = await SendAsync(accessToken, HttpMethod.Post, CalendarBase + "/calendars", body, ct);
        return j["id"]!.GetValue<string>();
    }

    /// <summary>One page of events; pass <paramref name="syncToken"/> for incremental listing (410 → <see cref="GoogleApiException"/> with Status 410).</summary>
    public async Task<EventsPage> ListEventsAsync(string accessToken, string calendarId, string? syncToken, string? pageToken, CancellationToken ct)
    {
        var q = new List<string> { "maxResults=250", "showDeleted=true", "singleEvents=true" };
        if (!string.IsNullOrEmpty(syncToken)) q.Add("syncToken=" + Uri.EscapeDataString(syncToken));
        if (!string.IsNullOrEmpty(pageToken)) q.Add("pageToken=" + Uri.EscapeDataString(pageToken));
        var j = await SendAsync(accessToken, HttpMethod.Get, $"{CalendarBase}/calendars/{Uri.EscapeDataString(calendarId)}/events?" + string.Join("&", q), null, ct);
        var items = (j["items"] as JsonArray)?.OfType<JsonObject>().ToList() ?? [];
        return new EventsPage(items, j["nextPageToken"]?.GetValue<string>(), j["nextSyncToken"]?.GetValue<string>());
    }

    public Task<JsonObject> InsertEventAsync(string accessToken, string calendarId, JsonObject ev, CancellationToken ct) =>
        SendAsync(accessToken, HttpMethod.Post, $"{CalendarBase}/calendars/{Uri.EscapeDataString(calendarId)}/events", ev, ct);

    public Task<JsonObject> PatchEventAsync(string accessToken, string calendarId, string eventId, JsonObject ev, CancellationToken ct) =>
        SendAsync(accessToken, HttpMethod.Patch, $"{CalendarBase}/calendars/{Uri.EscapeDataString(calendarId)}/events/{Uri.EscapeDataString(eventId)}", ev, ct);

    public async Task DeleteEventAsync(string accessToken, string calendarId, string eventId, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Delete, $"{CalendarBase}/calendars/{Uri.EscapeDataString(calendarId)}/events/{Uri.EscapeDataString(eventId)}");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var res = await Http.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode && res.StatusCode is not (HttpStatusCode.NotFound or HttpStatusCode.Gone))
            throw new GoogleApiException((int)res.StatusCode, await res.Content.ReadAsStringAsync(ct));
    }

    private async Task<JsonObject> SendAsync(string accessToken, HttpMethod method, string url, JsonObject? body, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(method, url);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        if (body is not null) req.Content = JsonContent.Create(body);
        using var res = await Http.SendAsync(req, ct);
        return await ReadAsync(res, ct);
    }

    private static async Task<JsonObject> ReadAsync(HttpResponseMessage res, CancellationToken ct)
    {
        var text = await res.Content.ReadAsStringAsync(ct);
        if (!res.IsSuccessStatusCode) throw new GoogleApiException((int)res.StatusCode, text);
        if (string.IsNullOrWhiteSpace(text)) return new JsonObject();
        return JsonNode.Parse(text) as JsonObject ?? new JsonObject();
    }
}
