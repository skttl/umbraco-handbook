WebApplicationBuilder builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsDevelopment())
    builder.Configuration.AddJsonFile(Handbook.TestSite.DevelopmentSettings.GetOrCreate(builder.Environment.ContentRootPath));
builder.CreateUmbracoBuilder().AddBackOffice().AddWebsite().AddComposers().Build();
WebApplication app = builder.Build();
await app.BootUmbracoAsync();
app.UseUmbraco().WithMiddleware(u => { u.UseBackOffice(); u.UseWebsite(); })
    .WithEndpoints(u => { u.UseBackOfficeEndpoints(); u.UseWebsiteEndpoints(); });
await app.RunAsync();
