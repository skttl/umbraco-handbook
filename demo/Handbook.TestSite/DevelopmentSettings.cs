using System.Security.Cryptography;
using System.Text.Json;

namespace Handbook.TestSite;

internal static class DevelopmentSettings
{
    public static string GetOrCreate(string contentRoot)
    {
        var path = Path.Combine(contentRoot, "appsettings.Local.json");
        if (!File.Exists(path))
        {
            var settings = new
            {
                Umbraco = new
                {
                    CMS = new
                    {
                        Unattended = new { UnattendedUserPassword = "Handbook-1-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(16)) },
                        Imaging = new { HMACSecretKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)) },
                    },
                },
            };
            using var file = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None);
            JsonSerializer.Serialize(file, settings, new JsonSerializerOptions { WriteIndented = true });
        }
        return path;
    }
}
