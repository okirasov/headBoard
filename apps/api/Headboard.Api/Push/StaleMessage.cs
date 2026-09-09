using Headboard.Api.Ai;

namespace Headboard.Api.Push;

/// <summary>Text of the daily "forgotten tasks" notification, EN/RU.</summary>
public static class StaleMessage
{
    public const string Url = "/?view=review";
    public const string Tag = "stale";

    public static PushPayload? Build(DigestStatsDto s, string? lang)
    {
        if (s.StaleN == 0) return null;
        var ru = lang == "ru";
        var title = ru ? (s.StaleN == 1 ? "1 забытая задача" : $"Забытых задач: {s.StaleN}") : (s.StaleN == 1 ? "1 forgotten task" : $"{s.StaleN} forgotten tasks");
        var body = ru
            ? $"«{s.OldT}» ждёт уже {s.OldI} дн. Откройте Разбор: оставить, отложить или в архив."
            : $"\u201C{s.OldT}\u201D has waited {s.OldI} days. Open Review: keep, snooze, or drop.";
        return new PushPayload(title, body, Url, Tag);
    }
}
