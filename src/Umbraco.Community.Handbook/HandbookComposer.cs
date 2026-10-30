using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Security;

namespace Umbraco.Community.Handbook;

public sealed class HandbookComposer : IComposer
{
    public const string SectionAlias = "Handbook.Section";
    public const string Policy = "Handbook.SectionAccess";
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton(provider =>
        {
            var configured = builder.Config["Umbraco:Community:Handbook:DocumentationPath"];
            var root = string.IsNullOrWhiteSpace(configured) ? null : Path.Combine(provider.GetRequiredService<IHostEnvironment>().ContentRootPath, configured);
            return new DocumentService(root, provider.GetRequiredService<ILogger<DocumentService>>());
        });
        builder.Services.AddAuthorization(options => options.AddPolicy(Policy, policy => policy.RequireAuthenticatedUser().RequireAssertion(context =>
        {
            var accessor = context.Resource is Microsoft.AspNetCore.Http.HttpContext http ? http.RequestServices.GetRequiredService<IBackOfficeSecurityAccessor>() : null;
            return accessor?.BackOfficeSecurity?.CurrentUser?.AllowedSections.Contains(SectionAlias) == true;
        })));
        builder.AddBackOfficeOpenApiDocument("handbook", document => document.WithTitle("Handbook API").WithBackOfficeAuthentication().WithJsonOptions(Umbraco.Cms.Core.Constants.JsonOptionsNames.BackOffice));
    }
}
