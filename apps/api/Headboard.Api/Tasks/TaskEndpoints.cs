using System.Text.Json;
using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Files;
using Headboard.Api.Calendar;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Tasks;

public static class TaskEndpoints
{
    public static IEndpointRouteBuilder MapTasks(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/tasks").RequireAuthorization();

        g.MapGet("/", async (HttpContext ctx, AppDb db, bool includeArchived = false) =>
        {
            var uid = CurrentUser.Id(ctx);
            var q = db.Tasks.Where(t => t.UserId == uid);
            if (!includeArchived) q = q.Where(t => t.Status != "archived");
            var rows = await q.OrderBy(t => t.Created).ThenBy(t => t.Id).ToListAsync();
            var ids = rows.Select(t => t.Id).ToList();
            var files = await db.Files.Where(f => f.UserId == uid && f.TaskId != null && ids.Contains(f.TaskId)).ToListAsync();
            var comments = await db.Comments.Where(c => c.UserId == uid && ids.Contains(c.TaskId)).ToListAsync();
            var filesBy = files.ToLookup(f => f.TaskId!);
            var commentsBy = comments.ToLookup(c => c.TaskId);
            return Results.Ok(rows.Select(t => TaskMapper.ToDto(t, filesBy[t.Id], commentsBy[t.Id])).ToList());
        });

        g.MapGet("/{id}", async (string id, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            var t = await db.Tasks.SingleOrDefaultAsync(x => x.Id == id && x.UserId == uid);
            return t is null ? Results.NotFound() : Results.Ok(await Load(db, t));
        });

        g.MapPost("/", async (TaskDto body, HttpContext ctx, AppDb db, CalendarSyncScheduler calendar) =>
        {
            var uid = CurrentUser.Id(ctx);
            if (TaskMapper.Validate(body) is { } err) return Results.BadRequest(new { error = err });
            if (body.Proj is not null && !await db.Projects.AnyAsync(p => p.Id == body.Proj && p.UserId == uid))
                return Results.BadRequest(new { error = "invalid_proj" });

            var row = TaskMapper.ToRow(body, uid);
            if (await db.Tasks.AnyAsync(t => t.Id == row.Id)) return Results.Conflict(new { error = "id_exists" });
            db.Tasks.Add(row);

            foreach (var c in body.Comments ?? [])
            {
                if (string.IsNullOrWhiteSpace(c.Text)) continue;
                db.Comments.Add(new CommentRow
                {
                    Id = string.IsNullOrWhiteSpace(c.Id) ? Wire.NewId('c') : c.Id,
                    TaskId = row.Id, UserId = uid, Text = c.Text, At = c.At > 0 ? c.At : Wire.Now(),
                });
            }
            await LinkFiles(db, uid, row.Id, body.Files);
            await db.SaveChangesAsync();
            if (row.Due is not null) calendar.Nudge(uid);
            return Results.Created($"/tasks/{row.Id}", await Load(db, row));
        });

        g.MapPatch("/{id}", async (string id, JsonElement body, HttpContext ctx, AppDb db, CalendarSyncScheduler calendar) =>
        {
            var uid = CurrentUser.Id(ctx);
            var t = await db.Tasks.SingleOrDefaultAsync(x => x.Id == id && x.UserId == uid);
            if (t is null) return Results.NotFound();
            if (TaskMapper.ApplyPatch(t, body) is { } err) return Results.BadRequest(new { error = err });
            if (t.ProjectId is not null && !await db.Projects.AnyAsync(p => p.Id == t.ProjectId && p.UserId == uid))
                return Results.BadRequest(new { error = "invalid_proj" });

            if (body.TryGetProperty("comments", out var comments) && comments.ValueKind == JsonValueKind.Array)
            {
                // Replace the comment set: upsert by id, delete the ones missing from the body.
                var incoming = comments.Deserialize<List<CommentDto>>(JsonSerializerOptions.Web) ?? [];
                var existing = await db.Comments.Where(c => c.TaskId == t.Id && c.UserId == uid).ToListAsync();
                var keep = new HashSet<string>();
                foreach (var c in incoming.Where(c => !string.IsNullOrWhiteSpace(c.Text)))
                {
                    var cid = string.IsNullOrWhiteSpace(c.Id) ? Wire.NewId('c') : c.Id;
                    keep.Add(cid);
                    var row = existing.FirstOrDefault(e => e.Id == cid);
                    if (row is null) db.Comments.Add(new CommentRow { Id = cid, TaskId = t.Id, UserId = uid, Text = c.Text, At = c.At > 0 ? c.At : Wire.Now() });
                    else { row.Text = c.Text; if (c.At > 0) row.At = c.At; }
                }
                db.Comments.RemoveRange(existing.Where(e => !keep.Contains(e.Id)));
            }
            if (body.TryGetProperty("files", out var files) && files.ValueKind == JsonValueKind.Array)
                await LinkFiles(db, uid, t.Id, files.Deserialize<List<FileRefDto>>(JsonSerializerOptions.Web));

            await db.SaveChangesAsync();
            if (t.Due is not null || t.CalendarEventId is not null) calendar.Nudge(uid);
            return Results.Ok(await Load(db, t));
        });

        g.MapDelete("/{id}", async (string id, HttpContext ctx, AppDb db, LocalStorage storage, CalendarSyncScheduler calendar) =>
        {
            var uid = CurrentUser.Id(ctx);
            var t = await db.Tasks.SingleOrDefaultAsync(x => x.Id == id && x.UserId == uid);
            if (t is null) return Results.NotFound();
            var files = await db.Files.Where(f => f.TaskId == id && f.UserId == uid).ToListAsync();
            foreach (var f in files) storage.Delete(f.StoragePath);
            db.Files.RemoveRange(files);
            db.Comments.RemoveRange(db.Comments.Where(c => c.TaskId == id && c.UserId == uid));
            var hadEvent = t.CalendarEventId is not null;
            if (hadEvent && await db.CalendarLinks.FindAsync(uid) is { } link)
            {
                var pending = TaskMapper.ParseTags(link.PendingDeletesJson);
                pending.Add(t.CalendarEventId!);
                link.PendingDeletesJson = TaskMapper.TagsJson(pending);
            }
            db.Tasks.Remove(t);
            await db.SaveChangesAsync();
            if (hadEvent) calendar.Nudge(uid); // the orphaned event is removed on the next pass
            return Results.NoContent();
        });

        return app;
    }

    /// <summary>Attaches already-uploaded files (owned by the user) referenced in a Task body to the task.</summary>
    private static async Task LinkFiles(AppDb db, Guid uid, string taskId, List<FileRefDto>? refs)
    {
        if (refs is null || refs.Count == 0) return;
        var ids = refs.Select(f => f.Id).Where(i => !string.IsNullOrEmpty(i)).Distinct().ToList();
        var rows = await db.Files.Where(f => f.UserId == uid && ids.Contains(f.Id)).ToListAsync();
        foreach (var f in rows) { f.TaskId = taskId; f.ProjectId = null; }
    }

    internal static async Task<TaskDto> Load(AppDb db, TaskRow t)
    {
        var files = await db.Files.Where(f => f.TaskId == t.Id && f.UserId == t.UserId).ToListAsync();
        var comments = await db.Comments.Where(c => c.TaskId == t.Id && c.UserId == t.UserId).ToListAsync();
        return TaskMapper.ToDto(t, files, comments);
    }
}
