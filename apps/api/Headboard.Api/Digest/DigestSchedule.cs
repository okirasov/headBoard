namespace Headboard.Api.Digest;

/// <summary>Pure scheduling rules for the morning digest.</summary>
public static class DigestSchedule
{
    public const int DefaultHour = 8;

    public static bool IsValidTimeZone(string id)
    {
        try { TimeZoneInfo.FindSystemTimeZoneById(id); return true; }
        catch (TimeZoneNotFoundException) { return false; }
        catch (InvalidTimeZoneException) { return false; }
    }

    public static TimeZoneInfo Zone(string? id)
    {
        if (string.IsNullOrWhiteSpace(id)) return TimeZoneInfo.Utc;
        try { return TimeZoneInfo.FindSystemTimeZoneById(id); }
        catch (Exception e) when (e is TimeZoneNotFoundException or InvalidTimeZoneException) { return TimeZoneInfo.Utc; }
    }

    /// <summary>Local calendar date of an epoch-ms instant in the given zone.</summary>
    public static DateOnly LocalDate(long epochMs, TimeZoneInfo tz) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(DateTimeOffset.FromUnixTimeMilliseconds(epochMs), tz).DateTime);

    /// <summary>Start of the local day containing the instant, as epoch ms.</summary>
    public static long StartOfLocalDay(long epochMs, TimeZoneInfo tz)
    {
        var local = TimeZoneInfo.ConvertTime(DateTimeOffset.FromUnixTimeMilliseconds(epochMs), tz);
        var midnight = new DateTimeOffset(local.Year, local.Month, local.Day, 0, 0, 0, local.Offset);
        return midnight.ToUnixTimeMilliseconds();
    }

    /// <summary>
    /// Due when the user's local clock has passed <paramref name="hour"/> today and no digest was produced today.
    /// A client-side regeneration earlier the same day also counts as "produced today".
    /// </summary>
    public static bool IsDue(long nowMs, string? timeZone, long? lastDigestAt, int hour = DefaultHour)
    {
        var tz = Zone(timeZone);
        var local = TimeZoneInfo.ConvertTime(DateTimeOffset.FromUnixTimeMilliseconds(nowMs), tz);
        if (local.Hour < hour) return false;
        if (lastDigestAt is null) return true;
        return LocalDate(lastDigestAt.Value, tz) < DateOnly.FromDateTime(local.DateTime);
    }
}
