using System.Reflection;

namespace AI.SupportWorkspace.ClipboardCompanion;

internal static class Program
{
    private static int Main(string[] args)
    {
        using Stream stdin = Console.OpenStandardInput();
        using Stream stdout = Console.OpenStandardOutput();
        string expectedOrigin = typeof(Program).Assembly
            .GetCustomAttributes<AssemblyMetadataAttribute>()
            .Single(attribute => attribute.Key == "ExpectedExtensionOrigin")
            .Value ?? string.Empty;

        return HostProcess.Run(args, stdin, stdout, expectedOrigin);
    }
}
