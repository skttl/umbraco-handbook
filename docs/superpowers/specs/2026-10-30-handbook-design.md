# Handbook design

Date: 2026-10-30. Status: approved by the user; implementation authorized.

## Purpose

Handbook displays a site's own Markdown documentation inside the Umbraco backoffice. Its primary audience is content editors. Installing the package and configuring one documentation directory must be sufficient to make the documents available through a native section and navigation tree.

The package does not supply a universal Umbraco manual. Its Marketplace description is: "Display your own Markdown documentation inside the Umbraco backoffice."

## Agreed identity and versions

- Marketplace title: Handbook.
- Package ID: Umbraco.Community.Handbook.
- Repository: https://github.com/skttl/umbraco-handbook.
- First releases: 17.0.0 for Umbraco 17 and 18.0.0 for Umbraco 18.
- Follow Unlog's branch model: main targets 18, v17/main targets 17, with matching bounded Umbraco dependency ranges.
- Package icon: Lucide book-open, light gold #FFE0A3 on terracotta #A44732. Include the applicable icon license. Backoffice icons follow the Umbraco theme.

## Approaches

The user chose a native Umbraco section, tree and document workspace. It best satisfies the requirement for native appearance, routing and navigation. Use Umbraco extension points, layouts, UI components and theme tokens rather than reproducing the backoffice shell.

An embedded documentation application based on Studyhall was considered. It could reuse more UI, but would require separate work to match Umbraco's navigation and appearance. It was not selected. Studyhall remains the reference for document semantics and rendering, not an application to embed.

## User experience

The section is Handbook in English and localized in each supported backoffice language. Its left navigation tree shows the documentation directory hierarchy. Clicking a document opens it on the right. Folder labels and their expand controls support separate navigation and expansion, with keyboard access and clear selection state.

A README.md in any folder is that folder's page, including the configured root. It does not appear as an additional child document. Without a README, the folder opens an automatically generated overview of immediate child pages and folders. Use titles and optional descriptions in overview links. The root opens its README or generated overview when entering the section.

Document titles use frontmatter title, then the first H1, then the filename without extension. Descriptions come from frontmatter description. Folder titles use README metadata/H1 where present, otherwise the folder name. The root's fallback title is the translated section name.

Proposed implementation defaults: README recognition is case-insensitive; both .md and .markdown files are supported; index.md is an ordinary document. Duplicate README candidates in one folder produce a clear source error rather than selecting unpredictably. Navigation contains only documents and folders with documents, excluding asset-only folders.

Use optional numeric frontmatter order for sibling ordering, including folders through their README. Explicitly ordered items precede unordered items; ties and unordered items sort naturally by visible title, then path for stability. Metadata is optional. An invalid metadata block shows a localized notice while preserving a readable body where possible. These precise sorting rules are implementation proposals, not previously confirmed user requirements.

## Configuration and document access

Proposed setting: Umbraco:Community:Handbook:DocumentationPath. This is the sole package option. Resolve relative paths against the application's content root; accept absolute paths. Ship a JSON schema with the Unlog-style buildTransitive registration.

An absent setting, nonexistent directory, empty directory or unreadable file must produce a useful localized state and an appropriate server log, without preventing the rest of Umbraco from starting. Return no physical paths or credentials in client-facing errors.

The server reads files through authenticated Management API endpoints, which also enforce Handbook section access. Files must remain inside the configured root after normalization. Reject traversal and symlink/reparse-point escapes. Do not expose the documentation directory as a public static file root. Asset endpoints permit only supported image types needed by documentation and apply the same authorization and containment rules.

All users with section access can read all documents in the root. Per-document authorization is outside scope. Relative document links, folder links, image links and heading anchors resolve relative to the current source file; root-relative documentation links resolve inside the documentation root. External web links remain external. Unsafe URL schemes are blocked. Missing internal targets show a useful state. Stable backoffice document routes support direct links and browser history.

## Rendering

Support Markdown/GFM including tables, code blocks, lists, local images and heading links. Use maintained parsing and HTML sanitization libraries, not custom security parsers. Keep reading styles consistent with Umbraco's light/dark themes and responsive workspace layout. Prevent wide tables, code and diagrams from breaking the workspace.

Include Mermaid from the first release. Load it when needed, use strict security settings and display a localized fallback with readable diagram source on errors. Markdown HTML and diagram output must not execute arbitrary scripts or active embedded content. Local SVG files must not be injected as active HTML.

No editing, publishing, search, multiple documentation roots, ZIP import, bookmarks or document translation in the first version. Studyhall's own source currently has no selected license, so do not copy its code without settling permission; use its behavior as reference and reuse independently licensed dependencies.

## Refresh behavior

Read a document again whenever its page is opened. Rebuild navigation when entering the section. An already open page does not update automatically. No file watcher or persistent document index is required. Changing the configured directory may require restarting the application; changing documentation files does not.

## Default access

An installation migration grants Handbook access to the standard Administrators, Editors, Writers and Translators groups, identified by their stable group keys. Do not modify Sensitive data or custom groups. Preserve other group settings and tolerate deleted standard groups.

Record migration completion once per database using a stable package migration identity shared across the 17 and 18 lines. Subsequent startups and upgrades must not restore access deliberately removed by an administrator. The first installation must grant access after Umbraco has created its standard groups, including unattended installation of the testsite. Verify both fresh installs and the 17-to-18 upgrade behavior.

## Localization

Translate every package-owned label, overview, empty state and error message from the outset. English is the fallback. Documents, titles and diagram content retain their authored language.

| Language | Section name |
| --- | --- |
| English | Handbook |
| Danish | Håndbog |
| German | Handbuch |
| French | Manuel |
| Spanish | Manual |
| Italian | Manuale |
| Swedish | Handbok |
| Norwegian Bokmål | Håndbok |
| Dutch | Handboek |

Use the locale identifiers and localization registration supported by each target Umbraco version. Locale wording remains subject to review.

## Repository and packaging

Follow https://github.com/skttl/umbraco-unlog for source/tests separation, root developer README, docs/nuget-readme.md packaged as README.md, separate umbraco-marketplace-readme.md, umbraco-marketplace.json, icon, screenshots, configuration schema and buildTransitive integration. Adapt all package-specific content.

Add a backoffice client project and sample/testsite. Build and package compiled client assets with the NuGet library. Do not ship the testsite, its database or development login in the package. Pin client and server dependencies to the corresponding Umbraco major. Verify the actual 17/18 APIs rather than applying one version's examples to both.

CI builds the client and server and runs meaningful tests. Tag publishing follows Unlog's branch/version/package-content validation and trusted publishing approach, with Handbook identity. GitHub environment and NuGet trust configuration remain account setup actions. Publishing is not authorized by this design.

## Testsite and example handbook

Include one runnable testsite on each version branch, referencing the package project directly. Use unattended local SQLite setup and a documented development administrator so no installation wizard is necessary. Scope unattended credentials to Development configuration and exclude generated databases and secrets from Git.

Use Clean Starter Kit: its 7.x line for Umbraco 17 and 8.x line for Umbraco 18. Confirm compatible concrete versions during implementation. Clean is a testsite dependency only. Any remaining Clean post-install publish steps must be automated or clearly documented; do not promise a ready frontend if setup is incomplete.

Ship original sample Markdown about using the Clean demo, covering news/blog posts, image selection, links, previews and publishing. Include nested folders with and without README, title/description/order metadata, relative images and links, heading anchors, a table and a Mermaid approval flow. Provide original local image assets. Choose English sample content as an implementation default; it is not nine translations of the documentation.

## Verification and boundaries

Verify both version lines through build/package inspection and running backoffice checks. Meaningful focused checks cover path containment and authorization, metadata/navigation behavior, README/overview semantics, links and sanitization, and the once-only access migration. Ensure all nine locale dictionaries contain the same required keys.

Exercise the testsite through install, login, section/tree navigation, README and generated overview, local images, internal links, Mermaid success/failure, file changes and access denial. Check keyboard use and both themes. Preserve administrator changes on restart and the 17-to-18 upgrade. Report checks that cannot run rather than claiming coverage.

## References and implementation status

- Studyhall was inspected locally for file conventions and rendering behavior; it is not a build or runtime dependency.
- Repository structure reference: https://github.com/skttl/umbraco-unlog.
- Handbook repository: https://github.com/skttl/umbraco-handbook.

Implementation and verification are recorded in docs/verification/implementation.md. The approved plan is in docs/superpowers/plans/2026-10-30-handbook.md.
