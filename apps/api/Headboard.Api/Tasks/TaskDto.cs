using Headboard.Api.Files;

namespace Headboard.Api.Tasks;

public record CommentDto(string Id, string Text, long At);

/// <summary>Core <c>HistoryEntry</c>: one change on a task.</summary>
public class HistoryEntryDto
{
    public string Id { get; set; } = "";
    public long At { get; set; }
    public string Kind { get; set; } = "";
    public string? From { get; set; }
    public string? To { get; set; }
    public string? Source { get; set; }
}

/// <summary>Wire shape of core <c>Task</c>. Property order matches model.ts; nulls serialize as null.</summary>
public class TaskDto
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Proj { get; set; }
    public int Pr { get; set; } = 1;
    public string Status { get; set; } = "inbox";
    public long Touched { get; set; }
    public long Created { get; set; }
    public long? Due { get; set; }
    public long SnoozedUntil { get; set; }
    public string? Recur { get; set; }
    public List<string> Tags { get; set; } = [];
    public string Note { get; set; } = "";
    public string? Chat { get; set; }
    public List<FileRefDto> Files { get; set; } = [];
    public List<CommentDto> Comments { get; set; } = [];
    public long? DoneAt { get; set; }
    public long? ArchivedAt { get; set; }
    public int? RemindDays { get; set; }
    public List<HistoryEntryDto> History { get; set; } = [];
    public string? SeriesId { get; set; }
}

public static class Wire
{
    public static readonly string[] Statuses = ["inbox", "focus", "waiting", "done", "archived"];
    public static readonly string[] Recurrences = ["daily", "weekly", "monthly"];
    public static readonly string[] Langs = ["en", "ru"];
    public static readonly string[] Themes = ["light", "dark"];

    public static long Now() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    /// <summary>Mirrors core <c>newTask</c>: prefix + epoch ms + 4 base-36 chars.</summary>
    public static string NewId(char prefix)
    {
        const string alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
        var rnd = string.Create(4, Random.Shared, (span, r) => { for (var i = 0; i < span.Length; i++) span[i] = alphabet[r.Next(alphabet.Length)]; });
        return prefix + Now().ToString() + rnd;
    }

    public static int ClampPriority(int n) => Math.Clamp(n, 0, 2);

    public const int HistoryCap = 200;
    public static readonly string[] HistoryKinds = ["created", "status", "done", "reopened", "archived", "restored", "priority", "due", "title", "note", "project", "tags", "recur", "remind", "snoozed", "unsnoozed", "bumped", "comment", "comment_removed", "file", "file_removed"];
}
