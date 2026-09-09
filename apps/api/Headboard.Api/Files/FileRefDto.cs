using System.Text.Json.Serialization;
using Headboard.Api.Data;

namespace Headboard.Api.Files;

/// <summary>Wire shape of core <c>FileRef</c>: size/src are optional in TS, so they are omitted when null.</summary>
public class FileRefDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Kind { get; set; } = "file";
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public long? Size { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] public string? Src { get; set; }

    public static FileRefDto From(FileRow f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        Kind = f.Kind,
        Size = f.Size,
        Src = f.Kind == "img" ? $"/files/{f.Id}/content" : null,
    };
}
