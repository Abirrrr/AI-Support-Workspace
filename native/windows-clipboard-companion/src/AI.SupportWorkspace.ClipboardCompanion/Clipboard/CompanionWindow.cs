using System.Runtime.InteropServices;

namespace AI.SupportWorkspace.ClipboardCompanion.Clipboard;

internal interface ICompanionWindow : IDisposable
{
    nint Handle { get; }
}

internal interface ICompanionWindowFactory
{
    ICompanionWindow Create();
}

internal sealed class CompanionWindowFactory : ICompanionWindowFactory
{
    public ICompanionWindow Create() => CompanionWindow.Create();
}

internal sealed class CompanionWindow : ICompanionWindow
{
    private static readonly WindowProcedure Procedure = WindowProc;
    private readonly string className;
    private readonly nint module;
    private bool disposed;

    private CompanionWindow(string className, nint module, nint handle)
    {
        this.className = className;
        this.module = module;
        Handle = handle;
    }

    public nint Handle { get; private set; }

    internal static CompanionWindow Create()
    {
        nint module = GetModuleHandle(null);
        if (module == nint.Zero)
        {
            throw new InvalidOperationException();
        }

        string className = $"AI.SupportWorkspace.ClipboardCompanion.{Environment.ProcessId}";
        var windowClass = new WindowClassEx
        {
            Size = checked((uint)Marshal.SizeOf<WindowClassEx>()),
            Instance = module,
            WindowProcedure = Marshal.GetFunctionPointerForDelegate(Procedure),
            ClassName = className,
        };

        if (RegisterClassEx(ref windowClass) == 0)
        {
            throw new InvalidOperationException();
        }

        nint handle = CreateWindowEx(
            0,
            className,
            "AI Support Workspace Clipboard Companion",
            0,
            0,
            0,
            0,
            0,
            nint.Zero,
            nint.Zero,
            module,
            nint.Zero);
        if (handle == nint.Zero)
        {
            _ = UnregisterClass(className, module);
            throw new InvalidOperationException();
        }

        return new CompanionWindow(className, module, handle);
    }

    public void Dispose()
    {
        if (disposed)
        {
            return;
        }

        disposed = true;
        if (Handle != nint.Zero)
        {
            _ = DestroyWindow(Handle);
            Handle = nint.Zero;
        }

        _ = UnregisterClass(className, module);
    }

    private static nint WindowProc(nint window, uint message, nuint wParam, nint lParam) =>
        DefWindowProc(window, message, wParam, lParam);

    [UnmanagedFunctionPointer(CallingConvention.Winapi)]
    private delegate nint WindowProcedure(nint window, uint message, nuint wParam, nint lParam);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct WindowClassEx
    {
        internal uint Size;
        internal uint Style;
        internal nint WindowProcedure;
        internal int ClassExtra;
        internal int WindowExtra;
        internal nint Instance;
        internal nint Icon;
        internal nint Cursor;
        internal nint Background;
        [MarshalAs(UnmanagedType.LPWStr)] internal string? MenuName;
        [MarshalAs(UnmanagedType.LPWStr)] internal string? ClassName;
        internal nint IconSmall;
    }

    [DllImport("kernel32.dll", EntryPoint = "GetModuleHandleW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern nint GetModuleHandle(string? moduleName);

    [DllImport("user32.dll", EntryPoint = "RegisterClassExW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern ushort RegisterClassEx(ref WindowClassEx windowClass);

    [DllImport("user32.dll", EntryPoint = "CreateWindowExW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern nint CreateWindowEx(
        uint extendedStyle,
        string className,
        string windowName,
        uint style,
        int x,
        int y,
        int width,
        int height,
        nint parent,
        nint menu,
        nint instance,
        nint parameter);

    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool DestroyWindow(nint window);

    [DllImport("user32.dll", EntryPoint = "UnregisterClassW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnregisterClass(string className, nint instance);

    [DllImport("user32.dll", EntryPoint = "DefWindowProcW")]
    private static extern nint DefWindowProc(nint window, uint message, nuint wParam, nint lParam);
}
