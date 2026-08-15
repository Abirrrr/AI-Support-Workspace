using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;
using AI.SupportWorkspace.ClipboardCompanion.Imaging;

namespace AI.SupportWorkspace.ClipboardCompanion.Clipboard;

internal interface IClipboardMemory : IDisposable
{
    nint DangerousHandle { get; }
    bool IsTransferred { get; }
    void TransferToSystem();
}

internal sealed partial class GlobalMemory : SafeHandleZeroOrMinusOneIsInvalid, IClipboardMemory
{
    private GlobalMemory() : base(true) { }

    public nint DangerousHandle => DangerousGetHandle();
    public bool IsTransferred { get; private set; }

    internal static GlobalMemory FromBytes(byte[] bytes)
    {
        GlobalMemory memory = Allocate(bytes.Length);
        nint pointer = GlobalLock(memory.handle);
        if (pointer == nint.Zero)
        {
            memory.Dispose();
            throw new OutOfMemoryException();
        }

        try
        {
            Marshal.Copy(bytes, 0, pointer, bytes.Length);
        }
        finally
        {
            _ = GlobalUnlock(memory.handle);
        }

        return memory;
    }

    internal static GlobalMemory FromDibV5(DecodedImage image)
    {
        int totalSize = DibV5Builder.GetTotalSize(image);
        GlobalMemory memory = Allocate(totalSize);
        nint pointer = GlobalLock(memory.handle);
        if (pointer == nint.Zero)
        {
            memory.Dispose();
            throw new OutOfMemoryException();
        }

        try
        {
            unsafe
            {
                var target = new Span<byte>((void*)pointer, totalSize);
                DibV5Builder.Write(image, target);
            }
        }
        finally
        {
            _ = GlobalUnlock(memory.handle);
        }

        return memory;
    }

    public void TransferToSystem()
    {
        if (IsTransferred || IsInvalid || IsClosed)
        {
            throw new InvalidOperationException("Clipboard memory cannot be transferred in its current state.");
        }

        IsTransferred = true;
        SetHandleAsInvalid();
    }

    protected override bool ReleaseHandle() => GlobalFree(handle) == nint.Zero;

    private static GlobalMemory Allocate(int bytes)
    {
        if (bytes <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(bytes));
        }

        nint handle = GlobalAlloc(0x0002 | 0x0040, checked((nuint)bytes));
        if (handle == nint.Zero)
        {
            throw new OutOfMemoryException();
        }

        var memory = new GlobalMemory();
        memory.SetHandle(handle);
        return memory;
    }

    [LibraryImport("kernel32.dll", SetLastError = true)]
    private static partial nint GlobalAlloc(uint flags, nuint bytes);

    [LibraryImport("kernel32.dll", SetLastError = true)]
    private static partial nint GlobalLock(nint memory);

    [LibraryImport("kernel32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool GlobalUnlock(nint memory);

    [LibraryImport("kernel32.dll", SetLastError = true)]
    private static partial nint GlobalFree(nint memory);
}
