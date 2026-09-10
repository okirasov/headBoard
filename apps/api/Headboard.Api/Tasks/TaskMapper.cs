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
        History = ParseHistory(t.HistoryJson),
        SeriesId = t.SeriesId,
    };

    public static List<HistoryEntryDto> ParseHistory(string json)
    {
        try { return JsonSerializer.Deserialize<List<HistoryEntryDto>>(json, JsonSerializerOptions.Web) ?? []; }
        catch (JsonException) { return []; }
    }

    /// <summary>Serializes a history list, keeping only known kinds and the newest <see cref="Wire.HistoryCap"/> entries.</summary>
    public static string HistoryJson(IEnumerable<HistoryEntryDto> history)
    {
        var list = history.Where(h => Wire.HistoryKinds.Contains(h.Kind) && !string.IsNullOrEmpty(h.Id)).ToList();
        if (list.Count > Wire.HistoryCap) list = list.Skip(list.Count - Wire.HistoryCap).ToList();
        return JsonSerializer.Serialize(list, JsonSerializerOptions.Web);
    }

    /// <summary>Fields the change log tracks; captured before a patch so the server can diff when the client sent no <c>history</c>.</summary>
    public readonly record struct Snapshot(string Title, string? ProjectId, int Priority, string Status, long Touched, long? Due, long SnoozedUntil, string? Recur, string TagsJson, string Note, int? RemindDays)
    {
        public static Snapshot Of(TaskRow t) => new(t.Title, t.ProjectId, t.Priority, t.Status, t.Touched, t.Due, t.SnoozedUntil, t.Recur, t.TagsJson, t.Note, t.RemindDays);
    }

    /// <summary>
    /// Mirrors core <c>diffTask</c>: one entry per changed field between <paramref name="before"/> and the row now,
    /// tagged with <paramref name="source"/>. Used for edits made straight through the API (no client-side log).
    /// </summary>
    public static void AppendDiff(TaskRow t, Snapshot before, long at, string source = "api")
    {
        var list = ParseHistory(t.HistoryJson);
        var n = list.Count;
        void Add(string kind, string? from = null, string? to = null) => list.Add(new HistoryEntryDto { Id = Wire.NewId('h'), At = at, Kind = kind, From = from, To = to, Source = source });
        if (before.Status != t.Status)
        {
            var kind = t.Status == "done" ? "done" : t.Status == "archived" ? "archived" : before.Status == "archived" ? "restored" : before.Status == "done" ? "reopened" : "status";
            Add(kind, before.Status, t.Status);
        }
        if (before.Priority != t.Priority) Add("priority", before.Priority.ToString(), t.Priority.ToString());
        if (before.Due != t.Due) Add("due", before.Due?.ToString(), t.Due?.ToString());
        if (before.Title != t.Title) Add("title", before.Title, t.Title);
        if (before.Note != t.Note) Add("note");
        if (before.ProjectId != t.ProjectId) Add("project", before.ProjectId, t.ProjectId);
        if (before.TagsJson != t.TagsJson) Add("tags", string.Join(' ', ParseTags(before.TagsJson)), string.Join(' ', ParseTags(t.TagsJson)));
        if (before.Recur != t.Recur) Add("recur", before.Recur, t.Recur);
        if (before.RemindDays != t.RemindDays) Add("remind", before.RemindDays?.ToString(), t.RemindDays?.ToString());
        if (before.SnoozedUntil != t.SnoozedUntil) Add(t.SnoozedUntil > 0 ? "snoozed" : "unsnoozed", null, t.SnoozedUntil > 0 ? t.SnoozedUntil.ToString() : null);
        if (list.Count == n && t.Touched > before.Touched) Add("bumped");
        if (list.Count != n) t.HistoryJson = HistoryJson(list);
    }

    /// <summary>Appends a server-made entry (source = "calendar" etc.) to a row's log.</summary>
    public static void AppendHistory(TaskRow t, string kind, long at, string? from = null, string? to = null, string source = "calendar")
    {
        var list = ParseHistory(t.HistoryJson);
        list.Add(new HistoryEntryDto { Id = Wire.NewId('h'), At = at, Kind = kind, From = from, To = to, Source = source });
        t.HistoryJson = HistoryJson(list);
    }

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
        if (d.Recur is not null && !Wire.Recurrences.Contains(d.Recur)) return "invalid_recur";
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
            HistoryJson = HistoryJson(d.History ?? []),
            SeriesId = string.IsNullOrWhiteSpace(d.SeriesId) ? null : d.SeriesId.Trim(),
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
                    else if (v.ValueKind == JsonValueKind.String && Wire.Recurrences.Contains(v.GetString()!)) t.Recur = v.GetString();
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
                case "seriesId":
                    if (v.ValueKind == JsonValueKind.Null) t.SeriesId = null;
                    else if (v.ValueKind == JsonValueKind.String) t.SeriesId = v.GetString();
                    else return "invalid_seriesId";
                    break;
                case "history":
                    if (v.ValueKind != JsonValueKind.Array) return "invalid_history";
                    var hist = v.Deserialize<List<HistoryEntryDto>>(JsonSerializerOptions.Web);
                    if (hist is null || hist.Any(h => string.IsNullOrEmpty(h.Id) || h.At <= 0 || !Wire.HistoryKinds.Contains(h.Kind))) return "invalid_history";
                    // Union by id with what is stored: entries another device pushed are never lost to a partial client log.
                    var byId = ParseHistory(t.HistoryJson).ToDictionary(h => h.Id);
                    foreach (var h in hist) byId[h.Id] = h;
                    t.HistoryJson = HistoryJson(byId.Values.OrderBy(h => h.At));
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
