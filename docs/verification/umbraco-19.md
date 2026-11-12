# Umbraco 19 RC1 verification

The v18 baseline is commit `52ff453`, preserved on `v18/main`. The v19 line uses .NET 11, Umbraco `19.0.0-rc1`, Clean `19.0.0-beta01` and Handbook `19.0.0-rc1`.

## Upgrade decisions

- Backoffice API requests use the server URL and cookie credentials from the auth context. They no longer read the deprecated bearer token callback. The regression test covers tree, page and asset URLs, credentials and absence of an Authorization header; it failed against the previous implementation.
- Existing Handbook API contracts and package migration state are unchanged. Handbook does not use Examine, property editors, Delivery API clients or the removed content-segment APIs.
- `Microsoft.OpenApi` is updated to 3.11.0, required by the restored ASP.NET Core 11 dependency graph. Cryptography references follow .NET 11.
- The NuGet dependency interval starts at RC1, `[19.0.0-rc1,20.0.0)`, so the candidate can actually be installed on Umbraco RC1.
- No site startup or database migration was performed. Local configuration and imaging keys were not inspected.

## Checks

- Client regression suite: 14 passed across six files, including `uses the Umbraco server and session cookie for tree, page and asset requests`.
- Server: `dotnet test tests/Umbraco.Community.Handbook.Tests --configuration Release`, 15 passed, 0 failed, 1 skipped. The existing symbolic-link test runs only on Unix and remains covered by Linux CI.
- Demo: Debug build succeeded with 0 warnings and 0 errors.
- Client: TypeScript check, Vite production build and dependency license generation succeeded using Node 24 and npm 11.
- Workflows: actionlint 1.7.7 and `.github/scripts/test-publish-tags.sh` passed. Executed the release validation shell block for v17, v18, v19 RC1 and v19 stable tags, verifying the branch and dependency interval selected for each.
- NuGet: Release packing succeeded. Inspected package identity, version, dependency range, .NET 11 assembly, client entry point, manifest, license notices, readme, icon, schema and transitive target. No demo, test, database or local-settings files are packaged.

Packing emits NU5118 because the existing project lists the transitive target that NuGet also includes automatically. The target is present in the resulting package.

## Runtime checks still needed

Test login and Handbook navigation in a running Umbraco 19 site. Back up an existing database before starting the upgraded demo; Umbraco 18 cannot reopen a database upgraded by v19. Review the site's configuration and imaging key against the [official upgrade notes](https://docs.umbraco.com/umbraco-cms/19.latest/get-started/upgrading-and-migrating/version-specific). Clean is still a beta dependency of the demo.

## Beta01 release

After the RC1 preparation, the demo was started with a database backup and responded HTTP 200 at `/umbraco`. The user confirmed that it works and requested the Handbook release `19.0.0-beta01`. The testsite was then stopped. Handbook's package and manifest versions use `19.0.0-beta01`; the Umbraco dependency remains RC1 with the same compatibility interval. The release tag is `v19.0.0-beta01`.
