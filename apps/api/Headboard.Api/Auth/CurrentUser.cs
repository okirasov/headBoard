using System.Security.Claims;

namespace Headboard.Api.Auth;

public static class CurrentUser
{
    /// <summary>Reads the current user's id from the JWT <c>sub</c> claim.</summary>
    public static Guid Id(HttpContext ctx)
    {
        var sub = ctx.User.FindFirstValue("sub") ?? ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : throw new UnauthorizedAccessException("Missing sub claim.");
    }
}
