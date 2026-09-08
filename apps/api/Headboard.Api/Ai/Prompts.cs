using System.Text.Json;

namespace Headboard.Api.Ai;

/// <summary>Project reference as sent by clients: <c>{id, name}</c>.</summary>
public record ExtractProject(string Id, string Name);

/// <summary>Wire shape of core <c>CaptureItem</c>.</summary>
public record CaptureItemDto(string Title, int Pr, List<string> Tags, string? Proj);

/// <summary>Body of <c>POST /ai/digest</c>: the numeric/string part of core <c>DigestStats</c>.</summary>
public record DigestStatsDto(int DueN, string? DueFirst, int StaleN, string? OldT, int OldI, int DoneW, int FocusN, int RecN);

/// <summary>
/// Prompts and parsing reproduced verbatim from packages/core/src/capture.ts (extractPrompt, parseExtractResponse)
/// and packages/core/src/digest.ts (digestPrompt) so web, mobile and api agree.
/// </summary>
public static class Prompts
{
    public static string Extract(string text, IEnumerable<string> projectNames)
    {
        var pn = string.Join(", ", projectNames.Select(n => "\"" + n + "\""));
        return "Extract actionable tasks from the text below. Respond with ONLY a JSON array, no prose. Each item: {\"title\": short imperative string in the same language as the input, \"priority\": 0|1|2 (0=high, 1=medium, 2=low), \"tags\": array of 0-2 lowercase single words, \"project\": one of [" + pn + "] or null}.\n\nTEXT:\n" + text;
    }

    public static string Digest(DigestStatsDto s, string? lang)
    {
        var langReq = lang == "ru" ? " Answer in Russian." : "";
        return "You write a terse daily digest for a personal task board. Stats: " + s.DueN + " due today (" + s.DueFirst + "); " + s.StaleN + " forgotten tasks, oldest \"" + s.OldT + "\" idle " + s.OldI + " days; " + s.DoneW + " completed in the last week; " + s.FocusN + " in focus. Write 2-3 plain sentences, direct, second person, no emoji, no markdown, no preamble." + langReq;
    }

    /// <summary>
    /// parseExtractResponse: slice from the first '[' to the last ']', JSON-parse, then per item
    /// title = String(title || '').slice(0, 90); pr = clamp(Number(priority) || 0); tags = first 2 as strings;
    /// proj = project whose name === project, else null; drop empty titles. Returns [] on any failure.
    /// </summary>
    public static List<CaptureItemDto> ParseExtractResponse(string raw, IReadOnlyList<ExtractProject> projects)
    {
        try
        {
            var start = raw.IndexOf('[');
            var end = raw.LastIndexOf(']');
            if (start < 0 || end < start) return [];
            using var doc = JsonDocument.Parse(raw[start..(end + 1)]);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return [];

            var items = new List<CaptureItemDto>();
            foreach (var x in doc.RootElement.EnumerateArray())
            {
                if (x.ValueKind != JsonValueKind.Object) continue;
                var title = JsStringOrEmpty(x.TryGetProperty("title", out var t) ? t : default);
                if (title.Length > 90) title = title[..90];
                if (title.Length == 0) continue;

                var pr = Math.Clamp(JsNumberOrZero(x.TryGetProperty("priority", out var p) ? p : default), 0, 2);

                var tags = x.TryGetProperty("tags", out var tg) && tg.ValueKind == JsonValueKind.Array
                    ? tg.EnumerateArray().Take(2).Select(JsString).ToList()
                    : [];

                string? proj = null;
                if (x.TryGetProperty("project", out var pj) && pj.ValueKind == JsonValueKind.String)
                {
                    var name = pj.GetString();
                    proj = projects.FirstOrDefault(pp => pp.Name == name)?.Id;
                }

                items.Add(new CaptureItemDto(title, pr, tags, proj));
            }
            return items;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    /// <summary>String(v || '') — falsy values (missing, null, "", 0, false) become "".</summary>
    private static string JsStringOrEmpty(JsonElement v) => v.ValueKind switch
    {
        JsonValueKind.String => v.GetString() ?? "",
        JsonValueKind.Number => v.GetDouble() == 0 ? "" : JsString(v),
        JsonValueKind.True => "true",
        _ => v.ValueKind is JsonValueKind.Object or JsonValueKind.Array ? JsString(v) : "",
    };

    /// <summary>String(v) for a JSON value, approximating JavaScript's conversions.</summary>
    private static string JsString(JsonElement v) => v.ValueKind switch
    {
        JsonValueKind.String => v.GetString() ?? "",
        JsonValueKind.Number => v.GetRawText(),
        JsonValueKind.True => "true",
        JsonValueKind.False => "false",
        JsonValueKind.Null => "null",
        JsonValueKind.Array => string.Join(",", v.EnumerateArray().Select(JsString)),
        JsonValueKind.Object => "[object Object]",
        _ => "undefined",
    };

    /// <summary>(Number(v) || 0) | 0 — NaN and non-numeric become 0, fractions truncate toward zero.</summary>
    private static int JsNumberOrZero(JsonElement v)
    {
        double d = v.ValueKind switch
        {
            JsonValueKind.Number => v.GetDouble(),
            JsonValueKind.String => double.TryParse(v.GetString(), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var parsed) ? parsed : double.NaN,
            JsonValueKind.True => 1,
            JsonValueKind.False or JsonValueKind.Null => 0,
            _ => double.NaN,
        };
        if (double.IsNaN(d) || double.IsInfinity(d)) return 0;
        return (int)Math.Clamp(Math.Truncate(d), int.MinValue, int.MaxValue);
    }
}
