using System.Text.Json;
using Headboard.Api.Auth;
using Headboard.Api.Data;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Templates;

/// <summary>Wire shape of core <c>Template</c>.</summary>
public class TemplateDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Proj { get; set; }
    public int Pr { get; set; } = 1;
    public List<string> Tags { get; set; } = [];
    public string Note { get; set; } = "";
    public int? DueInDays { get; set; }
    public int? RemindDays { get; set; }
    public int UsedCount { get; set; }

    public static TemplateDto From(TemplateRow r) => new()
    {
        Id = r.Id, Name = r.Name, Title = r.Title, Proj = r.ProjectId, Pr = r.Priority, Tags = TaskMapper.ParseTags(r.TagsJson),
        Note = r.Note, DueInDays = r.DueInDays, RemindDays = r.RemindDays, UsedCount = r.UsedCount,
    };
}

public static class TemplateEndpoints
{
    public static IEndpointRouteBuilder MapTemplates(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/templates").RequireAuthorization();

        g.MapGet("/", async (HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            var rows = await db.Templates.Where(t => t.UserId == uid).OrderBy(t => t.Name).ToListAsync();
            return Results.Ok(rows.Select(TemplateDto.From).ToList());
        });

        g.MapPost("/", async (TemplateDto body, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            if (Validate(body) is { } err) return Results.BadRequest(new { error = err });
            if (body.Proj is not null && !await db.Projects.AnyAsync(p => p.Id == body.Proj && p.UserId == uid)) return Results.BadRequest(new { error = "invalid_proj" });
            var row = new TemplateRow { Id = string.IsNullOrWhiteSpace(body.Id) ? Wire.NewId('t') : body.Id.Trim(), UserId = uid };
            if (await db.Templates.AnyAsync(t => t.Id == row.Id)) return Results.Conflict(new { error = "id_exists" });
            Apply(row, body);
            db.Templates.Add(row);
            await db.SaveChangesAsync();
            return Results.Created($"/templates/{row.Id}", TemplateDto.From(row));
        });

        g.MapPatch("/{id}", async (string id, JsonElement body, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            var row = await db.Templates.SingleOrDefaultAsync(t => t.Id == id && t.UserId == uid);
            if (row is null) return Results.NotFound();
            var dto = TemplateDto.From(row);
            var patch = body.Deserialize<TemplateDto>(JsonSerializerOptions.Web) ?? new TemplateDto();
            // Only properties present in the body override the current values.
            foreach (var prop in body.EnumerateObject())
            {
                switch (prop.Name)
                {
                    case "name": dto.Name = patch.Name; break;
                    case "title": dto.Title = patch.Title; break;
                    case "proj": dto.Proj = patch.Proj; break;
                    case "pr": dto.Pr = patch.Pr; break;
                    case "tags": dto.Tags = patch.Tags; break;
                    case "note": dto.Note = patch.Note; break;
                    case "dueInDays": dto.DueInDays = patch.DueInDays; break;
                    case "remindDays": dto.RemindDays = patch.RemindDays; break;
                    case "usedCount": dto.UsedCount = patch.UsedCount; break;
                }
            }
            if (Validate(dto) is { } err) return Results.BadRequest(new { error = err });
            if (dto.Proj is not null && !await db.Projects.AnyAsync(p => p.Id == dto.Proj && p.UserId == uid)) return Results.BadRequest(new { error = "invalid_proj" });
            Apply(row, dto);
            await db.SaveChangesAsync();
            return Results.Ok(TemplateDto.From(row));
        });

        g.MapDelete("/{id}", async (string id, HttpContext ctx, AppDb db) =>
        {
            var uid = CurrentUser.Id(ctx);
            var row = await db.Templates.SingleOrDefaultAsync(t => t.Id == id && t.UserId == uid);
            if (row is null) return Results.NotFound();
            db.Templates.Remove(row);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return app;
    }

    private static string? Validate(TemplateDto d)
    {
        if (string.IsNullOrWhiteSpace(d.Name)) return "name_required";
        if (d.Pr is < 0 or > 2) return "invalid_pr";
        if (d.DueInDays is < 0 or > 3650) return "invalid_dueInDays";
        if (d.RemindDays is not (null or 0 or 1)) return "invalid_remindDays";
        return null;
    }

    private static void Apply(TemplateRow row, TemplateDto d)
    {
        row.Name = d.Name.Trim();
        row.Title = string.IsNullOrWhiteSpace(d.Title) ? row.Name : d.Title.Trim();
        row.ProjectId = d.Proj;
        row.Priority = d.Pr;
        row.TagsJson = TaskMapper.TagsJson(d.Tags ?? []);
        row.Note = d.Note ?? "";
        row.DueInDays = d.DueInDays;
        row.RemindDays = d.RemindDays;
        row.UsedCount = Math.Max(0, d.UsedCount);
    }
}
