using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using YamlDotNet.Serialization;

namespace Umbraco.Community.Handbook;

public sealed record DocumentNode(string Path, string Parent, string Title, string? Description, double? Order, bool IsFolder, bool HasChildren);
public sealed record DocumentPage(string Path, string SourcePath, string Title, string? Description, string Body, bool InvalidMetadata, bool IsOverview, IReadOnlyList<DocumentNode> Children);
public sealed record DocumentAsset(byte[] Bytes, string ContentType);
public sealed class HandbookException(string code) : Exception(code) { public string Code { get; } = code; }

public sealed class DocumentService(string? root, ILogger<DocumentService> logger)
{
    private const int MaxDocumentBytes = 4 * 1024 * 1024;
    private static readonly Regex Frontmatter = new(@"\A\uFEFF?---[^\S\r\n]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[^\S\r\n]*(?:\r?\n|$)", RegexOptions.Compiled, TimeSpan.FromSeconds(1));
    private static readonly IDeserializer Yaml = new DeserializerBuilder().WithDuplicateKeyChecking().Build();
    private static readonly IReadOnlyDictionary<string, string> ImageTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    { [".png"] = "image/png", [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg", [".gif"] = "image/gif", [".webp"] = "image/webp", [".avif"] = "image/avif" };

    public IReadOnlyList<DocumentNode> GetTree() => Protect(() =>
    {
        var nodes = new List<DocumentNode>();
        var count = 0;
        Scan(Resolve(""), "", nodes, ref count);
        return Sort(nodes);
    });

    private void Scan(string directory, string relative, List<DocumentNode> nodes, ref int count)
    {
        foreach (var entry in Directory.EnumerateFileSystemEntries(directory))
        {
            if (++count > 10000) throw new HandbookException("tooLarge");
            if ((File.GetAttributes(entry) & FileAttributes.ReparsePoint) != 0) continue;
            var name = Path.GetFileName(entry);
            var path = relative.Length == 0 ? name : relative + "/" + name;
            if (Directory.Exists(entry))
            {
                var start = nodes.Count;
                Scan(entry, path, nodes, ref count);
                if (nodes.Count > start || Readme(entry) is not null)
                {
                    var readme = Readme(entry);
                    var page = readme is null ? null : ReadDocument(readme, path);
                    nodes.Add(new(path, relative, page?.Title ?? name, page?.Description, ReadOrder(readme), true, nodes.Count > start));
                }
            }
            else if (IsMarkdown(name) && !IsReadme(name))
            {
                var page = ReadDocument(entry, path);
                nodes.Add(new(path, relative, page.Title, page.Description, ReadOrder(entry), false, false));
            }
        }
    }

    public DocumentPage GetPage(string path) => Protect(() =>
    {
        var full = Resolve(path);
        if (File.Exists(full))
        {
            if (!IsMarkdown(full)) throw new HandbookException("notFound");
            // README has one canonical route: its containing folder.
            if (IsReadme(Path.GetFileName(full))) return GetPage(Parent(path));
            return ReadDocument(full, path);
        }
        if (!Directory.Exists(full)) throw new HandbookException("notFound");
        var readme = Readme(full);
        var children = GetTree().Where(n => n.Parent == path).ToArray();
        if (readme is not null)
        {
            var page = ReadDocument(readme, path);
            return page with { SourcePath = path.Length == 0 ? Path.GetFileName(readme) : path + "/" + Path.GetFileName(readme), Children = children };
        }
        return new(path, path.Length == 0 ? "README.md" : path + "/README.md", path.Length == 0 ? "" : path.Split('/').Last(), null, "", false, true, children);
    });

    public DocumentAsset GetAsset(string path) => Protect(() =>
    {
        if (!ImageTypes.TryGetValue(Path.GetExtension(path), out var contentType)) throw new HandbookException("notFound");
        var full = Resolve(path);
        if (!File.Exists(full)) throw new HandbookException("notFound");
        if (new FileInfo(full).Length > 20 * 1024 * 1024) throw new HandbookException("tooLarge");
        return new DocumentAsset(File.ReadAllBytes(full), contentType);
    });

    private string Resolve(string path)
    {
        if (string.IsNullOrWhiteSpace(root)) throw new HandbookException("notConfigured");
        if (path.IndexOfAny(['\\', '\0', ':']) >= 0 || Path.IsPathRooted(path) || path.Split('/').Any(p => p is "." or "..")) throw new HandbookException("invalidPath");
        var basePath = Path.GetFullPath(root);
        if (!Directory.Exists(basePath)) throw new HandbookException("missingDirectory");
        var full = Path.GetFullPath(Path.Combine(basePath, path));
        if (full != basePath && !full.StartsWith(Path.TrimEndingDirectorySeparator(basePath) + Path.DirectorySeparatorChar, OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal)) throw new HandbookException("invalidPath");
        // Reject links in the root's ancestors too: otherwise the configured root could already escape through one.
        for (var item = new DirectoryInfo(basePath); item is not null; item = item.Parent)
            if ((item.Attributes & FileAttributes.ReparsePoint) != 0) throw new HandbookException("invalidPath");
        var current = basePath;
        foreach (var part in path.Split('/', StringSplitOptions.RemoveEmptyEntries))
        {
            current = Path.Combine(current, part);
            if (Path.Exists(current) && (File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0) throw new HandbookException("invalidPath");
        }
        return full;
    }

    private static bool IsMarkdown(string path) => Path.GetExtension(path).Equals(".md", StringComparison.OrdinalIgnoreCase) || Path.GetExtension(path).Equals(".markdown", StringComparison.OrdinalIgnoreCase);
    private static bool IsReadme(string name) => name.Equals("README.md", StringComparison.OrdinalIgnoreCase);
    private static string Parent(string path) => path.Contains('/') ? path[..path.LastIndexOf('/')] : "";
    private static string? Readme(string directory)
    {
        var matches = Directory.EnumerateFiles(directory).Where(f => IsReadme(Path.GetFileName(f))).ToArray();
        if (matches.Length > 1) throw new HandbookException("duplicateReadme");
        var match = matches.SingleOrDefault();
        if (match is not null && (File.GetAttributes(match) & FileAttributes.ReparsePoint) != 0) throw new HandbookException("invalidPath");
        return match;
    }

    private static (string Body, Dictionary<string, object> Metadata, bool Invalid) ReadContent(string full)
    {
        if (new FileInfo(full).Length > MaxDocumentBytes) throw new HandbookException("tooLarge");
        var text = File.ReadAllText(full);
        var match = Frontmatter.Match(text);
        if (!match.Success) return (text, [], false);
        var body = text[match.Length..];
        try
        {
            if (match.Groups[1].Length > 65536) return (body, [], true);
            var parser = new YamlDotNet.Core.Parser(new StringReader(match.Groups[1].Value));
            var depth = 0;
            while (parser.MoveNext())
            {
                if (parser.Current is YamlDotNet.Core.Events.AnchorAlias) return (body, [], true);
                if (parser.Current is YamlDotNet.Core.Events.MappingStart or YamlDotNet.Core.Events.SequenceStart) depth++;
                if (parser.Current is YamlDotNet.Core.Events.MappingEnd or YamlDotNet.Core.Events.SequenceEnd) depth--;
                if (depth > 16) return (body, [], true);
            }
            return (body, Yaml.Deserialize<Dictionary<string, object>>(match.Groups[1].Value) ?? [], false);
        }
        catch (YamlDotNet.Core.YamlException) { return (body, [], true); }
    }

    private static double? ReadOrder(string? full)
    {
        if (full is null) return null;
        var content = ReadContent(full);
        return content.Metadata.TryGetValue("order", out var value) && double.TryParse(Convert.ToString(value, CultureInfo.InvariantCulture), NumberStyles.Float, CultureInfo.InvariantCulture, out var order) && double.IsFinite(order) ? order : null;
    }

    private static DocumentPage ReadDocument(string full, string path)
    {
        var (body, metadata, invalid) = ReadContent(full);
        string? Text(string key) => metadata.TryGetValue(key, out var value) && value is string text && !string.IsNullOrWhiteSpace(text) ? text.Trim() : null;
        var heading = Regex.Match(body, @"(?m)^ {0,3}#\s+(.+?)\s*#*\s*$", RegexOptions.None, TimeSpan.FromSeconds(1));
        var title = Text("title") ?? (heading.Success ? heading.Groups[1].Value : IsReadme(Path.GetFileName(full)) ? path.Split('/').Last() : Path.GetFileNameWithoutExtension(full));
        return new(path, path, title, Text("description"), body, invalid, false, []);
    }

    private static List<DocumentNode> Sort(IEnumerable<DocumentNode> nodes) => nodes.OrderBy(n => n.Order ?? double.PositiveInfinity).ThenBy(n => n.Title, StringComparer.Create(CultureInfo.GetCultureInfo("en"), CompareOptions.IgnoreCase | CompareOptions.NumericOrdering)).ThenBy(n => n.Path, StringComparer.Ordinal).ToList();
    private T Protect<T>(Func<T> action)
    {
        try { return action(); }
        catch (HandbookException) { throw; }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or ArgumentException or System.Security.SecurityException)
        {
            logger.LogWarning(ex, "Handbook could not read the configured documentation source");
            throw new HandbookException("readError");
        }
    }
}
