using System.Net;
using System.Net.Http.Json;
using System.Text;

namespace Headboard.Api.Tests;

/// <summary>Fake Google token endpoint: records the form fields and answers with a token payload.</summary>
internal sealed class FakeGoogleTokenHandler(HttpStatusCode status, string body) : HttpMessageHandler
{
    public Dictionary<string, string> LastForm { get; private set; } = new();
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var raw = request.Content is null ? "" : await request.Content.ReadAsStringAsync(ct);
        LastForm = raw.Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(kv => kv.Split('=', 2))
            .ToDictionary(kv => Uri.UnescapeDataString(kv[0]), kv => kv.Length > 1 ? Uri.UnescapeDataString(kv[1]) : "");
        return new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
    }
}

public class GoogleAuthTests
{
    [Fact]
    public async Task Google_WithoutAnyClientId_Is503()
    {
        using var f = new ApiFactory();
        var res = await f.CreateClient().PostAsJsonAsync("/auth/google", new { idToken = "x" }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
    }

    [Fact]
    public async Task Google_CodeWithoutSecret_Is503_And_EmptyBody_Is400()
    {
        using var f = new ApiFactory { GoogleWebClientId = "web.apps.googleusercontent.com" };
        var c = f.CreateClient();
        var res = await c.PostAsJsonAsync("/auth/google", new { code = "abc" }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
        var empty = await c.PostAsJsonAsync("/auth/google", new { }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.BadRequest, empty.StatusCode);
    }

    [Fact]
    public async Task Google_Code_IsExchangedWithWebClientAndSecret_ThenVerified()
    {
        var google = new FakeGoogleTokenHandler(HttpStatusCode.OK, "{\"access_token\":\"a\",\"id_token\":\"not.a.real.jwt\"}");
        using var f = new ApiFactory { GoogleWebClientId = "web.apps.googleusercontent.com", GoogleClientSecret = "s3cret", GoogleHandler = google };
        var res = await f.CreateClient().PostAsJsonAsync("/auth/google", new { code = "4/code", redirectUri = "postmessage" }, ApiFactory.Json);

        // The exchange happened with the right form, and the forged id-token was rejected by signature verification.
        Assert.Equal("4/code", google.LastForm["code"]);
        Assert.Equal("web.apps.googleusercontent.com", google.LastForm["client_id"]);
        Assert.Equal("s3cret", google.LastForm["client_secret"]);
        Assert.Equal("postmessage", google.LastForm["redirect_uri"]);
        Assert.Equal("authorization_code", google.LastForm["grant_type"]);
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Google_CodeRejectedByGoogle_Is401()
    {
        var google = new FakeGoogleTokenHandler(HttpStatusCode.BadRequest, "{\"error\":\"invalid_grant\"}");
        using var f = new ApiFactory { GoogleWebClientId = "web", GoogleClientSecret = "s", GoogleHandler = google };
        var res = await f.CreateClient().PostAsJsonAsync("/auth/google", new { code = "bad" }, ApiFactory.Json);
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }
}
