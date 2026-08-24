using AI.SupportWorkspace.ClipboardCompanion.Protocol;

namespace AI.SupportWorkspace.ClipboardCompanion.Clipboard;

internal readonly record struct PasteContext(
    nint ForegroundHwnd,
    nint RootHwnd,
    uint ProcessId,
    uint ClipboardSequenceNumber);

internal readonly record struct PasteAttemptDiagnostic(
    uint SendInputRequestedCount,
    uint SendInputInsertedCount,
    int SendInputStructSize,
    uint SendInputLastError,
    bool ForegroundValidationPassed,
    bool RootWindowValidationPassed,
    bool PidValidationPassed,
    bool ClipboardSequenceValidationPassed,
    bool ModifierValidationPassed,
    bool? HostSessionMatchesTarget,
    HostIntegrityRelation HostIntegrityRelation);

internal readonly record struct PasteOperationResult(
    HostErrorCode? Error,
    PasteAttemptDiagnostic Diagnostic);

internal interface IPasteService
{
    (PasteContext? Context, HostErrorCode? Error) CaptureContext();
    PasteOperationResult Paste(PasteClipboardRequest request);
}

internal sealed class PasteService(IPastePlatform platform, bool collectSecurityDiagnostics = false) : IPasteService
{
    internal const string MutexName = @"Local\AI.SupportWorkspace.ClipboardCompanion.Paste.v2";
    private static readonly int[] ModifierKeys = [0xA2, 0xA3, 0xA0, 0xA1, 0xA4, 0xA5, 0x5B, 0x5C];
    internal static readonly PasteInputEvent[] PasteSequence =
    [
        new(PasteVirtualKey.Control, KeyUp: false),
        new(PasteVirtualKey.V, KeyUp: false),
        new(PasteVirtualKey.V, KeyUp: true),
        new(PasteVirtualKey.Control, KeyUp: true),
    ];

    internal static PasteService CreateDefault(bool collectSecurityDiagnostics = false) =>
        new(new Win32PastePlatform(), collectSecurityDiagnostics);

    public (PasteContext? Context, HostErrorCode? Error) CaptureContext()
    {
        PasteContext? context = ReadContext();
        return context is null
            ? (null, HostErrorCode.ForegroundUnavailable)
            : (context, null);
    }

    public PasteOperationResult Paste(PasteClipboardRequest request)
    {
        PasteAttemptDiagnostic diagnostic = new(
            0,
            0,
            platform.InputStructSize,
            0,
            false,
            false,
            false,
            false,
            false,
            null,
            HostIntegrityRelation.Unknown);
        using var mutex = new Mutex(false, MutexName);
        bool acquired;
        try
        {
            acquired = mutex.WaitOne(0);
        }
        catch (AbandonedMutexException)
        {
            acquired = true;
        }

        if (!acquired)
        {
            return new PasteOperationResult(HostErrorCode.PasteBusy, diagnostic);
        }

        try
        {
            nint foreground = platform.GetForegroundWindow();
            bool foregroundValid = foreground != nint.Zero
                && foreground == request.ExpectedForegroundHwnd;
            diagnostic = diagnostic with { ForegroundValidationPassed = foregroundValid };
            if (!foregroundValid)
            {
                return new PasteOperationResult(HostErrorCode.NotForeground, diagnostic);
            }

            nint root = platform.GetRootWindow(foreground);
            bool rootValid = root != nint.Zero && root == request.ExpectedRootHwnd;
            diagnostic = diagnostic with { RootWindowValidationPassed = rootValid };
            if (!rootValid)
            {
                return new PasteOperationResult(HostErrorCode.NotForeground, diagnostic);
            }

            uint processId = platform.GetWindowProcessId(foreground);
            bool pidValid = processId != 0 && processId == request.ExpectedProcessId;
            diagnostic = diagnostic with { PidValidationPassed = pidValid };
            if (!pidValid)
            {
                return new PasteOperationResult(HostErrorCode.NotForeground, diagnostic);
            }

            if (collectSecurityDiagnostics)
            {
                PasteSecurityContext security = platform.GetSecurityContext(processId);
                diagnostic = diagnostic with
                {
                    HostSessionMatchesTarget = security.HostSessionMatchesTarget,
                    HostIntegrityRelation = security.HostIntegrityRelation,
                };
            }

            uint sequence = platform.GetClipboardSequenceNumber();
            bool clipboardValid = sequence != 0
                && sequence == request.ExpectedClipboardSequenceNumber;
            diagnostic = diagnostic with { ClipboardSequenceValidationPassed = clipboardValid };
            if (!clipboardValid)
            {
                return new PasteOperationResult(HostErrorCode.ClipboardChanged, diagnostic);
            }

            bool modifiersValid = !ModifierKeys.Any(platform.IsModifierDown);
            diagnostic = diagnostic with { ModifierValidationPassed = modifiersValid };
            if (!modifiersValid)
            {
                return new PasteOperationResult(HostErrorCode.UnsafeKeyboardState, diagnostic);
            }

            PasteInputInjectionResult injection = platform.SendInput(PasteSequence);
            diagnostic = diagnostic with
            {
                SendInputRequestedCount = injection.RequestedCount,
                SendInputInsertedCount = injection.InsertedCount,
                SendInputStructSize = injection.StructSize,
                SendInputLastError = injection.LastError,
            };
            HostErrorCode? error = injection.InsertedCount switch
            {
                4 => null,
                0 => HostErrorCode.InputInjectionFailed,
                _ => HostErrorCode.Indeterminate,
            };
            return new PasteOperationResult(error, diagnostic);
        }
        finally
        {
            mutex.ReleaseMutex();
        }
    }

    private PasteContext? ReadContext()
    {
        nint foreground = platform.GetForegroundWindow();
        if (foreground == nint.Zero)
        {
            return null;
        }

        nint root = platform.GetRootWindow(foreground);
        uint processId = platform.GetWindowProcessId(foreground);
        uint sequence = platform.GetClipboardSequenceNumber();
        if (root == nint.Zero || processId == 0 || sequence == 0)
        {
            return null;
        }

        return new PasteContext(foreground, root, processId, sequence);
    }
}
