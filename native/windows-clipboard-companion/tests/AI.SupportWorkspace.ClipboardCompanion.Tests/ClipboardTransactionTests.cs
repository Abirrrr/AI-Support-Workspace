using AI.SupportWorkspace.ClipboardCompanion.Clipboard;
using AI.SupportWorkspace.ClipboardCompanion.Protocol;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

public sealed class ClipboardTransactionTests
{
    [Fact]
    public void FirstAttemptSuccessTransfersBothFormatsInOrder()
    {
        var platform = new FakePlatform();
        var backoff = new FakeBackoff();
        using var png = new FakeMemory(101);
        using var dib = new FakeMemory(202);
        HostErrorCode? result = new ClipboardTransaction(platform, backoff).Write(42, 500, png, dib);
        Assert.Null(result);
        Assert.True(png.IsTransferred);
        Assert.True(dib.IsTransferred);
        Assert.Equal(new uint[] { 500, Win32ClipboardPlatform.CfDibV5 }, platform.SetFormats);
        Assert.Empty(backoff.Waits);
        Assert.Equal(1, platform.CloseCalls);
    }

    [Fact]
    public void ContentionUsesExactApprovedRetrySequence()
    {
        var platform = new FakePlatform
        {
            OpenResults = new Queue<ClipboardOpenResult>(
            [
                ClipboardOpenResult.Contended,
                ClipboardOpenResult.Contended,
                ClipboardOpenResult.Contended,
                ClipboardOpenResult.Contended,
                ClipboardOpenResult.Contended,
                ClipboardOpenResult.Success,
            ]),
        };
        var backoff = new FakeBackoff();
        using var png = new FakeMemory(101);
        using var dib = new FakeMemory(202);
        Assert.Null(new ClipboardTransaction(platform, backoff).Write(42, 500, png, dib));
        Assert.Equal(new[] { 10, 20, 40, 80, 160 }, backoff.Waits);
        Assert.Equal(310, backoff.Waits.Sum());
        Assert.Equal(6, platform.OpenCalls);
    }

    [Fact]
    public void ExhaustedContentionReturnsBusyWithoutMutation()
    {
        var platform = new FakePlatform
        {
            OpenResults = new Queue<ClipboardOpenResult>(Enumerable.Repeat(ClipboardOpenResult.Contended, 6)),
        };
        var backoff = new FakeBackoff();
        using var png = new FakeMemory(101);
        using var dib = new FakeMemory(202);
        Assert.Equal(HostErrorCode.ClipboardBusy, new ClipboardTransaction(platform, backoff).Write(42, 500, png, dib));
        Assert.Equal(6, platform.OpenCalls);
        Assert.Equal(new[] { 10, 20, 40, 80, 160 }, backoff.Waits);
        Assert.Equal(0, platform.EmptyCalls);
        Assert.Equal(0, platform.CloseCalls);
    }

    [Fact]
    public void NonContentionOpenFailureIsNotRetried()
    {
        var platform = new FakePlatform { OpenResults = new Queue<ClipboardOpenResult>([ClipboardOpenResult.Failed]) };
        var backoff = new FakeBackoff();
        using var png = new FakeMemory(101);
        using var dib = new FakeMemory(202);
        Assert.Equal(HostErrorCode.ClipboardOpenFailed, new ClipboardTransaction(platform, backoff).Write(42, 500, png, dib));
        Assert.Equal(1, platform.OpenCalls);
        Assert.Empty(backoff.Waits);
    }

    [Fact]
    public void EmptyFailureClosesAndTransfersNothing()
    {
        var platform = new FakePlatform { EmptyResults = new Queue<bool>([false]) };
        using var png = new FakeMemory(101);
        using var dib = new FakeMemory(202);
        Assert.Equal(HostErrorCode.ClipboardWriteFailed, new ClipboardTransaction(platform, new FakeBackoff()).Write(42, 500, png, dib));
        Assert.False(png.IsTransferred);
        Assert.False(dib.IsTransferred);
        Assert.Empty(platform.SetFormats);
        Assert.Equal(1, platform.CloseCalls);
    }

    [Fact]
    public void PngSetFailureTransfersNothingAndDoesNotRetry()
    {
        var platform = new FakePlatform { SetResults = new Queue<bool>([false]) };
        using var png = new FakeMemory(101);
        using var dib = new FakeMemory(202);
        Assert.Equal(HostErrorCode.ClipboardWriteFailed, new ClipboardTransaction(platform, new FakeBackoff()).Write(42, 500, png, dib));
        Assert.False(png.IsTransferred);
        Assert.False(dib.IsTransferred);
        Assert.Equal(1, platform.OpenCalls);
        Assert.Single(platform.SetFormats);
    }

    [Fact]
    public void PngSuccessThenDibFailureKeepsTransferredPngAndFreesOnlyDib()
    {
        var platform = new FakePlatform { SetResults = new Queue<bool>([true, false]) };
        var png = new FakeMemory(101);
        var dib = new FakeMemory(202);
        Assert.Equal(HostErrorCode.ClipboardWriteFailed, new ClipboardTransaction(platform, new FakeBackoff()).Write(42, 500, png, dib));
        png.Dispose();
        dib.Dispose();
        Assert.True(png.IsTransferred);
        Assert.False(png.Freed);
        Assert.False(dib.IsTransferred);
        Assert.True(dib.Freed);
        Assert.Equal(2, platform.EmptyCalls);
        Assert.Equal(1, platform.OpenCalls);
        Assert.Equal(1, platform.CloseCalls);
    }

    [Fact]
    public void PartialWriteCleanupFailurePreservesOriginalFailureAndDoesNotRetry()
    {
        var platform = new FakePlatform
        {
            EmptyResults = new Queue<bool>([true, false]),
            SetResults = new Queue<bool>([true, false]),
        };
        var png = new FakeMemory(101);
        var dib = new FakeMemory(202);

        Assert.Equal(HostErrorCode.ClipboardWriteFailed, new ClipboardTransaction(platform, new FakeBackoff()).Write(42, 500, png, dib));

        png.Dispose();
        dib.Dispose();
        Assert.Equal(1, platform.OpenCalls);
        Assert.Equal(2, platform.EmptyCalls);
        Assert.Equal(new uint[] { 500, Win32ClipboardPlatform.CfDibV5 }, platform.SetFormats);
        Assert.Equal(1, platform.CloseCalls);
        Assert.True(png.IsTransferred);
        Assert.False(png.Freed);
        Assert.False(dib.IsTransferred);
        Assert.True(dib.Freed);
    }

    [Fact]
    public void CloseFailureAfterPartialWriteUsesApprovedCloseFailurePrecedence()
    {
        var platform = new FakePlatform
        {
            SetResults = new Queue<bool>([true, false]),
            CloseResult = false,
        };
        var png = new FakeMemory(101);
        var dib = new FakeMemory(202);

        Assert.Equal(HostErrorCode.ClipboardCloseFailed, new ClipboardTransaction(platform, new FakeBackoff()).Write(42, 500, png, dib));

        png.Dispose();
        dib.Dispose();
        Assert.Equal(1, platform.OpenCalls);
        Assert.Equal(2, platform.EmptyCalls);
        Assert.Equal(1, platform.CloseCalls);
        Assert.True(png.IsTransferred);
        Assert.False(png.Freed);
        Assert.False(dib.IsTransferred);
        Assert.True(dib.Freed);
    }

    [Fact]
    public void CloseFailureAfterBothTransfersIsOverallFailureWithoutFreeingTransferredHandles()
    {
        var platform = new FakePlatform { CloseResult = false };
        var png = new FakeMemory(101);
        var dib = new FakeMemory(202);
        Assert.Equal(HostErrorCode.ClipboardCloseFailed, new ClipboardTransaction(platform, new FakeBackoff()).Write(42, 500, png, dib));
        png.Dispose();
        dib.Dispose();
        Assert.True(png.IsTransferred);
        Assert.True(dib.IsTransferred);
        Assert.False(png.Freed);
        Assert.False(dib.Freed);
        Assert.Equal(1, platform.OpenCalls);
    }

    [Fact]
    public void InvalidNullOwnerNeverCallsOpenClipboard()
    {
        var platform = new FakePlatform();
        using var png = new FakeMemory(101);
        using var dib = new FakeMemory(202);
        Assert.Equal(HostErrorCode.ClipboardWriteFailed, new ClipboardTransaction(platform, new FakeBackoff()).Write(nint.Zero, 500, png, dib));
        Assert.Equal(0, platform.OpenCalls);
    }

    private sealed class FakePlatform : IClipboardPlatform
    {
        internal Queue<ClipboardOpenResult> OpenResults { get; init; } = new([ClipboardOpenResult.Success]);
        internal Queue<bool> EmptyResults { get; init; } = new([true]);
        internal Queue<bool> SetResults { get; init; } = new([true, true]);
        internal bool CloseResult { get; init; } = true;
        internal int OpenCalls { get; private set; }
        internal int EmptyCalls { get; private set; }
        internal int CloseCalls { get; private set; }
        internal List<uint> SetFormats { get; } = [];

        public uint RegisterPngFormat() => 500;
        public ClipboardOpenResult Open(nint ownerWindow)
        {
            OpenCalls++;
            return OpenResults.Dequeue();
        }

        public bool Empty()
        {
            EmptyCalls++;
            return EmptyResults.Count == 0 || EmptyResults.Dequeue();
        }

        public bool Set(uint format, nint memory)
        {
            SetFormats.Add(format);
            return SetResults.Dequeue();
        }

        public bool Close()
        {
            CloseCalls++;
            return CloseResult;
        }
    }

    private sealed class FakeBackoff : IBackoff
    {
        internal List<int> Waits { get; } = [];
        public void Wait(int milliseconds) => Waits.Add(milliseconds);
    }

    private sealed class FakeMemory(nint handle) : IClipboardMemory
    {
        public nint DangerousHandle { get; } = handle;
        public bool IsTransferred { get; private set; }
        internal bool Freed { get; private set; }
        public void TransferToSystem() => IsTransferred = true;
        public void Dispose()
        {
            if (!IsTransferred)
            {
                Freed = true;
            }
        }
    }
}
