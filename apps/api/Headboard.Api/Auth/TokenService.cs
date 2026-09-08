using System.Security.Claims;
using System.Text;
using Headboard.Api.Data;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Headboard.Api.Auth;

public class TokenService(IConfiguration cfg)
{
    public static SymmetricSecurityKey SigningKey(IConfiguration cfg)
    {
        var secret = cfg["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(secret) || Encoding.UTF8.GetByteCount(secret) < 32)
            throw new InvalidOperationException("Jwt:Secret must be configured and be at least 32 bytes long.");
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }

    public static string Issuer(IConfiguration cfg) => cfg["Jwt:Issuer"] is { Length: > 0 } i ? i : "headboard";

    public string Create(UserRow user)
    {
        var issuer = Issuer(cfg);
        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = issuer,
            Audience = issuer,
            Expires = DateTime.UtcNow.AddDays(30),
            SigningCredentials = new SigningCredentials(SigningKey(cfg), SecurityAlgorithms.HmacSha256),
            Subject = new ClaimsIdentity(
            [
                new Claim("sub", user.Id.ToString()),
                new Claim("email", user.Email),
                new Claim("name", user.Name),
                new Claim("provider", user.Provider),
            ]),
        };
        return new JsonWebTokenHandler().CreateToken(descriptor);
    }
}
