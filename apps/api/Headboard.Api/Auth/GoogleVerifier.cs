using Google.Apis.Auth;

namespace Headboard.Api.Auth;

/// <summary>Identity asserted by an external id-token.</summary>
public record ExternalIdentity(string Subject, string Email, string Name);

public class GoogleVerifier(IConfiguration cfg)
{
    public bool IsConfigured => !string.IsNullOrWhiteSpace(cfg["Auth:GoogleClientId"]);

    public async Task<ExternalIdentity?> VerifyAsync(string idToken)
    {
        var clientId = cfg["Auth:GoogleClientId"]!;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings { Audience = [clientId] };
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            var email = payload.Email ?? "";
            return new ExternalIdentity(payload.Subject, email, payload.Name ?? email);
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
