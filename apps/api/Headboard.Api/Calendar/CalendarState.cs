using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Headboard.Api.Auth;

namespace Headboard.Api.Calendar;

/// <summary>Signed OAuth <c>state</c>: who is connecting, where to return, and when it expires.</summary>
public record CalendarStatePayload(Guid Uid, string Ret, long Exp);

public class CalendarState(IConfiguration cfg)
{
    private byte[] Key => TokenService.SigningKey(cfg).Key;

    public string Create(Guid uid, string returnUrl, TimeSpan ttl)
    {
        var payload = JsonSerializer.SerializeToUtf8Bytes(new CalendarStatePayload(uid, returnUrl, DateTimeOffset.UtcNow.Add(ttl).ToUnixTimeMilliseconds()));
        var sig = HMACSHA256.HashData(Key, payload);
        return B64(payload) + "." + B64(sig);
    }

    public CalendarStatePayload? Verify(string? state)
    {
        if (string.IsNullOrEmpty(state)) return null;
        var parts = state.Split('.');
        if (parts.Length != 2) return null;
        try
        {
            var payload = UnB64(parts[0]);
            var sig = UnB64(parts[1]);
            if (!CryptographicOperations.FixedTimeEquals(sig, HMACSHA256.HashData(Key, payload))) return null;
            var p = JsonSerializer.Deserialize<CalendarStatePayload>(payload);
            return p is null || p.Exp < DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() ? null : p;
        }
        catch (FormatException) { return null; }
        catch (JsonException) { return null; }
    }

    private static string B64(byte[] b) => Convert.ToBase64String(b).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    private static byte[] UnB64(string s) { s = s.Replace('-', '+').Replace('_', '/'); return Convert.FromBase64String(s.PadRight(s.Length + (4 - s.Length % 4) % 4, '=')); }
}
