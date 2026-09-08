using System.Net;
using System.Net.Http.Json;
using Headboard.Api.Auth;

namespace Headboard.Api.Tests;

public class AuthTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _f;
    public AuthTests(ApiFactory f) => _f = f;

    [Fact]
    public async Task DevLogin_ReturnsTokenAndUser()
    {
        var client = _f.CreateClient();
        var res = await client.PostAsJsonAsync("/auth/dev", new { email = "oleg@example.com", name = "Oleg Kirasov", provider = "Google" });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var auth = await res.Content.ReadFromJsonAsync<AuthResponse>(ApiFactory.Json);
        Assert.NotNull(auth);
        Assert.False(string.IsNullOrEmpty(auth!.Token));
        Assert.Equal("Oleg Kirasov", auth.User.Name);
        Assert.Equal("oleg@example.com", auth.User.Email);
        Assert.Equal("Google", auth.User.Provider);
        Assert.Equal("OK", auth.User.Initials);
    }

    [Fact]
    public async Task Me_WithToken_ReturnsUser()
    {
        var (client, auth) = await _f.LoginAsync("me@example.com", "Me Person", "Apple");
        var me = await client.GetFromJsonAsync<UserDto>("/me", ApiFactory.Json);
        Assert.NotNull(me);
        Assert.Equal(auth.User, me);
        Assert.Equal("Apple", me!.Provider);
        Assert.Equal("MP", me.Initials);
    }

    [Fact]
    public async Task Me_WithoutToken_Is401()
    {
        var res = await _f.CreateClient().GetAsync("/me");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task DevLogin_SameEmailTwice_IsSameUser()
    {
        var (c1, a1) = await _f.LoginAsync("same@example.com", "Same One");
        var (_, a2) = await _f.LoginAsync("same@example.com", "Same One");
        Assert.Equal(a1.User, a2.User);
        var me = await c1.GetFromJsonAsync<UserDto>("/me", ApiFactory.Json);
        Assert.Equal("Same One", me!.Name);
    }

    [Fact]
    public async Task Google_WithoutClientId_Is503()
    {
        var res = await _f.CreateClient().PostAsJsonAsync("/auth/google", new { idToken = "x" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
    }

    [Theory]
    [InlineData("Oleg Kirasov", "OK")]
    [InlineData("Ada", "A")]
    [InlineData("  jane   q   public ", "JQ")]
    [InlineData("", "?")]
    public void Initials_TakesUpToTwoWords(string name, string expected) =>
        Assert.Equal(expected, AuthEndpoints.Initials(name));
}
