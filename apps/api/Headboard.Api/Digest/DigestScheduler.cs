using Headboard.Api.Data;
using Headboard.Api.Jobs;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Digest;

/// <summary>
/// Background loop: every <c>Digest:CheckIntervalSeconds</c> (60) finds users whose local clock passed
/// <c>Digest:Hour</c> (8) without a digest today and generates one. Disabled with <c>Digest:Enabled=false</c>.
/// </summary>
public class DigestScheduler(IServiceScopeFactory scopes, IConfiguration cfg, LeaderLease lease, ILogger<DigestScheduler> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        if (!(cfg.GetValue<bool?>("Digest:Enabled") ?? true)) { log.LogInformation("Digest scheduler disabled"); return; }
        var hour = cfg.GetValue<int?>("Digest:Hour") ?? DigestSchedule.DefaultHour;
        var interval = TimeSpan.FromSeconds(cfg.GetValue<int?>("Digest:CheckIntervalSeconds") ?? 60);
        log.LogInformation("Digest scheduler: daily at {Hour}:00 local, checking every {Interval}s", hour, interval.TotalSeconds);
        using var timer = new PeriodicTimer(interval);
        do
        {
            try { if (await lease.TryAcquireAsync(LeaderLease.Jobs, lease.Ttl, ct)) await RunOnceAsync(hour, Wire.Now(), ct); }
            catch (Exception e) when (!ct.IsCancellationRequested) { log.LogError(e, "Digest scheduler tick failed"); }
        } while (await timer.WaitForNextTickAsync(ct));
    }

    /// <summary>One pass over all users; returns how many digests were generated.</summary>
    public async Task<int> RunOnceAsync(int hour, long now, CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var svc = scope.ServiceProvider.GetRequiredService<DigestService>();
        var users = await (from u in db.Users
                           join s in db.Settings on u.Id equals s.UserId into gj
                           from s in gj.DefaultIfEmpty()
                           select new { u.Id, s!.TimeZone, s.DigestAt }).ToListAsync(ct);
        var n = 0;
        foreach (var u in users)
        {
            if (!DigestSchedule.IsDue(now, u.TimeZone, u.DigestAt, hour)) continue;
            await svc.GenerateAsync(u.Id, now, ct);
            n++;
        }
        if (n > 0) log.LogInformation("Digest scheduler: generated {Count} digest(s)", n);
        return n;
    }
}
