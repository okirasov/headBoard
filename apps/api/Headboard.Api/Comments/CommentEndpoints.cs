using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Comments;

public record CreateCommentRequest(string Text, string? Id, long? At);

public static class CommentEndpoints
{
    public static IEndpointRouteBuilder MapComments(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/tasks/{id}/comments").RequireAuthorization();

        g.MapPost("/", async (string id, CreateCommentRequest body, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            if (string.IsNullOrWhiteSpace(body.Text)) return Results.BadRequest(new { error = "text_required" });
            var task = await db.Tasks.SingleOrDefaultAsync(t => t.Id == id && t.UserId == uid);
            if (task is null) return Results.NotFound();
            var row = new CommentRow
            {
                Id = string.IsNullOrWhiteSpace(body.Id) ? Wire.NewId('c') : body.Id,
                TaskId = id,
                UserId = uid,
                Text = body.Text,
                At = body.At is > 0 ? body.At.Value : Wire.Now(),
            };
            if (await db.Comments.AnyAsync(c => c.Id == row.Id)) return Results.Conflict(new { error = "id_exists" });
            db.Comments.Add(row);
            await db.SaveChangesAsync();
            return Results.Created($"/tasks/{id}/comments/{row.Id}", new CommentDto(row.Id, row.Text, row.At));
        });

        g.MapDelete("/{cid}", async (string id, string cid, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            var row = await db.Comments.SingleOrDefaultAsync(c => c.Id == cid && c.TaskId == id && c.UserId == uid);
            if (row is null) return Results.NotFound();
            db.Comments.Remove(row);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return app;
    }
}
