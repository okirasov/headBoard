using System.Net.Http.Json;
using Headboard.Api.Data;
using Headboard.Api.Jobs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Headboard.Api.Tests;

public class LeaseTests
{
    private static LeaderLease Make(ApiFactory f) => new(
        f.Services.GetRequiredService<IServiceScopeFactory>(),
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Leases:Enabled"] = "true", ["Leases:TtlSeconds"] = "60" }).Build(),
        NullLogger<LeaderLease>.Instance);

    [Fact]
    public async Task OnlyOneInstanceHoldsTheLease_UntilItExpiresOrIsReleased()
    {
        using var f = new ApiFactory();
        var a = Make(f);
        var b = Make(f);
        var ttl = TimeSpan.FromSeconds(60);
        var t0 = 1_800_000_000_000L;

        Assert.True(await a.TryAcquireAsync(LeaderLease.Jobs, ttl, CancellationToken.None, t0));
        Assert.False(await b.TryAcquireAsync(LeaderLease.Jobs, ttl, CancellationToken.None, t0 + 1_000));
        Assert.True(await a.TryAcquireAsync(LeaderLease.Jobs, ttl, CancellationToken.None, t0 + 30_000)); // renew
        Assert.True(a.IsLeader); Assert.False(b.IsLeader);

        // a stops renewing → after the TTL b takes over, and a cannot take it back while b holds it
        Assert.True(await b.TryAcquireAsync(LeaderLease.Jobs, ttl, CancellationToken.None, t0 + 30_000 + 61_000));
        Assert.False(await a.TryAcquireAsync(LeaderLease.Jobs, ttl, CancellationToken.None, t0 + 30_000 + 62_000));
        Assert.False(a.IsLeader); Assert.True(b.IsLeader);

        // explicit release hands it over immediately
        await b.ReleaseAsync(LeaderLease.Jobs, CancellationToken.None);
        Assert.True(await a.TryAcquireAsync(LeaderLease.Jobs, ttl, CancellationToken.None, t0 + 30_000 + 63_000));

        // per-user calendar leases are independent of the jobs lease
        Assert.True(await b.TryAcquireAsync("calendar:u1", ttl, CancellationToken.None, t0 + 30_000 + 63_000));
    }

    [Fact]
    public async Task ConcurrentTake_IsSerialisedByTheVersionToken()
    {
        using var f = new ApiFactory();
        using (var s = f.Services.CreateScope())
        {
            var db = s.ServiceProvider.GetRequiredService<AppDb>();
            db.Leases.Add(new LeaseRow { Name = "race", Owner = "old", ExpiresAt = 0, Version = 1 });
            await db.SaveChangesAsync();
        }
        // two contexts read the same expired row and both try to take it
        using var s1 = f.Services.CreateScope();
        using var s2 = f.Services.CreateScope();
        var db1 = s1.ServiceProvider.GetRequiredService<AppDb>();
        var db2 = s2.ServiceProvider.GetRequiredService<AppDb>();
        var r1 = await db1.Leases.SingleAsync(l => l.Name == "race");
        var r2 = await db2.Leases.SingleAsync(l => l.Name == "race");
        r1.Owner = "one"; r1.ExpiresAt = 10; r1.Version++;
        r2.Owner = "two"; r2.ExpiresAt = 10; r2.Version++;
        await db1.SaveChangesAsync();
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => db2.SaveChangesAsync());
    }

    [Fact]
    public async Task Health_ReportsInstanceAndLeadership()
    {
        using var f = new ApiFactory();
        var c = f.CreateClient();
        var h = await c.GetFromJsonAsync<Dictionary<string, System.Text.Json.JsonElement>>("/health");
        Assert.True(h!["ok"].GetBoolean());
        Assert.False(string.IsNullOrEmpty(h["instance"].GetString()));
        Assert.True(h["leader"].GetBoolean()); // leases disabled in tests → every instance is a leader
    }
}
