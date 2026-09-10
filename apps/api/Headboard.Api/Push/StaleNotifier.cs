using Headboard.Api.Data;
using Headboard.Api.Digest;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Push;

/// <summary>
/// Once a day at <c>Notify:Hour</c> (9) local time, users who opted in and have forgotten tasks get a push on every registered device.
/// Reuses <see cref="DigestSchedule.IsDue"/> with <c>Settings.LastStaleNotifyAt</c> as the daily marker.
/// </summary>
public class StaleNotifier(IServiceScopeFactory scopes, IConfiguration cfg, Headboard.Api.Jobs.LeaderLease lease, ILogger<StaleNotifier> log) : BackgroundService
{
    public const int DefaultHour = 9;

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        if (!(cfg.GetValue<bool?>("Notify:Enabled") ?? true)) { log.LogInformation("Stale notifier disabled"); return; }
        var hour = cfg.GetValue<int?>("Notify:Hour") ?? DefaultHour;
        var interval = TimeSpan.FromSeconds(cfg.GetValue<int?>("Notify:CheckIntervalSeconds") ?? 60);
        log.LogInformation("Stale notifier: daily at {Hour}:00 local, checking every {Interval}s", hour, interval.TotalSeconds);
        using var timer = new PeriodicTimer(interval);
        do
        {
            try { if (await lease.TryAcquireAsync(Headboard.Api.Jobs.LeaderLease.Jobs, lease.Ttl, ct)) await RunOnceAsync(hour, Wire.Now(), ct); }
            catch (Exception e) when (!ct.IsCancellationRequested) { log.LogError(e, "Stale notifier tick failed"); }
        } while (await timer.WaitForNextTickAsync(ct));
    }

    /// <summary>One pass; returns the number of notifications sent (per device).</summary>
    public async Task<int> RunOnceAsync(int hour, long now, CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var dispatcher = scope.ServiceProvider.GetRequiredService<PushDispatcher>();
        var candidates = await db.Settings.Where(s => s.NotifyStale).ToListAsync(ct);
        var sent = 0;
        foreach (var s in candidates)
        {
            if (!DigestSchedule.IsDue(now, s.TimeZone, s.LastStaleNotifyAt, hour)) continue;
            var subs = await db.PushSubscriptions.Where(p => p.UserId == s.UserId).ToListAsync(ct);
            s.LastStaleNotifyAt = now; // one evaluation per day whether or not something was sent
            if (subs.Count == 0) continue;
            var tasks = await db.Tasks.Where(t => t.UserId == s.UserId).ToListAsync(ct);
            var stats = DigestService.ComputeStats(tasks, now, DigestSchedule.Zone(s.TimeZone), s.StaleDays);
            var payload = StaleMessage.Build(stats, s.Lang);
            if (payload is null) continue;
            sent += await dispatcher.SendToAllAsync(subs, payload, now, ct);
        }
        await db.SaveChangesAsync(ct);
        if (sent > 0) log.LogInformation("Stale notifier: sent {Count} notification(s)", sent);
        return sent;
    }
}

/// <summary>Routes a payload to each subscription's sender, drops subscriptions that are gone, counts failures.</summary>
public class PushDispatcher(AppDb db, IEnumerable<IPushSender> senders)
{
    public IPushSender? For(string kind) => senders.FirstOrDefault(s => s.Kind == kind);

    public async Task<int> SendToAllAsync(List<PushSubscriptionRow> subs, PushPayload payload, long now, CancellationToken ct)
    {
        var ok = 0;
        foreach (var sub in subs)
        {
            var sender = For(sub.Kind);
            if (sender is null || !sender.IsConfigured) continue;
            switch (await sender.SendAsync(sub, payload, ct))
            {
                case PushResult.Ok: sub.LastSentAt = now; sub.FailCount = 0; ok++; break;
                case PushResult.Gone: db.PushSubscriptions.Remove(sub); break;
                case PushResult.Failed: if (++sub.FailCount >= 5) db.PushSubscriptions.Remove(sub); break;
            }
        }
        return ok;
    }
}
