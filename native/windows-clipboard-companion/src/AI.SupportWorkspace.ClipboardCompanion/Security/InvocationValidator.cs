using System.Globalization;
using System.Text.RegularExpressions;

namespace AI.SupportWorkspace.ClipboardCompanion.Security;

internal sealed record ValidatedInvocation(string CallerOrigin, nint ChromeParentWindow);

internal static partial class InvocationValidator
{
    [GeneratedRegex("^chrome-extension://[a-p]{32}/$", RegexOptions.CultureInvariant)]
    private static partial Regex ExtensionOriginPattern();

    internal static bool IsValidConfiguredOrigin(string expectedOrigin) =>
        !string.IsNullOrEmpty(expectedOrigin)
        && !expectedOrigin.Contains('*', StringComparison.Ordinal)
        && ExtensionOriginPattern().IsMatch(expectedOrigin);

    internal static bool TryValidate(
        IReadOnlyList<string> args,
        string expectedOrigin,
        out ValidatedInvocation? invocation)
    {
        invocation = null;
        if (!IsValidConfiguredOrigin(expectedOrigin)
            || args.Count != 2
            || !string.Equals(args[0], expectedOrigin, StringComparison.Ordinal)
            || !args[1].StartsWith("--parent-window=", StringComparison.Ordinal))
        {
            return false;
        }

        ReadOnlySpan<char> value = args[1].AsSpan("--parent-window=".Length);
        if (value.IsEmpty
            || !ulong.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out ulong parsed)
            || (IntPtr.Size == 4 && parsed > uint.MaxValue))
        {
            return false;
        }

        invocation = new ValidatedInvocation(args[0], unchecked((nint)parsed));
        return true;
    }
}
