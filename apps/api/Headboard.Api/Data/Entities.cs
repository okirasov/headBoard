namespace Headboard.Api.Data;

public class UserRow
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public string Initials { get; set; } = "";
    public long CreatedAt { get; set; }
}

public class ProjectRow
{
    public string Id { get; set; } = "";
    public Guid UserId { get; set; }
    public string Name { get; set; } = "";
    public string Color { get; set; } = "";
}

public class TaskRow
{
    public string Id { get; set; } = "";
    public Guid UserId { get; set; }
    public string Title { get; set; } = "";
    public string? ProjectId { get; set; }
    public int Priority { get; set; } = 1;
    public string Status { get; set; } = "inbox";
    public long Touched { get; set; }
    public long Created { get; set; }
    public long? Due { get; set; }
    public long SnoozedUntil { get; set; }
    public string? Recur { get; set; }
    public string TagsJson { get; set; } = "[]";
    public string Note { get; set; } = "";
    public string? Chat { get; set; }
    public long? DoneAt { get; set; }
    public long? ArchivedAt { get; set; }
    /// <summary>Google Calendar event id when the task is mirrored, and the hash of what was last pushed.</summary>
    public string? CalendarEventId { get; set; }
    public string? CalendarHash { get; set; }
}

public class CommentRow
{
    public string Id { get; set; } = "";
    public string TaskId { get; set; } = "";
    public Guid UserId { get; set; }
    public string Text { get; set; } = "";
    public long At { get; set; }
}

public class FileRow
{
    public string Id { get; set; } = "";
    public Guid UserId { get; set; }
    public string? TaskId { get; set; }
    public string? ProjectId { get; set; }
    public string Name { get; set; } = "";
    public string Kind { get; set; } = "file";
    public long? Size { get; set; }
    public string? StoragePath { get; set; }
    public string? ContentType { get; set; }
}

public class SettingsRow
{
    public Guid UserId { get; set; }
    public string Lang { get; set; } = "en";
    public string Theme { get; set; } = "light";
    public bool ShowDone { get; set; } = true;
    public string? DigestText { get; set; }
    /// <summary>Epoch ms when DigestText last changed (scheduler or client).</summary>
    public long? DigestAt { get; set; }
    /// <summary>IANA time zone for the 08:00 digest.</summary>
    public string? TimeZone { get; set; }
}

/// <summary>Per-user Google Calendar connection: offline refresh token, the dedicated calendar and the incremental sync cursor.</summary>
public class CalendarLinkRow
{
    public Guid UserId { get; set; }
    public string RefreshToken { get; set; } = "";
    public string? AccessToken { get; set; }
    public long? AccessTokenExpiresAt { get; set; }
    public string? CalendarId { get; set; }
    public string? SyncToken { get; set; }
    public long? LastSyncAt { get; set; }
    public string? LastError { get; set; }
    public long ConnectedAt { get; set; }
    /// <summary>JSON array of event ids whose tasks were deleted; removed from the calendar on the next pass.</summary>
    public string PendingDeletesJson { get; set; } = "[]";
}
