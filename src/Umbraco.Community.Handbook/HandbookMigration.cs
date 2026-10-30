using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Packaging;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;

namespace Umbraco.Community.Handbook;

public sealed class HandbookMigrationPlan : PackageMigrationPlan
{
    public HandbookMigrationPlan() : base("Umbraco.Community.Handbook") { }
    public override bool IgnoreCurrentState => false;
    protected override void DefinePlan() => To<GrantHandbookAccess>("handbook-initial-access-v1");
}

public sealed class GrantHandbookAccess(IMigrationContext context, IUserGroupService groups) : AsyncMigrationBase(context)
{
    protected override async Task MigrateAsync()
    {
        foreach (var key in new[] { Constants.Security.AdminGroupKey, Constants.Security.EditorGroupKey, Constants.Security.WriterGroupKey, Constants.Security.TranslatorGroupKey })
        {
            var group = await groups.GetAsync(key);
            if (group is null || group.AllowedSections.Contains(HandbookComposer.SectionAlias)) continue;
            group.AddAllowedSection(HandbookComposer.SectionAlias);
            var result = await groups.UpdateAsync(group, Constants.Security.SuperUserKey);
            if (!result.Success) throw new InvalidOperationException($"Handbook could not grant section access: {result.Status}");
        }
    }
}
