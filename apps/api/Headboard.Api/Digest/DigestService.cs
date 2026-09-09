using Headboard.Api.Ai;
using Headboard.Api.Data;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Digest;

/// <summary>
/// Server-side twin of core <c>digestStats</c> / <c>cannedDigest</c>: computes the day's numbers for a user,
/// asks Anthropic for the text (or falls back to the canned variants) and stores it in Settings.
/// </summary>
public class DigestService(AppDb db, AnthropicClient ai, ILogger<DigestService> log)
{
    public const int StaleDays = 7;
    private const long Day = 86_400_000;

    public static DigestStatsDto ComputeStats(IReadOnlyList<TaskRow> tasks, long now, TimeZoneInfo tz)
    {
        var live = tasks.Where(t => t.Status != "archived").ToList();
        var today = DigestSchedule.StartOfLocalDay(now, tz);
        int DueDiff(TaskRow t) => (int)Math.Round((DigestSchedule.StartOfLocalDay(t.Due!.Value, tz) - today) / (double)Day);
        int Idle(TaskRow t) => (int)Math.Max(0, Math.Floor((now - t.Touched) / (double)Day));
        bool Stale(TaskRow t) => t.Status != "done" && Idle(t) >= StaleDays && (t.SnoozedUntil == 0 || t.SnoozedUntil < now);

        var due = live.Where(t => t.Status != "done" && t.Due is not null && DueDiff(t) <= 0).ToList();
        var stale = live.Where(Stale).OrderByDescending(Idle).ToList();
        var doneW = live.Count(t => t.Status == "done" && t.DoneAt is { } d && now - d < 7 * Day);
        return new DigestStatsDto(
            due.Count, due.FirstOrDefault()?.Title ?? "\u2014",
            stale.Count, stale.FirstOrDefault()?.Title ?? "\u2014", stale.Count > 0 ? Idle(stale[0]) : 0,
            doneW, live.Count(t => t.Status == "focus"), live.Count(t => t.Recur is not null));
    }

    /// <summary>Verbatim port of core cannedDigest(i, stats, lang).</summary>
    public static string Canned(int i, DigestStatsDto s, string? lang)
    {
        string[] arr = lang == "ru"
            ? [
                "На сегодня: " + s.DueN + " — начните с «" + s.DueFirst + "». Забытых задач: " + s.StaleN + "; «" + s.OldT + "» ждёт уже " + s.OldI + " дн. — пора решить: сделать, делегировать или отпустить. За неделю закрыто " + s.DoneW + " — держите темп.",
                "В фокусе " + s.FocusN + " задач — ещё одна, и станет тесно. «" + s.OldT + "» (" + s.OldI + " дн. простоя) — ваш самый старый открытый вопрос: закройте его или отпустите. За 7 дней завершено: " + s.DoneW + ".",
                "Спокойный день: на сегодня " + s.DueN + ", повторяющихся " + s.RecN + ". Забытых задач: " + s.StaleN + " — откройте «Разбор» и отправьте в архив то, что уже не актуально.",
            ]
            : [
                s.DueN + " due today — start with \u201C" + s.DueFirst + "\u201D. " + s.StaleN + " tasks are forgotten; \u201C" + s.OldT + "\u201D has waited " + s.OldI + " days and deserves a verdict: do it, delegate it, or drop it. You closed " + s.DoneW + " this week — keep the streak.",
                "Focus is holding " + s.FocusN + " tasks, which is one decision away from too many. \u201C" + s.OldT + "\u201D (" + s.OldI + " days idle) is your oldest open loop — close it or let it go. " + s.DoneW + " finished in the last 7 days.",
                "A calm day: " + s.DueN + " due, " + s.RecN + " recurring. " + s.StaleN + " tasks are forgotten — open Review and archive what no longer matters.",
            ];
        return arr[((i % arr.Length) + arr.Length) % arr.Length];
    }

    /// <summary>Generates and stores today's digest for one user; returns the text.</summary>
    public async Task<string> GenerateAsync(Guid userId, long now, CancellationToken ct)
    {
        var settings = await db.Settings.FindAsync([userId], ct);
        if (settings is null) { settings = new SettingsRow { UserId = userId }; db.Settings.Add(settings); }
        var tz = DigestSchedule.Zone(settings.TimeZone);
        var tasks = await db.Tasks.Where(t => t.UserId == userId).ToListAsync(ct);
        var stats = ComputeStats(tasks, now, tz);

        string? text = null;
        if (ai.IsConfigured)
        {
            try { text = (await ai.CompleteAsync(Prompts.Digest(stats, settings.Lang), ct)).Trim(); }
            catch (Exception e) when (e is AnthropicException or HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
            { log.LogWarning(e, "Scheduled digest: Anthropic failed for {User}, using canned text", userId); }
        }
        if (string.IsNullOrWhiteSpace(text)) text = Canned(DigestSchedule.LocalDate(now, tz).DayNumber, stats, settings.Lang);

        settings.DigestText = text;
        settings.DigestAt = now;
        await db.SaveChangesAsync(ct);
        return text;
    }
}
