using System.Runtime.InteropServices;

namespace AI.SupportWorkspace.ClipboardCompanion.Clipboard;

internal enum PasteVirtualKey : ushort
{
    Control = 0x11,
    V = 0x56,
}

internal readonly record struct PasteInputEvent(PasteVirtualKey Key, bool KeyUp);

internal readonly record struct PasteInputInjectionResult(
    uint RequestedCount,
    uint InsertedCount,
    int StructSize,
    uint LastError);

internal enum HostIntegrityRelation
{
    Same,
    HostLower,
    HostHigher,
    Unknown,
}

internal readonly record struct PasteSecurityContext(
    bool? HostSessionMatchesTarget,
    HostIntegrityRelation HostIntegrityRelation);

internal readonly record struct KeyboardInputDiagnostic(
    uint Type,
    ushort VirtualKey,
    ushort ScanCode,
    uint Flags,
    uint Time,
    nuint ExtraInfo);

internal interface IPastePlatform
{
    nint GetForegroundWindow();
    nint GetRootWindow(nint window);
    uint GetWindowProcessId(nint window);
    uint GetClipboardSequenceNumber();
    bool IsModifierDown(int virtualKey);
    int InputStructSize { get; }
    PasteSecurityContext GetSecurityContext(uint targetProcessId);
    PasteInputInjectionResult SendInput(IReadOnlyList<PasteInputEvent> events);
}

internal sealed partial class Win32PastePlatform : IPastePlatform
{
    private const uint GaRoot = 2;
    private const uint InputKeyboard = 1;
    private const uint KeyeventfKeyup = 0x0002;
    private const uint ProcessQueryLimitedInformation = 0x1000;
    private const uint TokenQuery = 0x0008;
    private const int TokenIntegrityLevel = 25;

    private readonly Func<uint, int, uint>? sendInputOverride;

    internal Win32PastePlatform()
    {
    }

    internal Win32PastePlatform(Func<uint, int, uint> sendInputOverride)
    {
        this.sendInputOverride = sendInputOverride;
    }

    public nint GetForegroundWindow() => NativeGetForegroundWindow();
    public nint GetRootWindow(nint window) => GetAncestor(window, GaRoot);

    public uint GetWindowProcessId(nint window)
    {
        uint threadId = GetWindowThreadProcessId(window, out uint processId);
        return threadId == 0 ? 0 : processId;
    }

    public uint GetClipboardSequenceNumber() => NativeGetClipboardSequenceNumber();
    public bool IsModifierDown(int virtualKey) => (GetAsyncKeyState(virtualKey) & 0x8000) != 0;
    public int InputStructSize => Marshal.SizeOf<Input>();

    public PasteSecurityContext GetSecurityContext(uint targetProcessId)
    {
        bool? sessionsMatch = null;
        HostIntegrityRelation integrityRelation = HostIntegrityRelation.Unknown;
        try
        {
            if (ProcessIdToSessionId(checked((uint)Environment.ProcessId), out uint hostSession)
                && ProcessIdToSessionId(targetProcessId, out uint targetSession))
            {
                sessionsMatch = hostSession == targetSession;
            }

            uint? hostIntegrity = ReadIntegrityRid(GetCurrentProcess());
            nint targetProcess = OpenProcess(ProcessQueryLimitedInformation, false, targetProcessId);
            if (targetProcess != nint.Zero)
            {
                try
                {
                    uint? targetIntegrity = ReadIntegrityRid(targetProcess);
                    if (hostIntegrity is uint host && targetIntegrity is uint target)
                    {
                        integrityRelation = host == target
                            ? HostIntegrityRelation.Same
                            : host < target
                                ? HostIntegrityRelation.HostLower
                                : HostIntegrityRelation.HostHigher;
                    }
                }
                finally
                {
                    CloseHandle(targetProcess);
                }
            }
        }
        catch (Exception)
        {
            // Security-context evidence is optional and must never affect input delivery.
        }

        return new PasteSecurityContext(sessionsMatch, integrityRelation);
    }

    public PasteInputInjectionResult SendInput(IReadOnlyList<PasteInputEvent> events)
    {
        Input[] inputs = BuildInputs(events);
        uint requested = checked((uint)inputs.Length);
        int structSize = InputStructSize;
        uint inserted = sendInputOverride is null
            ? NativeSendInput(requested, inputs, structSize)
            : sendInputOverride(requested, structSize);
        uint lastError = unchecked((uint)Marshal.GetLastPInvokeError());
        return new PasteInputInjectionResult(requested, inserted, structSize, lastError);
    }

    internal static int KeyboardInputSize => Marshal.SizeOf<KeyboardInput>();
    internal static int MouseInputSize => Marshal.SizeOf<MouseInput>();
    internal static int InputUnionSize => Marshal.SizeOf<InputUnion>();
    internal static int InputSize => Marshal.SizeOf<Input>();
    internal static int InputUnionOffset => checked((int)Marshal.OffsetOf<Input>(nameof(Input.Union)));

    internal static IReadOnlyList<KeyboardInputDiagnostic> InspectKeyboardInputs(
        IReadOnlyList<PasteInputEvent> events) => BuildInputs(events)
            .Select(input => new KeyboardInputDiagnostic(
                input.Type,
                input.Union.Keyboard.VirtualKey,
                input.Union.Keyboard.ScanCode,
                input.Union.Keyboard.Flags,
                input.Union.Keyboard.Time,
                input.Union.Keyboard.ExtraInfo))
            .ToArray();

    private static Input[] BuildInputs(IReadOnlyList<PasteInputEvent> events) => events
        .Select(item => Keyboard((ushort)item.Key, item.KeyUp ? KeyeventfKeyup : 0))
        .ToArray();

    private static Input Keyboard(ushort virtualKey, uint flags) => new()
    {
        Type = InputKeyboard,
        Union = new InputUnion
        {
            Keyboard = new KeyboardInput
            {
                VirtualKey = virtualKey,
                Flags = flags,
            },
        },
    };

    [StructLayout(LayoutKind.Sequential)]
    private struct Input
    {
        internal uint Type;
        internal InputUnion Union;
    }

    [StructLayout(LayoutKind.Explicit)]
    private struct InputUnion
    {
        [FieldOffset(0)]
        internal MouseInput Mouse;

        [FieldOffset(0)]
        internal KeyboardInput Keyboard;

        [FieldOffset(0)]
        internal HardwareInput Hardware;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct MouseInput
    {
        internal int Dx;
        internal int Dy;
        internal uint MouseData;
        internal uint Flags;
        internal uint Time;
        internal nuint ExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct KeyboardInput
    {
        internal ushort VirtualKey;
        internal ushort ScanCode;
        internal uint Flags;
        internal uint Time;
        internal nuint ExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct HardwareInput
    {
        internal uint Message;
        internal ushort ParamL;
        internal ushort ParamH;
    }

    private static uint? ReadIntegrityRid(nint process)
    {
        if (!OpenProcessToken(process, TokenQuery, out nint token) || token == nint.Zero)
        {
            return null;
        }

        try
        {
            _ = GetTokenInformation(token, TokenIntegrityLevel, nint.Zero, 0, out uint required);
            if (required == 0)
            {
                return null;
            }

            nint buffer = Marshal.AllocHGlobal(checked((int)required));
            try
            {
                if (!GetTokenInformation(token, TokenIntegrityLevel, buffer, required, out _))
                {
                    return null;
                }

                nint sid = Marshal.ReadIntPtr(buffer);
                byte subAuthorityCount = Marshal.ReadByte(sid, 1);
                if (subAuthorityCount == 0)
                {
                    return null;
                }

                return unchecked((uint)Marshal.ReadInt32(sid, 8 + ((subAuthorityCount - 1) * 4)));
            }
            finally
            {
                Marshal.FreeHGlobal(buffer);
            }
        }
        finally
        {
            CloseHandle(token);
        }
    }

    [LibraryImport("user32.dll", EntryPoint = "GetForegroundWindow")]
    private static partial nint NativeGetForegroundWindow();

    [LibraryImport("user32.dll")]
    private static partial nint GetAncestor(nint window, uint flags);

    [LibraryImport("user32.dll")]
    private static partial uint GetWindowThreadProcessId(nint window, out uint processId);

    [LibraryImport("user32.dll", EntryPoint = "GetClipboardSequenceNumber")]
    private static partial uint NativeGetClipboardSequenceNumber();

    [LibraryImport("user32.dll")]
    private static partial short GetAsyncKeyState(int virtualKey);

    [LibraryImport("user32.dll", EntryPoint = "SendInput", SetLastError = true)]
    private static partial uint NativeSendInput(uint count, [In] Input[] inputs, int size);

    [LibraryImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool ProcessIdToSessionId(uint processId, out uint sessionId);

    [LibraryImport("kernel32.dll")]
    private static partial nint GetCurrentProcess();

    [LibraryImport("kernel32.dll", SetLastError = true)]
    private static partial nint OpenProcess(uint desiredAccess, [MarshalAs(UnmanagedType.Bool)] bool inheritHandle, uint processId);

    [LibraryImport("advapi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool OpenProcessToken(nint processHandle, uint desiredAccess, out nint tokenHandle);

    [LibraryImport("advapi32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool GetTokenInformation(
        nint tokenHandle,
        int tokenInformationClass,
        nint tokenInformation,
        uint tokenInformationLength,
        out uint returnLength);

    [LibraryImport("kernel32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static partial bool CloseHandle(nint handle);
}
