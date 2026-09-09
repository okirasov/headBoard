namespace Headboard.Api.Files;

/// <summary>Stores blobs under <c>Storage:Root/{userId}/{fileId}</c>; paths persisted relative to the root.</summary>
public class LocalStorage(IConfiguration cfg, IWebHostEnvironment env)
{
    public string Root => Path.GetFullPath(cfg["Storage:Root"] is { Length: > 0 } r ? r : "./storage", env.ContentRootPath);

    public static string RelativePath(Guid userId, string fileId) => Path.Combine(userId.ToString("N"), fileId);

    public async Task<string> SaveAsync(Guid userId, string fileId, Stream content, CancellationToken ct)
    {
        var rel = RelativePath(userId, fileId);
        var full = Path.Combine(Root, rel);
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        await using var fs = new FileStream(full, FileMode.Create, FileAccess.Write, FileShare.None, 64 * 1024, useAsync: true);
        await content.CopyToAsync(fs, ct);
        return rel;
    }

    public Stream? Open(string? relativePath)
    {
        if (string.IsNullOrEmpty(relativePath)) return null;
        var full = Path.Combine(Root, relativePath);
        return File.Exists(full) ? new FileStream(full, FileMode.Open, FileAccess.Read, FileShare.Read, 64 * 1024, useAsync: true) : null;
    }

    public void Delete(string? relativePath)
    {
        if (string.IsNullOrEmpty(relativePath)) return;
        try { File.Delete(Path.Combine(Root, relativePath)); } catch (IOException) { /* best effort */ }
    }
}
