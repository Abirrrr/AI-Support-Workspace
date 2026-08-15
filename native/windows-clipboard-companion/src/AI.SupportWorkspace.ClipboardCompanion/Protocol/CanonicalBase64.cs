namespace AI.SupportWorkspace.ClipboardCompanion.Protocol;

internal static class CanonicalBase64
{
    internal static bool TryDecode(string data, int declaredLength, out byte[] decoded, out HostErrorCode error)
    {
        decoded = [];
        error = HostErrorCode.InvalidBase64;
        if (declaredLength < 1 || declaredLength > HostConstants.MaxPngBytes)
        {
            error = HostErrorCode.PayloadTooLarge;
            return false;
        }

        int expectedLength = checked(4 * ((declaredLength + 2) / 3));
        if (data.Length != expectedLength || data.Length > 6_990_508)
        {
            return false;
        }

        int expectedPadding = (declaredLength % 3) switch { 1 => 2, 2 => 1, _ => 0 };
        int dataCharacterCount = data.Length - expectedPadding;
        for (int index = 0; index < dataCharacterCount; index++)
        {
            if (Sextet(data[index]) < 0)
            {
                return false;
            }
        }

        for (int index = dataCharacterCount; index < data.Length; index++)
        {
            if (data[index] != '=')
            {
                return false;
            }
        }

        if (expectedPadding == 2 && (Sextet(data[^3]) & 0x0f) != 0)
        {
            return false;
        }

        if (expectedPadding == 1 && (Sextet(data[^2]) & 0x03) != 0)
        {
            return false;
        }

        decoded = GC.AllocateUninitializedArray<byte>(declaredLength);
        if (!Convert.TryFromBase64String(data, decoded, out int bytesWritten) || bytesWritten != declaredLength)
        {
            decoded = [];
            return false;
        }

        return true;
    }

    private static int Sextet(char value) => value switch
    {
        >= 'A' and <= 'Z' => value - 'A',
        >= 'a' and <= 'z' => value - 'a' + 26,
        >= '0' and <= '9' => value - '0' + 52,
        '+' => 62,
        '/' => 63,
        _ => -1,
    };
}
