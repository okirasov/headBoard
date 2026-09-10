using System.Text.RegularExpressions;
using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Tags;

public record RenameTagRequest(string? From, string? To);
public record RemoveTagRequest(string? Tag);
/// <summary>Result of a bulk tag operation: every task that changed, in full, so clients can adopt them.</summary>
public record TagOpResult(int Changed, List<TaskDto> Tasks);

/// <summary>
/// Bulk tag operations across all of a user's tasks (archived included), applied in one transaction.
/// Clients apply the same change locally first (offline-first) and call these to sweep whatever they did not have loaded.
/// </summary>
public static partial class TagEndpoints
{
    [GeneratedRegex(@"[^\p{L}\p{N}_-]")]
    private static partial Regex Disallowed();

    /// <summary>Mirrors core <c>normalizeTag</c>: lowercase, no leading '#', whitespace → '-', letters/digits/_/- only, ≤ 30 chars.</summary>
    public static string Normalize(string? raw)
    {
        var s = (raw ?? "").Trim().TrimStart('#').ToLowerInvariant();
        s = Regex.Replace(s, @"\s+", "-");
        s = Disallowed().Replace(s, "");
        s = Regex.Replace(s, "-{2,}", "-").Trim('-');
        return s.Length > 30 ? s[..30] : s;
    }

    public static IEndpointRouteBuilder MapTags(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/tags").RequireAuthorization();

        g.MapPost("/rename", async (RenameTagRequest body, HttpContext ctx, AppDb db) =>
        {
            var from = Normalize(body.From);
            var to = Normalize(body.To);
            if (from.Length == 0 || to.Length == 0) return Results.BadRequest(new { error = "invalid_tag" });
            if (from == to) return Results.Ok(new TagOpResult(0, []));
            return Results.Ok(await Apply(ctx, db, from, tags =>
            {
                var next = new List<string>();
                foreach (var t in tags) { var v = t == from ? to : t; if (!next.Contains(v)) next.Add(v); }
                return next;
            }));
        });

        g.MapPost("/remove", async (RemoveTagRequest body, HttpContext ctx, AppDb db) =>
        {
            var tag = Normalize(body.Tag);
            if (tag.Length == 0) return Results.BadRequest(new { error = "invalid_tag" });
            return Results.Ok(await Apply(ctx, db, tag, tags => tags.Where(t => t != tag).ToList()));
        });

        return app;
    }

    private static async Task<TagOpResult> Apply(HttpContext ctx, AppDb db, string tag, Func<List<string>, List<string>> rewrite)
    {
        var uid = CurrentUser.Id(ctx);
        var now = Wire.Now();
        // Tags live in a JSON column; narrow by substring in SQL, then decide exactly in memory.
        var candidates = await db.Tasks.Where(t => t.UserId == uid && t.TagsJson.Contains(tag)).ToListAsync();
        var changed = new List<TaskRow>();
        foreach (var t in candidates)
        {
            var tags = TaskMapper.ParseTags(t.TagsJson);
            if (!tags.Contains(tag)) continue;
            var next = rewrite(tags);
            TaskMapper.AppendHistory(t, "tags", now, string.Join(' ', tags), string.Join(' ', next), "api");
            t.TagsJson = TaskMapper.TagsJson(next);
            changed.Add(t);
        }
        if (changed.Count > 0) await db.SaveChangesAsync(); // one SaveChanges = one transaction
        var ids = changed.Select(t => t.Id).ToList();
        var files = (await db.Files.Where(f => f.UserId == uid && f.TaskId != null && ids.Contains(f.TaskId)).ToListAsync()).ToLookup(f => f.TaskId!);
        var comments = (await db.Comments.Where(c => c.UserId == uid && ids.Contains(c.TaskId)).ToListAsync()).ToLookup(c => c.TaskId);
        return new TagOpResult(changed.Count, changed.Select(t => TaskMapper.ToDto(t, files[t.Id], comments[t.Id])).ToList());
    }
}
