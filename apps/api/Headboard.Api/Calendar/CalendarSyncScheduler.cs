using System.Threading.Channels;
using Headboard.Api.Data;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Calendar;

/// <summary>
/// Runs calendar reconciliation: a full pass over connected users every <c>Calendar:PollIntervalSeconds</c> (300),
/// plus immediate passes for users nudged by task mutations or a manual "sync now".
/// </summary>
public class CalendarSyncScheduler(IServiceScopeFactory scopes, IConfiguration cfg, Headboard.Api.Jobs.LeaderLease lease, ILogger<CalendarSyncScheduler> log) : BackgroundService
{
    private readonly Channel<Guid> nudges = Channel.CreateUnbounded<Guid>(new UnboundedChannelOptions { SingleReader = true });

    public bool Enabled => cfg.GetValue<bool?>("Calendar:Enabled") ?? true;

    /// <summary>Ask for an immediate reconcile of one user (no-op when the scheduler is disabled).</summary>
    public void Nudge(Guid uid) { if (Enabled) nudges.Writer.TryWrite(uid); }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        if (!Enabled) { log.LogInformation("Calendar sync disabled"); return; }
        var interval = TimeSpan.FromSeconds(cfg.GetValue<int?>("Calendar:PollIntervalSeconds") ?? 300);
        log.LogInformation("Calendar sync: polling every {Interval}s", interval.TotalSeconds);
        var next = DateTimeOffset.UtcNow;
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var wait = next - DateTimeOffset.UtcNow;
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                if (wait > TimeSpan.Zero) cts.CancelAfter(wait);
                var pending = new HashSet<Guid>();
                try
                {
                    // drain nudges until the next full pass is due
                    while (await nudges.Reader.WaitToReadAsync(cts.Token))
                    {
                        while (nudges.Reader.TryRead(out var uid)) pending.Add(uid);
                        await Task.Delay(1500, cts.Token); // coalesce bursts of edits
                        foreach (var uid in pending) await ReconcileAsync(uid, ct);
                        pending.Clear();
                    }
                }
                catch (OperationCanceledException) when (!ct.IsCancellationRequested) { /* time for the full pass */ }
                foreach (var uid in pending) await ReconcileAsync(uid, ct);
                if (await lease.TryAcquireAsync(Headboard.Api.Jobs.LeaderLease.Jobs, lease.Ttl, ct)) await RunAllAsync(ct);
                next = DateTimeOffset.UtcNow + interval;
            }
            catch (Exception e) when (!ct.IsCancellationRequested) { log.LogError(e, "Calendar sync loop failed"); next = DateTimeOffset.UtcNow + interval; }
        }
    }

    public async Task<int> RunAllAsync(CancellationToken ct)
    {
        List<Guid> users;
        using (var scope = scopes.CreateScope()) users = await scope.ServiceProvider.GetRequiredService<AppDb>().CalendarLinks.Select(l => l.UserId).ToListAsync(ct);
        foreach (var uid in users) await ReconcileAsync(uid, ct);
        return users.Count;
    }

    public async Task<CalendarLinkRow?> ReconcileAsync(Guid uid, CancellationToken ct)
    {
        // One reconcile per user at a time across instances; a crashed holder frees the user after the TTL.
        var name = "calendar:" + uid.ToString("n");
        if (!await lease.TryAcquireAsync(name, TimeSpan.FromSeconds(60), ct)) { log.LogDebug("Calendar reconcile for {User} skipped: held elsewhere", uid); return null; }
        try
        {
            using var scope = scopes.CreateScope();
            return await scope.ServiceProvider.GetRequiredService<CalendarSyncService>().ReconcileUserAsync(uid, Wire.Now(), ct);
        }
        finally { await lease.ReleaseAsync(name, CancellationToken.None); }
    }
}
