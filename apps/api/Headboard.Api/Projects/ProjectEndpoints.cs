using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Files;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Projects;

/// <summary>Core <c>Project</c> plus the project's files (spec: project files bar under the board header).</summary>
public class ProjectDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Color { get; set; } = "";
    public List<FileRefDto> Files { get; set; } = [];

    public static ProjectDto From(ProjectRow p, IEnumerable<FileRow> files) => new()
    {
        Id = p.Id, Name = p.Name, Color = p.Color, Files = files.Select(FileRefDto.From).ToList(),
    };
}

public record ProjectPatch(string? Name, string? Color);

public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjects(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/projects").RequireAuthorization();

        g.MapGet("/", async (HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            var rows = await db.Projects.Where(p => p.UserId == uid).OrderBy(p => p.Name).ToListAsync();
            var files = (await db.Files.Where(f => f.UserId == uid && f.ProjectId != null).ToListAsync()).ToLookup(f => f.ProjectId!);
            return Results.Ok(rows.Select(p => ProjectDto.From(p, files[p.Id])).ToList());
        });

        g.MapPost("/", async (ProjectDto body, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            if (string.IsNullOrWhiteSpace(body.Name)) return Results.BadRequest(new { error = "name_required" });
            var row = new ProjectRow
            {
                Id = string.IsNullOrWhiteSpace(body.Id) ? Wire.NewId('p') : body.Id.Trim(),
                UserId = uid,
                Name = body.Name.Trim(),
                Color = body.Color ?? "",
            };
            if (await db.Projects.AnyAsync(p => p.Id == row.Id)) return Results.Conflict(new { error = "id_exists" });
            db.Projects.Add(row);
            await db.SaveChangesAsync();
            return Results.Created($"/projects/{row.Id}", ProjectDto.From(row, []));
        });

        g.MapPatch("/{id}", async (string id, ProjectPatch body, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            var row = await db.Projects.SingleOrDefaultAsync(p => p.Id == id && p.UserId == uid);
            if (row is null) return Results.NotFound();
            if (body.Name is not null)
            {
                if (string.IsNullOrWhiteSpace(body.Name)) return Results.BadRequest(new { error = "name_required" });
                row.Name = body.Name.Trim();
            }
            if (body.Color is not null) row.Color = body.Color;
            await db.SaveChangesAsync();
            var files = await db.Files.Where(f => f.ProjectId == id && f.UserId == uid).ToListAsync();
            return Results.Ok(ProjectDto.From(row, files));
        });

        g.MapDelete("/{id}", async (string id, HttpContext ctx, AppDb db, LocalStorage storage) =>
        {
            var uid = CurrentUser.Id(ctx);
            var row = await db.Projects.SingleOrDefaultAsync(p => p.Id == id && p.UserId == uid);
            if (row is null) return Results.NotFound();
            await db.Tasks.Where(t => t.ProjectId == id && t.UserId == uid).ExecuteUpdateAsync(s => s.SetProperty(t => t.ProjectId, (string?)null));
            var files = await db.Files.Where(f => f.ProjectId == id && f.UserId == uid).ToListAsync();
            foreach (var f in files) storage.Delete(f.StoragePath);
            db.Files.RemoveRange(files);
            db.Projects.Remove(row);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return app;
    }
}
