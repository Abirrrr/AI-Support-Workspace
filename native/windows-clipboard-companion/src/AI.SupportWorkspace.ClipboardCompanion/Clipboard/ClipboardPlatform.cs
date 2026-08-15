using System.Runtime.InteropServices;

namespace AI.SupportWorkspace.ClipboardCompanion.Clipboard;

internal enum ClipboardOpenResult
{
    Success,
    Contended,
    Failed,
}

internal interface IClipboardPlatform
{
    uint RegisterPngFormat();
    ClipboardOpenResult Open(nint ownerWindow);
    bool Empty();
    bool Set(uint format, nint memory);
    bool Close();
}

internal sealed partial class Win32ClipboardPlatform : IClipboardPlatform
{
    internal const uint CfDibV5 = 17;

    public uint RegisterPngFormat() => RegisterClipboardFormat("PNG");

    public ClipboardOpenResult Open(nint ownerWindow)
    {
        if (ownerWindow == nint.Zero)
        {
            return ClipboardOpenResult.Failed;
        }

        if (OpenClipboard(ownerWindow))
        {
            return ClipboardOpenResult.Success;
        }

        return GetOpenClipboardWindow() != nint.Zero
            ? ClipboardOpenResult.Contended
            : ClipboardOpenResult.Failed;
    }

    public bool Empty() => EmptyClipboard();
    public bool Set(uint format, nint memory) => SetClipboardData(format, memory) != nint.Zero;
    public bool Close() => CloseClipboard();

    [LibraryImport("user32.dll", EntryPoint = "RegisterClipboardFormatW", StringMarshalling = StringMarshalling.Utf16, SetLastError = true)]
    private static partial uint RegisterClipboardFormat(string format);

    [LibraryImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool OpenClipboard(nint ownerWindow);

    [LibraryImport("user32.dll")]
    private static partial nint GetOpenClipboardWindow();

    [LibraryImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool EmptyClipboard();

    [LibraryImport("user32.dll", SetLastError = true)]
    private static partial nint SetClipboardData(uint format, nint memory);

    [LibraryImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool CloseClipboard();
}
