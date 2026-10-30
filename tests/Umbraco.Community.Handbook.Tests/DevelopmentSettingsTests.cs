using System.Text.Json;
using Handbook.TestSite;

namespace Umbraco.Community.Handbook.Tests;

public sealed class DevelopmentSettingsTests
{
    [Fact]
    public void Local_credentials_are_random_and_preserved_on_subsequent_starts()
    {
        var root = Path.Combine(Path.GetTempPath(), "handbook-dev-" + Guid.NewGuid());
        Directory.CreateDirectory(root);
        try
        {
            var first = DevelopmentSettings.GetOrCreate(root);
            var original = File.ReadAllText(first);
            using var config = JsonDocument.Parse(original);
            var cms = config.RootElement.GetProperty("Umbraco").GetProperty("CMS");
            var password = cms.GetProperty("Unattended").GetProperty("UnattendedUserPassword").GetString()!;
            Assert.StartsWith("Handbook-1-", password);
            Assert.True(password.Length >= 40);
            Assert.Equal(64, Convert.FromBase64String(cms.GetProperty("Imaging").GetProperty("HMACSecretKey").GetString()!).Length);
            Assert.Equal(first, DevelopmentSettings.GetOrCreate(root));
            Assert.Equal(original, File.ReadAllText(first));
            File.Delete(first);
            DevelopmentSettings.GetOrCreate(root);
            Assert.NotEqual(original, File.ReadAllText(first));
        }
        finally { Directory.Delete(root, true); }
    }
}
