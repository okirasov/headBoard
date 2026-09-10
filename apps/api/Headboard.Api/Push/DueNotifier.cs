using Headboard.Api.Data;
using Headboard.Api.Digest;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Push;

/// <summary>
/// Morning push about deadlines: once a day after <c>Notify:Hour</c> (local), users with <c>NotifyDue</c> get one
/// notification listing tasks whose reminder fires today (due today with RemindDays 0, due tomorrow with 1, or overdue with a reminder).
/// Mirrors core <c>dueReminderTargets</c>.
/// </summary>
public class DueNotifier(IServiceScopeFactory scopes, IConfiguration cfg, ILogger<DueNotifier> log) : BackgroundService
{
    private const long Day = 86_400_000;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        if (!(cfg.GetValue<bool?>("Notify:Enabled") ?? true)) return;
        var hour = cfg.GetValue<int?>("Notify:Hour") ?? StaleNotifier.DefaultHour;
        var interval = TimeSpan.FromSeconds(cfg.GetValue<int?>("Notify:CheckIntervalSeconds") ?? 60);
        log.LogInformation("Due notifier: daily at {Hour}:00 local", hour);
        using var timer = new PeriodicTimer(interval);
        do
        {
            try { await RunOnceAsync(hour, Wire.Now(), ct); }
            catch (Exception e) when (!ct.IsCancellationRequested) { log.LogError(e, "Due notifier tick failed"); }
        } while (await timer.WaitForNextTickAsync(ct));
    }

    public static List<TaskRow> Targets(IEnumerable<TaskRow> tasks, long now, TimeZoneInfo tz)
    {
        var today = DigestSchedule.StartOfLocalDay(now, tz);
        return tasks
            .Where(t => t.Status is not ("done" or "archived") && t.Due is not null && t.RemindDays is not null)
            .Where(t => { var dueDay = DigestSchedule.StartOfLocalDay(t.Due!.Value, tz); return dueDay <= today || dueDay == today + t.RemindDays!.Value * Day; })
            .OrderBy(t => t.Due).ToList();
    }

    public static PushPayload? Build(List<TaskRow> targets, long now, TimeZoneInfo tz, string? lang)
    {
        if (targets.Count == 0) return null;
        var today = DigestSchedule.StartOfLocalDay(now, tz);
        var ru = lang == "ru";
        var overdue = targets.Count(t => DigestSchedule.StartOfLocalDay(t.Due!.Value, tz) < today);
        var todayN = targets.Count(t => DigestSchedule.StartOfLocalDay(t.Due!.Value, tz) == today);
        var tomorrowN = targets.Count - overdue - todayN;
        var parts = new List<string>();
        if (overdue > 0) parts.Add(ru ? $"просрочено: {overdue}" : $"{overdue} overdue");
        if (todayN > 0) parts.Add(ru ? $"сегодня: {todayN}" : $"{todayN} due today");
        if (tomorrowN > 0) parts.Add(ru ? $"завтра: {tomorrowN}" : $"{tomorrowN} due tomorrow");
        var title = (ru ? "Сроки — " : "Deadlines — ") + string.Join(" · ", parts);
        var first = targets[0].Title;
        var body = targets.Count == 1 ? (ru ? $"«{first}»" : $"\u201C{first}\u201D") : (ru ? $"Начните с «{first}» и ещё {targets.Count - 1}." : $"Start with \u201C{first}\u201D and {targets.Count - 1} more.");
        return new PushPayload(title, body, "/?view=due", "due");
    }

    public async Task<int> RunOnceAsync(int hour, long now, CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var dispatcher = scope.ServiceProvider.GetRequiredService<PushDispatcher>();
        var sent = 0;
        foreach (var s in await db.Settings.Where(x => x.NotifyDue).ToListAsync(ct))
        {
            if (!DigestSchedule.IsDue(now, s.TimeZone, s.LastDueNotifyAt, hour)) continue;
            var subs = await db.PushSubscriptions.Where(p => p.UserId == s.UserId).ToListAsync(ct);
            s.LastDueNotifyAt = now;
            if (subs.Count == 0) continue;
            var tz = DigestSchedule.Zone(s.TimeZone);
            var targets = Targets(await db.Tasks.Where(t => t.UserId == s.UserId).ToListAsync(ct), now, tz);
            var payload = Build(targets, now, tz, s.Lang);
            if (payload is null) continue;
            sent += await dispatcher.SendToAllAsync(subs, payload, now, ct);
        }
        await db.SaveChangesAsync(ct);
        if (sent > 0) log.LogInformation("Due notifier: sent {Count} notification(s)", sent);
        return sent;
    }
}
