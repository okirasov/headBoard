using Headboard.Api.Data;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Jobs;

/// <summary>
/// Database-backed leases so background jobs run on exactly one API instance at a time.
/// A lease is a row in <c>Leases</c> with an owner and an expiry; taking or renewing it is an optimistic
/// update guarded by the <see cref="LeaseRow.Version"/> concurrency token, which works the same on SQLite and PostgreSQL.
/// Daily jobs (digest, stale and due notifiers) share the <see cref="Jobs"/> lease; calendar reconciliation takes a
/// short per-user lease so nudges from any instance stay safe.
/// </summary>
public class LeaderLease(IServiceScopeFactory scopes, IConfiguration cfg, ILogger<LeaderLease> log)
{
    public const string Jobs = "jobs";

    /// <summary>Identity of this process; the owner written into leases it holds.</summary>
    public string InstanceId { get; } = Environment.MachineName + ":" + Guid.NewGuid().ToString("n")[..8];

    /// <summary>Set <c>Leases:Enabled=false</c> to run every job on every instance (single-process deployments, tests).</summary>
    public bool Enabled => cfg.GetValue<bool?>("Leases:Enabled") ?? true;

    public TimeSpan Ttl => TimeSpan.FromSeconds(cfg.GetValue<int?>("Leases:TtlSeconds") ?? 180);

    /// <summary>Whether this instance currently holds the shared jobs lease (informational, for /health).</summary>
    public bool IsLeader { get; private set; }

    // Loops inside one process must not race each other for the same row; cross-instance races are settled by the version token.
    private readonly SemaphoreSlim gate = new(1, 1);

    /// <summary>Take or renew <paramref name="name"/> for <paramref name="ttl"/>. True when this instance owns it afterwards.</summary>
    public async Task<bool> TryAcquireAsync(string name, TimeSpan ttl, CancellationToken ct, long? nowOverride = null)
    {
        if (!Enabled) return true;
        var now = nowOverride ?? Wire.Now();
        await gate.WaitAsync(ct);
        try { return await TakeAsync(name, ttl, now, ct); }
        finally { gate.Release(); }
    }

    private async Task<bool> TakeAsync(string name, TimeSpan ttl, long now, CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var row = await db.Leases.SingleOrDefaultAsync(l => l.Name == name, ct);
        try
        {
            if (row is null)
            {
                db.Leases.Add(new LeaseRow { Name = name, Owner = InstanceId, ExpiresAt = now + (long)ttl.TotalMilliseconds, Version = 1 });
                await db.SaveChangesAsync(ct);
                return Track(name, true);
            }
            if (row.Owner != InstanceId && row.ExpiresAt > now) return Track(name, false);
            row.Owner = InstanceId;
            row.ExpiresAt = now + (long)ttl.TotalMilliseconds;
            row.Version++;
            await db.SaveChangesAsync(ct);
            return Track(name, true);
        }
        catch (DbUpdateException e) // concurrency token mismatch, or another instance inserted the row first
        {
            log.LogDebug(e, "Lease {Name} contended", name);
            db.ChangeTracker.Clear();
            var current = await db.Leases.AsNoTracking().SingleOrDefaultAsync(l => l.Name == name, ct);
            return Track(name, current?.Owner == InstanceId && current.ExpiresAt > now);
        }
    }

    /// <summary>Give the lease up early so another instance can take it before the TTL runs out.</summary>
    public async Task ReleaseAsync(string name, CancellationToken ct)
    {
        if (!Enabled) return;
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var row = await db.Leases.SingleOrDefaultAsync(l => l.Name == name && l.Owner == InstanceId, ct);
        if (row is null) return;
        row.ExpiresAt = 0;
        row.Version++;
        try { await db.SaveChangesAsync(ct); } catch (DbUpdateConcurrencyException) { /* someone else already took it */ }
        Track(name, false);
    }

    private bool Track(string name, bool held)
    {
        if (name == Jobs && IsLeader != held) { IsLeader = held; log.LogInformation("Instance {Id} {State} the jobs lease", InstanceId, held ? "holds" : "released"); }
        return held;
    }
}
