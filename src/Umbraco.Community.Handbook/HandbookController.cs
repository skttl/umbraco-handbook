using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;

namespace Umbraco.Community.Handbook;

[VersionedApiBackOfficeRoute("handbook")]
[ApiExplorerSettings(GroupName = "handbook")]
[MapToApi("handbook")]
[Authorize(Policy = HandbookComposer.Policy)]
public sealed class HandbookController(DocumentService documents) : ManagementApiControllerBase
{
    [HttpGet("tree")]
    [ProducesResponseType(typeof(IReadOnlyList<DocumentNode>), 200)]
    public IActionResult Tree() => Execute(() => Ok(documents.GetTree()));

    [HttpGet("page")]
    [ProducesResponseType(typeof(DocumentPage), 200)]
    public IActionResult Page([FromQuery] string path = "") => Execute(() => Ok(documents.GetPage(path)));

    [HttpGet("asset")]
    [ProducesResponseType(typeof(byte[]), 200)]
    public IActionResult Asset([FromQuery] string path) => Execute(() =>
    {
        var asset = documents.GetAsset(path);
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(asset.Bytes, asset.ContentType);
    });

    private IActionResult Execute(Func<IActionResult> action)
    {
        try { return action(); }
        catch (HandbookException exception) { return StatusCode(exception.Code == "notFound" ? 404 : 400, new { code = exception.Code }); }
    }
}
