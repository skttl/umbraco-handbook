# Handbook

Display your own Markdown documentation inside the Umbraco backoffice.

Handbook adds a native read-only section with a navigation tree. You write the documentation in Markdown files; Handbook displays it to your editors.

## Install

```sh
dotnet add package Umbraco.Community.Handbook --version 18.0.0
```

Use 17.x for Umbraco 17, or 18.x for Umbraco 18. Configure one directory in appsettings.json:

```json
{
  "Umbraco": {
    "Community": {
      "Handbook": {
        "DocumentationPath": "Documentation"
      }
    }
  }
}
```

Relative paths resolve from the application content root. Absolute paths are supported. Deploy this directory with your application and keep it outside publicly served directories such as wwwroot. The account running Umbraco needs read access. The package includes configuration autocomplete for supporting editors.

At first installation, Administrators, Editors, Writers and Translators receive section access. You can change this under Users / User Groups. Later starts or upgrades preserve your changes. Custom groups need manual access. Everyone with section access can read the entire configured documentation directory.

## Write a handbook

```text
Documentation/
  README.md
  posts/
    README.md
    create.md
  publishing/
    workflow.md
  images/
    example.png
```

A folder's README.md is its page and is not listed twice. Without a README, the folder displays an overview of its immediate children. README recognition is case-insensitive. Asset-only folders do not clutter the tree. Files ending .md and .markdown are supported; index.md is an ordinary page.

Optional YAML frontmatter:

```yaml
---
title: Create a post
description: Prepare your first story for publication.
order: 10
---
```

Title falls back to the first H1, then the filename. A folder uses its README title, otherwise its directory name. Numeric order values sort first, followed by natural title order. Set a folder's order on its README. Metadata is not displayed as document text. Invalid metadata shows a notice while leaving the body readable where possible. YAML aliases are not supported.

Relative links such as `[Publishing](../publishing/workflow.md#approval-flow)` and images such as `![Example](../images/example.png)` work within the documentation root. Root-relative links also resolve inside that root. A README link opens its folder page. Standard Markdown, tables, task lists, code blocks and Mermaid code fences are supported. Heading anchors follow GitHub-style slugging. External web and email links are supported. Images must be local PNG, JPEG, GIF, WebP or AVIF; active SVG and remote images are not loaded.

Reopen a page to read changed content. Leave and reenter the section to refresh navigation. File changes need no restart; changing DocumentationPath requires one.

## Languages and limits

The interface supports English, Danish, German, French, Spanish, Italian, Swedish, Norwegian Bokmål and Dutch. It follows your backoffice language, with English fallback. Document content stays in its authored language.

Handbook is a reader. It does not edit files, publish documentation, translate content or provide search. Keep sources reasonably small: a document may be up to 4 MiB, an image up to 20 MiB, and directory navigation scans up to 10,000 filesystem entries. Symbolic links and directory junctions are rejected. HTML is sanitized and Mermaid uses strict security settings.
