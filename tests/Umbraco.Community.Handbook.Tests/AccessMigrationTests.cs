using Microsoft.AspNetCore.Authorization;
using Moq;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.OperationStatus;
using Umbraco.Cms.Core.Strings;
using Umbraco.Cms.Infrastructure.Migrations;

namespace Umbraco.Community.Handbook.Tests;

public sealed class AccessMigrationTests
{
    [Fact]
    public async Task Grants_only_standard_groups_preserves_other_sections_and_skips_existing_access()
    {
        var keys = new[] { Constants.Security.AdminGroupKey, Constants.Security.EditorGroupKey, Constants.Security.WriterGroupKey, Constants.Security.TranslatorGroupKey };
        var standard = keys.Select(key => new UserGroup(Mock.Of<IShortStringHelper>(), 0, key.ToString(), "Renamed group", null) { Key = key }).ToArray();
        foreach (var group in standard) group.AddAllowedSection("content");
        standard[0].AddAllowedSection(HandbookComposer.SectionAlias);
        var service = new Mock<IUserGroupService>(MockBehavior.Strict);
        foreach (var group in standard) service.Setup(s => s.GetAsync(group.Key)).ReturnsAsync(group);
        service.Setup(s => s.UpdateAsync(It.IsAny<IUserGroup>(), Constants.Security.SuperUserKey))
            .ReturnsAsync((IUserGroup group, Guid _) => Attempt.SucceedWithStatus(UserGroupOperationStatus.Success, group));
        var migration = new GrantHandbookAccess(Mock.Of<IMigrationContext>(), service.Object);
        await migration.RunAsync();
        Assert.All(standard, group => Assert.Equal(new[] { "content", HandbookComposer.SectionAlias }, group.AllowedSections));
        service.Verify(s => s.UpdateAsync(It.IsAny<IUserGroup>(), It.IsAny<Guid>()), Times.Exactly(3));
        await migration.RunAsync();
        service.Verify(s => s.UpdateAsync(It.IsAny<IUserGroup>(), It.IsAny<Guid>()), Times.Exactly(3));
    }

    [Fact]
    public async Task Missing_standard_groups_are_not_recreated()
    {
        var service = new Mock<IUserGroupService>();
        await new GrantHandbookAccess(Mock.Of<IMigrationContext>(), service.Object).RunAsync();
        service.Verify(s => s.UpdateAsync(It.IsAny<IUserGroup>(), It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public void Entire_api_including_assets_requires_section_access()
        => Assert.Contains(typeof(HandbookController).GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>(), attribute => attribute.Policy == HandbookComposer.Policy);
}
