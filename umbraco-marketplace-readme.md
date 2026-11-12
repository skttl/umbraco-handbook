# Handbook

Display your own Markdown documentation inside the Umbraco backoffice.

Keep your editors' guides alongside your project and make them available where editors work. Handbook adds a native section with a familiar navigation tree and readable pages.

- One documentation directory configured in appsettings.
- Folders become navigation, with README introductions or automatic page overviews.
- Markdown tables, images, links and Mermaid diagrams.
- Optional page titles, descriptions and ordering in frontmatter.
- Interface in English, Danish, German, French, Spanish, Italian, Swedish, Norwegian Bokmål and Dutch.
- Default access for Administrators, Editors, Writers and Translators, adjustable through Umbraco's user groups.

Install `Umbraco.Community.Handbook`, choosing 17.x for Umbraco 17, 18.x for Umbraco 18 or 19.x for Umbraco 19. The v19 release candidate requires Umbraco 19 RC1 or newer and .NET 11. Add your documentation folder:

```json
{"Umbraco":{"Community":{"Handbook":{"DocumentationPath":"Documentation"}}}}
```

You supply the documentation. Handbook displays it read-only. See the [installation and authoring guide](https://github.com/skttl/umbraco-handbook/blob/main/docs/nuget-readme.md) for file conventions and supported formats.
