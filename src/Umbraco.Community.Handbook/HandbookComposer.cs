using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
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
        builder.Services.Configure<SwaggerGenOptions>(options =>
        {
            options.SwaggerDoc("handbook", new OpenApiInfo { Title = "Handbook API", Version = "1.0" });
            options.OperationFilter<HandbookSecurityFilter>();
        });
        builder.Services.AddSingleton<IOperationIdHandler, HandbookOperationIds>();
    }
}

public sealed class HandbookSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
{
    protected override string ApiName => "handbook";
}

public sealed class HandbookOperationIds(IOptions<ApiVersioningOptions> options) : OperationIdHandler(options)
{
    protected override bool CanHandle(ApiDescription api, ControllerActionDescriptor action)
        => action.ControllerTypeInfo.AsType() == typeof(HandbookController);
    public override string Handle(ApiDescription api) => "GetHandbook" + api.ActionDescriptor.RouteValues["action"];
}
