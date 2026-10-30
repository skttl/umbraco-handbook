using Microsoft.Extensions.Logging.Abstractions;

namespace Umbraco.Community.Handbook.Tests;

public sealed class DocumentServiceTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "handbook-" + Guid.NewGuid());
    public DocumentServiceTests() => Directory.CreateDirectory(_root);
    private DocumentService Source() => new(_root, NullLogger<DocumentService>.Instance);
    private void Write(string path, string body)
    {
        var full = Path.Combine(_root, path);
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        File.WriteAllText(full, body);
    }

    [Fact]
    public void Readme_is_folder_page_and_not_a_separate_child()
    {
        Write("README.md", "# Welcome");
        Write("guides/README.md", "---\ntitle: Getting started\norder: 2\n---\n# Intro");
        Write("guides/edit.md", "# Edit");
        var source = Source();
        var nodes = source.GetTree();
        Assert.DoesNotContain(nodes, n => n.Path.EndsWith("README.md"));
        Assert.Equal("Getting started", Assert.Single(nodes, n => n.Path == "guides").Title);
        Assert.Equal("# Intro", source.GetPage("guides").Body.Trim());
        Assert.Equal("# Welcome", source.GetPage("").Body.Trim());
    }

    [Fact]
    public void Missing_readme_generates_immediate_child_overview_and_hides_asset_folders()
    {
        Write("guides/deep/page.md", "# Page");
        Write("guides/another.md", "# Another");
        Write("images/test.png", "image");
        var source = Source();
        Assert.DoesNotContain(source.GetTree(), n => n.Path == "images");
        var page = source.GetPage("guides");
        Assert.True(page.IsOverview);
        Assert.Equal(new[] { "guides/another.md", "guides/deep" }, page.Children.Select(n => n.Path));
    }

    [Fact]
    public void Metadata_order_titles_and_fresh_content_are_used()
    {
        Write("z.md", "---\ntitle: First\ndescription: Helpful\norder: 1\n---\n# Body");
        Write("a.md", "# Second");
        Assert.Equal("z.md", Source().GetTree()[0].Path);
        Assert.Equal("Helpful", Source().GetPage("z.md").Description);
        Write("z.md", "# Changed");
        Assert.Equal("Changed", Source().GetPage("z.md").Title);
    }

    [Fact]
    public void Malformed_metadata_keeps_document_body_readable()
    {
        Write("bad.md", "---\ntitle: [broken\n---\n# Still readable");
        var page = Source().GetPage("bad.md");
        Assert.True(page.InvalidMetadata);
        Assert.Equal("# Still readable", page.Body.Trim());
    }

    [Theory]
    [InlineData("../outside.md")]
    [InlineData("/outside.md")]
    [InlineData("a\\b.md")]
    [InlineData("a/../../outside.md")]
    public void Unsafe_paths_are_rejected(string path)
        => Assert.Throws<HandbookException>(() => Source().GetPage(path));

    [Fact]
    public void Missing_configuration_has_a_stable_error_code()
        => Assert.Equal("notConfigured", Assert.Throws<HandbookException>(() => new DocumentService(null, NullLogger<DocumentService>.Instance).GetTree()).Code);

    [UnixFact]
    public void Symbolic_links_are_neither_listed_nor_read()
    {
        Write("actual.md", "# Actual");
        File.CreateSymbolicLink(Path.Combine(_root, "alias.md"), Path.Combine(_root, "actual.md"));
        Assert.DoesNotContain(Source().GetTree(), n => n.Path == "alias.md");
        Assert.Equal("invalidPath", Assert.Throws<HandbookException>(() => Source().GetPage("alias.md")).Code);
    }

    [Fact]
    public void Oversized_document_is_rejected_before_reading_its_body()
    {
        using (var file = File.Create(Path.Combine(_root, "huge.md"))) file.SetLength(4 * 1024 * 1024 + 1);
        Assert.Equal("tooLarge", Assert.Throws<HandbookException>(() => Source().GetPage("huge.md")).Code);
    }

    [Fact]
    public void Readme_without_a_title_uses_the_folder_name()
    {
        Write("guides/README.md", "Just some text.");
        Assert.Equal("guides", Source().GetPage("guides").Title);
        Write("README.md", "Welcome.");
        Assert.Equal("", Source().GetPage("").Title);
    }

    [Fact]
    public void Only_supported_image_assets_are_served()
    {
        Write("secret.json", "secret");
        Assert.Throws<HandbookException>(() => Source().GetAsset("secret.json"));
    }

    public void Dispose() => Directory.Delete(_root, true);
}

public sealed class UnixFactAttribute : FactAttribute
{
    public UnixFactAttribute()
    {
        if (OperatingSystem.IsWindows()) Skip = "Creating symbolic links needs privileges; exercised by Linux CI.";
    }
}
