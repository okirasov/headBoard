using System.Text.Json.Nodes;
using Headboard.Api.Data;
using Headboard.Api.Digest;
using Headboard.Api.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Headboard.Api.Calendar;

/// <summary>
/// Two-way reconciliation between a user's tasks and their dedicated "Headboard" Google calendar.
/// Inbound: incremental event listing (syncToken) → due-date moves, title edits, deletions, and foreign events becoming Inbox tasks.
/// Outbound: every mirrored task (due date, not done/archived) has an all-day event; hash mismatch → patch; unmirrored → delete.
/// </summary>
public class CalendarSyncService(AppDb db, GoogleCalendarClient google, ILogger<CalendarSyncService> log)
{
    public const string CalendarSummary = "Headboard";

    public async Task<CalendarLinkRow?> ReconcileUserAsync(Guid uid, long now, CancellationToken ct)
    {
        var link = await db.CalendarLinks.FindAsync([uid], ct);
        if (link is null) return null;
        try
        {
            var access = await AccessTokenAsync(link, now, ct);
            var settings = await db.Settings.FindAsync([uid], ct);
            var tz = DigestSchedule.Zone(settings?.TimeZone);
            if (string.IsNullOrEmpty(link.CalendarId))
            {
                link.CalendarId = await google.CreateCalendarAsync(access, CalendarSummary, settings?.TimeZone, ct);
                link.SyncToken = null;
                await db.SaveChangesAsync(ct);
            }
            var tasks = await db.Tasks.Where(t => t.UserId == uid).ToListAsync(ct);
            await DeletePendingAsync(link, access, ct);
            await InboundAsync(link, access, tasks, tz, now, ct);
            await OutboundAsync(link, access, tasks, tz, ct);
            link.LastSyncAt = now;
            link.LastError = null;
        }
        catch (GoogleApiException e)
        {
            log.LogWarning(e, "Calendar sync failed for {User}", uid);
            link.LastError = e.Status == 401 || e.Status == 403 ? "reauthorize" : "google_" + e.Status;
        }
        catch (HttpRequestException e)
        {
            log.LogWarning(e, "Calendar sync network error for {User}", uid);
            link.LastError = "network";
        }
        await db.SaveChangesAsync(ct);
        return link;
    }

    /// <summary>Events of tasks deleted since the last pass.</summary>
    private async Task DeletePendingAsync(CalendarLinkRow link, string access, CancellationToken ct)
    {
        var pending = TaskMapper.ParseTags(link.PendingDeletesJson);
        if (pending.Count == 0) return;
        foreach (var id in pending) await google.DeleteEventAsync(access, link.CalendarId!, id, ct);
        link.PendingDeletesJson = "[]";
    }

    private async Task<string> AccessTokenAsync(CalendarLinkRow link, long now, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(link.AccessToken) && link.AccessTokenExpiresAt is { } exp && exp - 60_000 > now) return link.AccessToken;
        var t = await google.RefreshAsync(link.RefreshToken, ct);
        link.AccessToken = t.AccessToken;
        link.AccessTokenExpiresAt = now + t.ExpiresIn * 1000L;
        return link.AccessToken!;
    }

    private async Task InboundAsync(CalendarLinkRow link, string access, List<TaskRow> tasks, TimeZoneInfo tz, long now, CancellationToken ct)
    {
        var byEvent = tasks.Where(t => t.CalendarEventId is not null).ToDictionary(t => t.CalendarEventId!);
        var byId = tasks.ToDictionary(t => t.Id);
        string? page = null;
        string? syncToken = link.SyncToken;
        var items = new List<JsonObject>();
        while (true)
        {
            EventsPage p;
            try { p = await google.ListEventsAsync(access, link.CalendarId!, syncToken, page, ct); }
            catch (GoogleApiException e) when (e.Status == 410 && syncToken is not null)
            {
                // sync token expired: fall back to a full listing once
                syncToken = null; page = null; items.Clear();
                continue;
            }
            items.AddRange(p.Items);
            if (p.NextPageToken is null) { link.SyncToken = p.NextSyncToken ?? link.SyncToken; break; }
            page = p.NextPageToken;
        }

        foreach (var ev in items)
        {
            var eventId = ev["id"]?.GetValue<string>();
            if (eventId is null) continue;
            var taskId = EventMapper.TaskIdOf(ev);
            var task = byEvent.GetValueOrDefault(eventId) ?? (taskId is not null ? byId.GetValueOrDefault(taskId) : null);

            if (EventMapper.IsCancelled(ev))
            {
                if (task is not null && task.CalendarEventId == eventId) { task.Due = null; task.CalendarEventId = null; task.CalendarHash = null; task.Touched = now; }
                continue;
            }
            if (task is null)
            {
                // Created directly in the Headboard calendar → new Inbox task carrying the date.
                var due = EventMapper.ParseLocalDate(EventMapper.StartDate(ev), tz);
                var title = ev["summary"]?.GetValue<string>()?.Trim();
                if (due is null || string.IsNullOrEmpty(title)) continue;
                var fresh = new TaskRow
                {
                    Id = Wire.NewId('g'), UserId = link.UserId, Title = title.Length > 90 ? title[..90] : title, Status = "inbox", Priority = 1,
                    Touched = now, Created = now, Due = due, TagsJson = "[]", Note = "", CalendarEventId = eventId,
                };
                fresh.CalendarHash = EventMapper.Hash(fresh, tz);
                db.Tasks.Add(fresh); tasks.Add(fresh); byEvent[eventId] = fresh; byId[fresh.Id] = fresh;
                // link the event back so later listings resolve it by task id
                try { await google.PatchEventAsync(access, link.CalendarId!, eventId, new JsonObject { ["extendedProperties"] = new JsonObject { ["private"] = new JsonObject { [EventMapper.TaskIdKey] = fresh.Id } } }, ct); }
                catch (GoogleApiException e) { log.LogWarning(e, "Could not tag foreign event {Event}", eventId); }
                continue;
            }
            if (task.CalendarEventId is null) { task.CalendarEventId = eventId; }
            // Our own push comes back in the next incremental listing: same fingerprint → nothing to apply.
            if (EventMapper.HashOfEvent(ev) == task.CalendarHash) continue;
            // Otherwise last writer wins: apply the event only when it changed after the task was last touched.
            if (EventMapper.UpdatedMs(ev) >= task.Touched && EventMapper.ApplyInbound(task, ev, tz))
            {
                task.Touched = now;
                task.CalendarHash = EventMapper.Hash(task, tz);
            }
        }
    }

    private async Task OutboundAsync(CalendarLinkRow link, string access, List<TaskRow> tasks, TimeZoneInfo tz, CancellationToken ct)
    {
        foreach (var t in tasks)
        {
            if (EventMapper.ShouldMirror(t))
            {
                var hash = EventMapper.Hash(t, tz);
                if (t.CalendarEventId is null)
                {
                    var created = await google.InsertEventAsync(access, link.CalendarId!, EventMapper.ToEvent(t, tz), ct);
                    t.CalendarEventId = created["id"]?.GetValue<string>();
                    t.CalendarHash = hash;
                }
                else if (t.CalendarHash != hash)
                {
                    try { await google.PatchEventAsync(access, link.CalendarId!, t.CalendarEventId, EventMapper.ToEvent(t, tz), ct); }
                    catch (GoogleApiException e) when (e.Status is 404 or 410)
                    {
                        var created = await google.InsertEventAsync(access, link.CalendarId!, EventMapper.ToEvent(t, tz), ct);
                        t.CalendarEventId = created["id"]?.GetValue<string>();
                    }
                    t.CalendarHash = hash;
                }
            }
            else if (t.CalendarEventId is not null)
            {
                await google.DeleteEventAsync(access, link.CalendarId!, t.CalendarEventId, ct);
                t.CalendarEventId = null;
                t.CalendarHash = null;
            }
        }
    }

    /// <summary>Removes the connection and revokes the Google token; mirrored events stay in the user's calendar.</summary>
    public async Task DisconnectAsync(Guid uid, CancellationToken ct)
    {
        var link = await db.CalendarLinks.FindAsync([uid], ct);
        if (link is null) return;
        try { await google.RevokeAsync(link.RefreshToken, ct); } catch (HttpRequestException) { /* best effort */ }
        db.CalendarLinks.Remove(link);
        foreach (var t in await db.Tasks.Where(t => t.UserId == uid && t.CalendarEventId != null).ToListAsync(ct)) { t.CalendarEventId = null; t.CalendarHash = null; }
        await db.SaveChangesAsync(ct);
    }
}
