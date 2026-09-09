using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Headboard.Api.Auth;

public class AppleVerifier(IConfiguration cfg)
{
    private const string AppleIssuer = "https://appleid.apple.com";

    private static readonly ConfigurationManager<OpenIdConnectConfiguration> Oidc = new(
        AppleIssuer + "/.well-known/openid-configuration",
        new OpenIdConnectConfigurationRetriever(),
        new HttpDocumentRetriever());

    /// <summary>Accepted audiences: <c>Auth:AppleClientIds</c> (Services ID for web, bundle id for iOS) plus legacy <c>Auth:AppleClientId</c>.</summary>
    public string[] ClientIds
    {
        get
        {
            var list = cfg.GetSection("Auth:AppleClientIds").Get<string[]>()?.Where(s => !string.IsNullOrWhiteSpace(s)) ?? [];
            if (cfg["Auth:AppleClientId"] is { Length: > 0 } a) list = list.Append(a);
            return list.Distinct().ToArray();
        }
    }

    public bool IsConfigured => ClientIds.Length > 0;

    /// <param name="name">Optional display name sent by the client (Apple only provides it on the first sign-in, outside the token).</param>
    public async Task<ExternalIdentity?> VerifyAsync(string idToken, string? name, CancellationToken ct)
    {
        var conf = await Oidc.GetConfigurationAsync(ct);
        var result = await new JsonWebTokenHandler().ValidateTokenAsync(idToken, new TokenValidationParameters
        {
            ValidIssuer = AppleIssuer,
            ValidAudiences = ClientIds,
            IssuerSigningKeys = conf.SigningKeys,
            ValidateLifetime = true,
        });
        if (!result.IsValid) return null;

        var sub = result.Claims.TryGetValue("sub", out var s) ? s?.ToString() : null;
        if (string.IsNullOrEmpty(sub)) return null;
        var email = result.Claims.TryGetValue("email", out var e) ? e?.ToString() ?? "" : "";
        var display = !string.IsNullOrWhiteSpace(name) ? name.Trim() : LocalPart(email);
        return new ExternalIdentity(sub, email, display);
    }

    internal static string LocalPart(string email)
    {
        var at = email.IndexOf('@');
        return at > 0 ? email[..at] : email;
    }
}
