using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using Headboard.Api.Data;
using Headboard.Api.Digest;

namespace Headboard.Api.Calendar;

/// <summary>Pure mapping between tasks and all-day Google Calendar events.</summary>
public static class EventMapper
{
    public const string TaskIdKey = "headboardTaskId";

    /// <summary>A task is mirrored while it has a due date and is neither done nor archived.</summary>
    public static bool ShouldMirror(TaskRow t) => t.Due is not null && t.Status is not ("done" or "archived");

    public static string LocalDate(long epochMs, TimeZoneInfo tz) => DigestSchedule.LocalDate(epochMs, tz).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    /// <summary>Epoch ms of local midnight for a yyyy-MM-dd date in the zone.</summary>
    public static long? ParseLocalDate(string? date, TimeZoneInfo tz)
    {
        if (!DateOnly.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d)) return null;
        var midnight = d.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        return new DateTimeOffset(midnight, tz.GetUtcOffset(midnight)).ToUnixTimeMilliseconds();
    }

    public static JsonObject ToEvent(TaskRow t, TimeZoneInfo tz)
    {
        var start = LocalDate(t.Due!.Value, tz);
        var end = DateOnly.ParseExact(start, "yyyy-MM-dd", CultureInfo.InvariantCulture).AddDays(1).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        return new JsonObject
        {
            ["summary"] = t.Title,
            ["description"] = string.IsNullOrWhiteSpace(t.Note) ? "Headboard task" : t.Note,
            ["start"] = new JsonObject { ["date"] = start },
            ["end"] = new JsonObject { ["date"] = end },
            ["transparency"] = "transparent",
            ["extendedProperties"] = new JsonObject { ["private"] = new JsonObject { [TaskIdKey] = t.Id } },
        };
    }

    /// <summary>Stable fingerprint of the fields pushed to the calendar; equal hash → nothing to push.</summary>
    public static string Hash(TaskRow t, TimeZoneInfo tz)
    {
        var s = t.Title + "\n" + (t.Due is null ? "" : LocalDate(t.Due.Value, tz)) + "\n" + (t.Note ?? "");
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(s)))[..16];
    }

    /// <summary>Fingerprint of an event in the same form as <see cref="Hash"/>, so our own pushes can be recognised as echoes.</summary>
    public static string HashOfEvent(JsonObject ev)
    {
        var desc = ev["description"]?.GetValue<string>() ?? "";
        if (desc == "Headboard task") desc = "";
        var s = (ev["summary"]?.GetValue<string>() ?? "") + "\n" + (StartDate(ev) ?? "") + "\n" + desc;
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(s)))[..16];
    }

    public static string? TaskIdOf(JsonObject ev) => ev["extendedProperties"]?["private"]?[TaskIdKey]?.GetValue<string>();
    public static bool IsCancelled(JsonObject ev) => ev["status"]?.GetValue<string>() == "cancelled";
    public static string? StartDate(JsonObject ev) => ev["start"]?["date"]?.GetValue<string>() ?? ev["start"]?["dateTime"]?.GetValue<string>()?[..10];
    public static long UpdatedMs(JsonObject ev) =>
        DateTimeOffset.TryParse(ev["updated"]?.GetValue<string>(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var d) ? d.ToUnixTimeMilliseconds() : 0;

    /// <summary>Applies an inbound event to a task: due date from start, title from summary. Returns true when anything changed.</summary>
    public static bool ApplyInbound(TaskRow t, JsonObject ev, TimeZoneInfo tz)
    {
        var changed = false;
        var due = ParseLocalDate(StartDate(ev), tz);
        if (due is not null && (t.Due is null || LocalDate(t.Due.Value, tz) != LocalDate(due.Value, tz))) { t.Due = due; changed = true; }
        var summary = ev["summary"]?.GetValue<string>()?.Trim();
        if (!string.IsNullOrEmpty(summary) && summary != t.Title) { t.Title = summary; changed = true; }
        return changed;
    }
}
