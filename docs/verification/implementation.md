# Implementation verification ledger

## 18 line

- Approved design: docs/superpowers/specs/2026-10-30-handbook-design.md.
- Native tree, folder overview, README, local authenticated image, internal document links and Mermaid with labels verified in the running Umbraco backoffice.
- 16 .NET tests pass, one symlink test requires Linux CI because Windows lacks the creation privilege. Five client tests pass.
- Actual SQLite database confirmed section access on admin/editor/writer/translator only and stable migration key Umbraco.Core.Upgrader.State+Umbraco.Community.Handbook = handbook-initial-access-v1.
- Anonymous image endpoint responds 401.
- NuGet package created and inspected: compiled client, manifest, dependency license texts, readme, icon, schema and targets included. Demo settings/databases excluded.
- actionlint 1.7.7 passed both workflows.
- Production npm audit clean after Mermaid 12.2 update. NuGet restore clean after patched transitive overrides.
- Implementation ruling: Clean needs InMemoryAuto with DevelopmentMode.Backoffice, and template-style disabled Razor build/publish compilation. Patched ImageSharp 3.2 requires a Six Labors license for Release demo builds; demo CI builds Debug. Handbook package has no ImageSharp dependency of its own.
- Final review: fixed configured backoffice paths and added delayed-response/disconnect regressions. Reviewer found no remaining important issue.

## 17 line and upgrade

- Library compiled against Umbraco API 17.0.0; actual testsite used Umbraco 17.7.1 and Clean 7.0.7. The 18 testsite used Umbraco 18.2.1 and Clean 8.0.1.
- Separate Swagger registration/security/operation-ID handler and manual generated-client auth configuration are required on 17. Tree paging is compatible with both majors.
- Actual 17 backoffice verified login, native tree, README, internal links, protected local image (960px original), Mermaid diagram and localized Danish error/source fallback for a deliberately invalid diagram. Temporary invalid content was restored.
- Danish section name Håndbog verified in the actual backoffice. All nine dictionaries have matching keys; translations have not received native-speaker review.
- Actual 17 SQLite install granted admin/editor/writer/translator and recorded the same stable package migration identity.
- Manually removed translator access in the disposable 17 database, restarted 17 and verified it remained absent. Backed up this state and upgraded the copy to 18.2.1. Verified the running server version through Umbraco's system info, the final 18 core migration state, translator still absent, and Handbook migration state unchanged. The original 17 demo group was restored after preparing the copy.
- Anonymous API request returned 401 on each major.
- Both server versions: 16 passed, 0 failed, 1 skipped on Windows. The skipped symlink test runs on Linux CI.
- Client: 8 passing tests include unsafe paths, Unicode routes, custom backoffice prefix, HTML sanitization, inert images, locale parity, stale responses and disconnects. Final 18 checks used the bundled Node 24.19 runtime.
- OpenAPI tooling updated to 0.99.0 and its YAML parser overridden to patched js-yaml 5.5.0. Generation against the actual JSON API schema passed; npm audit reports zero vulnerabilities including development dependencies.
- Packages 17.0.0 and 18.0.0 created locally. No NuGet release tags or NuGet publication performed. GitHub CI status is recorded at delivery separately.

- Final 17 and 18 generated clients both passed actual authenticated page/image reads after the tooling refresh. Both clients were built and tested using Node 24.19. The two nupkg files passed identity/range/manifest/license/schema checks and contained no demo credentials or database.

- Testsite credentials are generated on first Development startup in ignored appsettings.Local.json, preserved on restart and excluded from publication. A fresh SQLite install and browser login using the generated password passed. No fixed password or signing key is committed. Initial unpublished history is sanitized before first remote push.

