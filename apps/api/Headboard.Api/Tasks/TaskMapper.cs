using System.Text.Json;
using Headboard.Api.Data;
using Headboard.Api.Files;

namespace Headboard.Api.Tasks;

public static class TaskMapper
{
    public static TaskDto ToDto(TaskRow t, IEnumerable<FileRow> files, IEnumerable<CommentRow> comments) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Proj = t.ProjectId,
        Pr = t.Priority,
        Status = t.Status,
        Touched = t.Touched,
        Created = t.Created,
        Due = t.Due,
        SnoozedUntil = t.SnoozedUntil,
        Recur = t.Recur,
        Tags = ParseTags(t.TagsJson),
        Note = t.Note,
        Chat = t.Chat,
        Files = files.Select(FileRefDto.From).ToList(),
        Comments = comments.OrderBy(c => c.At).Select(c => new CommentDto(c.Id, c.Text, c.At)).ToList(),
        DoneAt = t.DoneAt,
        ArchivedAt = t.ArchivedAt,
        RemindDays = t.RemindDays,
    };

    public static List<string> ParseTags(string json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? []; }
        catch (JsonException) { return []; }
    }

    public static string TagsJson(IEnumerable<string> tags) => JsonSerializer.Serialize(tags);

    /// <summary>Validates a full Task body for creation; returns an error code or null.</summary>
    public static string? Validate(TaskDto d)
    {
        if (string.IsNullOrWhiteSpace(d.Title)) return "title_required";
        if (d.Pr is < 0 or > 2) return "invalid_pr";
        if (!Wire.Statuses.Contains(d.Status)) return "invalid_status";
        if (d.Recur is not null && d.Recur != "weekly") return "invalid_recur";
        return null;
    }

    public static TaskRow ToRow(TaskDto d, Guid userId)
    {
        var now = Wire.Now();
        return new TaskRow
        {
            Id = string.IsNullOrWhiteSpace(d.Id) ? Wire.NewId('n') : d.Id.Trim(),
            UserId = userId,
            Title = d.Title.Trim(),
            ProjectId = d.Proj,
            Priority = d.Pr,
            Status = d.Status,
            Touched = d.Touched > 0 ? d.Touched : now,
            Created = d.Created > 0 ? d.Created : now,
            Due = d.Due,
            SnoozedUntil = d.SnoozedUntil,
            Recur = d.Recur,
            TagsJson = TagsJson(d.Tags ?? []),
            Note = d.Note ?? "",
            Chat = d.Chat,
            DoneAt = d.DoneAt,
            ArchivedAt = d.ArchivedAt,
            RemindDays = d.RemindDays is 0 or 1 ? d.RemindDays : null,
        };
    }

    /// <summary>
    /// Applies a partial Task (JSON object) to a row. Presence of a property matters: <c>"due": null</c> clears it,
    /// an absent property leaves it untouched. Returns an error code or null. Nested comments/files are handled by the caller.
    /// </summary>
    public static string? ApplyPatch(TaskRow t, JsonElement body)
    {
        if (body.ValueKind != JsonValueKind.Object) return "body_must_be_object";
        foreach (var p in body.EnumerateObject())
        {
            var v = p.Value;
            switch (p.Name)
            {
                case "title":
                    if (v.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(v.GetString())) return "title_required";
                    t.Title = v.GetString()!.Trim();
                    break;
                case "proj":
                    if (v.ValueKind == JsonValueKind.Null) t.ProjectId = null;
                    else if (v.ValueKind == JsonValueKind.String) t.ProjectId = v.GetString();
                    else return "invalid_proj";
                    break;
                case "pr":
                    if (v.ValueKind != JsonValueKind.Number || !v.TryGetInt32(out var pr) || pr is < 0 or > 2) return "invalid_pr";
                    t.Priority = pr;
                    break;
                case "status":
                    if (v.ValueKind != JsonValueKind.String || !Wire.Statuses.Contains(v.GetString())) return "invalid_status";
                    t.Status = v.GetString()!;
                    break;
                case "touched":
                    if (!TryLong(v, out var touched)) return "invalid_touched";
                    t.Touched = touched;
                    break;
                case "created":
                    if (!TryLong(v, out var created)) return "invalid_created";
                    t.Created = created;
                    break;
                case "due":
                    if (v.ValueKind == JsonValueKind.Null) t.Due = null;
                    else if (TryLong(v, out var due)) t.Due = due;
                    else return "invalid_due";
                    break;
                case "snoozedUntil":
                    if (!TryLong(v, out var snoozed)) return "invalid_snoozedUntil";
                    t.SnoozedUntil = snoozed;
                    break;
                case "recur":
                    if (v.ValueKind == JsonValueKind.Null) t.Recur = null;
                    else if (v.ValueKind == JsonValueKind.String && v.GetString() == "weekly") t.Recur = "weekly";
                    else return "invalid_recur";
                    break;
                case "tags":
                    if (v.ValueKind != JsonValueKind.Array || v.EnumerateArray().Any(x => x.ValueKind != JsonValueKind.String)) return "invalid_tags";
                    t.TagsJson = TagsJson(v.EnumerateArray().Select(x => x.GetString()!));
                    break;
                case "note":
                    if (v.ValueKind != JsonValueKind.String) return "invalid_note";
                    t.Note = v.GetString()!;
                    break;
                case "chat":
                    if (v.ValueKind == JsonValueKind.Null) t.Chat = null;
                    else if (v.ValueKind == JsonValueKind.String) t.Chat = v.GetString();
                    else return "invalid_chat";
                    break;
                case "doneAt":
                    if (v.ValueKind == JsonValueKind.Null) t.DoneAt = null;
                    else if (TryLong(v, out var doneAt)) t.DoneAt = doneAt;
                    else return "invalid_doneAt";
                    break;
                case "archivedAt":
                    if (v.ValueKind == JsonValueKind.Null) t.ArchivedAt = null;
                    else if (TryLong(v, out var archivedAt)) t.ArchivedAt = archivedAt;
                    else return "invalid_archivedAt";
                    break;
                case "remindDays":
                    if (v.ValueKind == JsonValueKind.Null) t.RemindDays = null;
                    else if (v.TryGetInt32(out var rd) && rd is 0 or 1) t.RemindDays = rd;
                    else return "invalid_remindDays";
                    break;
                case "id":
                case "files":
                case "comments":
                    break; // id is immutable; nested collections handled by the endpoint
                default:
                    break; // unknown properties are ignored for forward compatibility
            }
        }
        return null;
    }

    private static bool TryLong(JsonElement v, out long value)
    {
        value = 0;
        if (v.ValueKind != JsonValueKind.Number) return false;
        if (v.TryGetInt64(out value)) return true;
        if (v.TryGetDouble(out var d)) { value = (long)d; return true; }
        return false;
    }
}
