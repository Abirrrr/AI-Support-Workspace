using AI.SupportWorkspace.ClipboardCompanion.Protocol;

namespace AI.SupportWorkspace.ClipboardCompanion.Clipboard;

internal interface IBackoff
{
    void Wait(int milliseconds);
}

internal sealed class ThreadBackoff : IBackoff
{
    public void Wait(int milliseconds) => Thread.Sleep(milliseconds);
}

internal sealed class ClipboardTransaction(IClipboardPlatform platform, IBackoff backoff)
{
    internal static readonly int[] RetryDelaysMilliseconds = [10, 20, 40, 80, 160];

    internal HostErrorCode? Write(
        nint ownerWindow,
        uint pngFormat,
        IClipboardMemory png,
        IClipboardMemory dibV5)
    {
        if (ownerWindow == nint.Zero || pngFormat == 0)
        {
            return HostErrorCode.ClipboardWriteFailed;
        }

        ClipboardOpenResult openResult = OpenWithRetry(ownerWindow);
        if (openResult == ClipboardOpenResult.Contended)
        {
            return HostErrorCode.ClipboardBusy;
        }

        if (openResult != ClipboardOpenResult.Success)
        {
            return HostErrorCode.ClipboardOpenFailed;
        }

        HostErrorCode? error = null;
        try
        {
            if (!platform.Empty())
            {
                error = HostErrorCode.ClipboardWriteFailed;
            }
            else if (!platform.Set(pngFormat, png.DangerousHandle))
            {
                error = HostErrorCode.ClipboardWriteFailed;
            }
            else
            {
                png.TransferToSystem();
                if (!platform.Set(Win32ClipboardPlatform.CfDibV5, dibV5.DangerousHandle))
                {
                    error = HostErrorCode.ClipboardWriteFailed;
                    _ = platform.Empty();
                }
                else
                {
                    dibV5.TransferToSystem();
                }
            }
        }
        finally
        {
            if (!platform.Close())
            {
                error = HostErrorCode.ClipboardCloseFailed;
            }
        }

        return error;
    }

    private ClipboardOpenResult OpenWithRetry(nint ownerWindow)
    {
        for (int attempt = 0; attempt <= RetryDelaysMilliseconds.Length; attempt++)
        {
            ClipboardOpenResult result = platform.Open(ownerWindow);
            if (result != ClipboardOpenResult.Contended)
            {
                return result;
            }

            if (attempt < RetryDelaysMilliseconds.Length)
            {
                backoff.Wait(RetryDelaysMilliseconds[attempt]);
            }
        }

        return ClipboardOpenResult.Contended;
    }
}
