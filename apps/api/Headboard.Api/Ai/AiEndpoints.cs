namespace Headboard.Api.Ai;

public record ExtractRequest(string? Text, List<ExtractProject>? Projects);
public record DigestRequest(DigestStatsDto? Stats, string? Lang);

public static class AiEndpoints
{
    public static IEndpointRouteBuilder MapAi(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/ai").RequireAuthorization();

        // POST /ai/extract {text, projects:[{id,name}]} -> CaptureItem[]
        g.MapPost("/extract", async (ExtractRequest body, AnthropicClient ai, ILoggerFactory lf, CancellationToken ct) =>
        {
            if (!ai.IsConfigured) return Unavailable();
            if (string.IsNullOrWhiteSpace(body.Text)) return Results.BadRequest(new { error = "text_required" });
            var projects = body.Projects ?? [];
            try
            {
                var raw = await ai.CompleteAsync(Prompts.Extract(body.Text, projects.Select(p => p.Name)), ct);
                return Results.Ok(Prompts.ParseExtractResponse(raw, projects));
            }
            catch (Exception e) when (e is AnthropicException or HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
            {
                lf.CreateLogger("Ai").LogWarning(e, "ai/extract failed");
                return Results.Json(new { error = "ai_failed" }, statusCode: 502);
            }
        });

        // POST /ai/digest {stats:{dueN,dueFirst,staleN,oldT,oldI,doneW,focusN,recN}, lang} -> {text}
        g.MapPost("/digest", async (DigestRequest body, AnthropicClient ai, ILoggerFactory lf, CancellationToken ct) =>
        {
            if (!ai.IsConfigured) return Unavailable();
            if (body.Stats is null) return Results.BadRequest(new { error = "stats_required" });
            try
            {
                var text = await ai.CompleteAsync(Prompts.Digest(body.Stats, body.Lang), ct);
                return Results.Ok(new { text = text.Trim() });
            }
            catch (Exception e) when (e is AnthropicException or HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
            {
                lf.CreateLogger("Ai").LogWarning(e, "ai/digest failed");
                return Results.Json(new { error = "ai_failed" }, statusCode: 502);
            }
        });

        return app;
    }

    /// <summary>No API key configured: clients fall back to heuristicExtract / cannedDigest locally.</summary>
    private static IResult Unavailable() => Results.Json(new { error = "ai_unavailable" }, statusCode: 503);
}
