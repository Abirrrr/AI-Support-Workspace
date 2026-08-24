using AI.SupportWorkspace.ClipboardCompanion.Clipboard;
using AI.SupportWorkspace.ClipboardCompanion.Protocol;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

public sealed class PasteServiceTests
{
    private const string Id = "0123456789abcdef0123456789abcdef";
    private static readonly nint Foreground = (nint)0x1234;
    private static readonly nint Root = (nint)0x1000;

    [Fact]
    public void CapturesOnlyValidatedForegroundContext()
    {
        var platform = new FakePastePlatform();
        var service = new PasteService(platform);
        (PasteContext? context, HostErrorCode? error) = service.CaptureContext();
        Assert.Null(error);
        Assert.Equal(new PasteContext(Foreground, Root, 44, 77), context);
    }

    [Theory]
    [InlineData("foreground")]
    [InlineData("root")]
    [InlineData("process")]
    [InlineData("sequence")]
    public void InvalidCaptureApiResultFailsClosed(string failure)
    {
        var platform = new FakePastePlatform
        {
            Foreground = failure == "foreground" ? nint.Zero : Foreground,
            Root = failure == "root" ? nint.Zero : Root,
            ProcessId = failure == "process" ? 0u : 44u,
            Sequence = failure == "sequence" ? 0u : 77u,
        };
        (PasteContext? context, HostErrorCode? error) = new PasteService(platform).CaptureContext();
        Assert.Null(context);
        Assert.Equal(HostErrorCode.ForegroundUnavailable, error);
    }

    [Fact]
    public void ExactContextAndNoModifiersIssuesOneExactFourEventCall()
    {
        var platform = new FakePastePlatform { Inserted = 4 };
        PasteOperationResult result = new PasteService(platform, true).Paste(Request());
        Assert.Null(result.Error);
        Assert.Equal(4u, result.Diagnostic.SendInputRequestedCount);
        Assert.Equal(4u, result.Diagnostic.SendInputInsertedCount);
        Assert.Equal(40, result.Diagnostic.SendInputStructSize);
        Assert.Equal(0u, result.Diagnostic.SendInputLastError);
        Assert.True(result.Diagnostic.ForegroundValidationPassed);
        Assert.True(result.Diagnostic.RootWindowValidationPassed);
        Assert.True(result.Diagnostic.PidValidationPassed);
        Assert.True(result.Diagnostic.ClipboardSequenceValidationPassed);
        Assert.True(result.Diagnostic.ModifierValidationPassed);
        Assert.True(result.Diagnostic.HostSessionMatchesTarget);
        Assert.Equal(HostIntegrityRelation.Same, result.Diagnostic.HostIntegrityRelation);
        Assert.Equal(1, platform.SendInputCalls);
        Assert.Equal(
            [
                new PasteInputEvent(PasteVirtualKey.Control, false),
                new PasteInputEvent(PasteVirtualKey.V, false),
                new PasteInputEvent(PasteVirtualKey.V, true),
                new PasteInputEvent(PasteVirtualKey.Control, true),
            ],
            platform.LastEvents);
    }

    [Theory]
    [InlineData("foreground", "NotForeground")]
    [InlineData("root", "NotForeground")]
    [InlineData("process", "NotForeground")]
    [InlineData("sequence", "ClipboardChanged")]
    public void ContextMismatchNeverInjects(string mismatch, string expectedName)
    {
        var platform = new FakePastePlatform
        {
            Foreground = mismatch == "foreground" ? (nint)0x9999 : Foreground,
            Root = mismatch == "root" ? (nint)0x9999 : Root,
            ProcessId = mismatch == "process" ? 45u : 44u,
            Sequence = mismatch == "sequence" ? 78u : 77u,
        };
        Assert.Equal(Enum.Parse<HostErrorCode>(expectedName), new PasteService(platform).Paste(Request()).Error);
        Assert.Equal(0, platform.SendInputCalls);
    }

    [Theory]
    [InlineData(0xA2)]
    [InlineData(0xA3)]
    [InlineData(0xA0)]
    [InlineData(0xA1)]
    [InlineData(0xA4)]
    [InlineData(0xA5)]
    [InlineData(0x5B)]
    [InlineData(0x5C)]
    public void AnyRequiredModifierDownDeclinesWithoutInput(int virtualKey)
    {
        var platform = new FakePastePlatform();
        platform.DownModifiers.Add(virtualKey);
        Assert.Equal(HostErrorCode.UnsafeKeyboardState, new PasteService(platform).Paste(Request()).Error);
        Assert.Equal(0, platform.SendInputCalls);
    }

    [Theory]
    [InlineData(4, null)]
    [InlineData(0, "InputInjectionFailed")]
    [InlineData(1, "Indeterminate")]
    [InlineData(2, "Indeterminate")]
    [InlineData(3, "Indeterminate")]
    public void SendInputCountHasTruthfulNoRetrySemantics(uint inserted, string? expectedName)
    {
        var platform = new FakePastePlatform { Inserted = inserted, LastError = 87 };
        HostErrorCode? expected = expectedName is null
            ? null
            : Enum.Parse<HostErrorCode>(expectedName);
        PasteOperationResult result = new PasteService(platform).Paste(Request());
        Assert.Equal(expected, result.Error);
        Assert.Equal(inserted, result.Diagnostic.SendInputInsertedCount);
        Assert.Equal(87u, result.Diagnostic.SendInputLastError);
        Assert.Equal(1, platform.SendInputCalls);
    }

    [Fact]
    public void HeldPasteMutexFailsImmediatelyWithoutInput()
    {
        using var ready = new ManualResetEventSlim();
        using var release = new ManualResetEventSlim();
        var holder = new Thread(() =>
        {
            using var mutex = new Mutex(false, PasteService.MutexName);
            mutex.WaitOne();
            ready.Set();
            release.Wait();
            mutex.ReleaseMutex();
        });
        holder.Start();
        Assert.True(ready.Wait(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken));
        try
        {
            var platform = new FakePastePlatform();
            Assert.Equal(HostErrorCode.PasteBusy, new PasteService(platform).Paste(Request()).Error);
            Assert.Equal(0, platform.SendInputCalls);
        }
        finally
        {
            release.Set();
            holder.Join();
        }
    }

    [Fact]
    public void WindowHandleSerializationIsFixedLowercaseHexAndRejectsZero()
    {
        Assert.Equal("0000000000001234", ProtocolJson.FormatWindowHandle(Foreground));
        Assert.Throws<ArgumentOutOfRangeException>(() => ProtocolJson.FormatWindowHandle(nint.Zero));
    }

    [Fact]
    public void WinX64InputAbiAndKeyboardConstructionMatchWindowsHeaders()
    {
        Assert.Equal(8, nint.Size);
        Assert.Equal(24, Win32PastePlatform.KeyboardInputSize);
        Assert.Equal(32, Win32PastePlatform.MouseInputSize);
        Assert.Equal(32, Win32PastePlatform.InputUnionSize);
        Assert.Equal(40, Win32PastePlatform.InputSize);
        Assert.Equal(8, Win32PastePlatform.InputUnionOffset);

        IReadOnlyList<KeyboardInputDiagnostic> inputs =
            Win32PastePlatform.InspectKeyboardInputs(PasteService.PasteSequence);
        Assert.Equal(4, inputs.Count);
        Assert.Equal(
            [
                new KeyboardInputDiagnostic(1, 0x11, 0, 0, 0, 0),
                new KeyboardInputDiagnostic(1, 0x56, 0, 0, 0, 0),
                new KeyboardInputDiagnostic(1, 0x56, 0, 0x0002, 0, 0),
                new KeyboardInputDiagnostic(1, 0x11, 0, 0x0002, 0, 0),
            ],
            inputs);
    }

    [Fact]
    public void ProductionSendInputBoundaryCapturesLastErrorImmediately()
    {
        var platform = new Win32PastePlatform((requested, structSize) =>
        {
            Assert.Equal(4u, requested);
            Assert.Equal(40, structSize);
            System.Runtime.InteropServices.Marshal.SetLastPInvokeError(87);
            return 0;
        });

        PasteInputInjectionResult result = platform.SendInput(PasteService.PasteSequence);

        Assert.Equal(new PasteInputInjectionResult(4, 0, 40, 87), result);
    }

    private static PasteClipboardRequest Request() =>
        new(Id, Id, Foreground, Root, 44, 77);

    private sealed class FakePastePlatform : IPastePlatform
    {
        internal nint Foreground { get; init; } = PasteServiceTests.Foreground;
        internal nint Root { get; init; } = PasteServiceTests.Root;
        internal uint ProcessId { get; init; } = 44;
        internal uint Sequence { get; init; } = 77;
        internal uint Inserted { get; init; } = 4;
        internal uint LastError { get; init; }
        public int InputStructSize => 40;
        internal HashSet<int> DownModifiers { get; } = [];
        internal int SendInputCalls { get; private set; }
        internal IReadOnlyList<PasteInputEvent> LastEvents { get; private set; } = [];

        public nint GetForegroundWindow() => Foreground;
        public nint GetRootWindow(nint window) => Root;
        public uint GetWindowProcessId(nint window) => ProcessId;
        public uint GetClipboardSequenceNumber() => Sequence;
        public bool IsModifierDown(int virtualKey) => DownModifiers.Contains(virtualKey);
        public PasteSecurityContext GetSecurityContext(uint targetProcessId) =>
            new(true, HostIntegrityRelation.Same);
        public PasteInputInjectionResult SendInput(IReadOnlyList<PasteInputEvent> events)
        {
            SendInputCalls++;
            LastEvents = [.. events];
            return new PasteInputInjectionResult(checked((uint)events.Count), Inserted, InputStructSize, LastError);
        }
    }
}
