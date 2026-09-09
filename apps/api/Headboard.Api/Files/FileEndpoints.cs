using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Files;

public static class FileEndpoints
{
    private static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        { ".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic", ".heif", ".bmp", ".svg", ".avif" };

    public static IEndpointRouteBuilder MapFiles(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/files").RequireAuthorization();

        // POST /files?taskId=... | ?projectId=...  (multipart/form-data, first file part is used)
        g.MapPost("/", async (HttpContext ctx, AppDb db, LocalStorage storage, string? taskId, string? projectId, CancellationToken ct) =>
        {
            var uid = CurrentUser.Id(ctx);
            if (string.IsNullOrEmpty(taskId) == string.IsNullOrEmpty(projectId))
                return Results.BadRequest(new { error = "taskId_or_projectId_required" });
            if (!ctx.Request.HasFormContentType) return Results.BadRequest(new { error = "multipart_required" });

            if (taskId is not null && !await db.Tasks.AnyAsync(t => t.Id == taskId && t.UserId == uid)) return Results.NotFound();
            if (projectId is not null && !await db.Projects.AnyAsync(p => p.Id == projectId && p.UserId == uid)) return Results.NotFound();

            var form = await ctx.Request.ReadFormAsync(ct);
            var file = form.Files.FirstOrDefault();
            if (file is null || file.Length == 0) return Results.BadRequest(new { error = "file_required" });

            var name = Path.GetFileName(string.IsNullOrWhiteSpace(file.FileName) ? "file" : file.FileName);
            var contentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType;
            var row = new FileRow
            {
                Id = Wire.NewId('f'),
                UserId = uid,
                TaskId = taskId,
                ProjectId = projectId,
                Name = name,
                Kind = DetectKind(contentType, name),
                Size = file.Length,
                ContentType = contentType,
            };
            await using (var s = file.OpenReadStream())
                row.StoragePath = await storage.SaveAsync(uid, row.Id, s, ct);
            db.Files.Add(row);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/files/{row.Id}/content", FileRefDto.From(row));
        }).DisableAntiforgery();

        g.MapGet("/{id}/content", async (string id, HttpContext ctx, AppDb db, LocalStorage storage) =>
        {
            var uid = CurrentUser.Id(ctx);
            var row = await db.Files.SingleOrDefaultAsync(f => f.Id == id && f.UserId == uid);
            if (row is null) return Results.NotFound();
            var stream = storage.Open(row.StoragePath);
            if (stream is null) return Results.NotFound();
            var contentType = row.ContentType ?? "application/octet-stream";
            // Images render inline (used as <img src>); other files download with their original name.
            return Results.Stream(stream, contentType, fileDownloadName: row.Kind == "img" ? null : row.Name, enableRangeProcessing: true);
        });

        g.MapDelete("/{id}", async (string id, HttpContext ctx, AppDb db, LocalStorage storage) =>
        {
            var uid = CurrentUser.Id(ctx);
            var row = await db.Files.SingleOrDefaultAsync(f => f.Id == id && f.UserId == uid);
            if (row is null) return Results.NotFound();
            storage.Delete(row.StoragePath);
            db.Files.Remove(row);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return app;
    }

    /// <summary>core FileRef.kind: 'img' for image/* content types (extension fallback for untyped uploads), else 'file'.</summary>
    public static string DetectKind(string? contentType, string name)
    {
        if (contentType is not null && contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)) return "img";
        if ((string.IsNullOrEmpty(contentType) || contentType == "application/octet-stream") && ImageExtensions.Contains(Path.GetExtension(name))) return "img";
        return "file";
    }
}
