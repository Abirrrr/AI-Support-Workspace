using System.Buffers.Binary;
using System.Text;
using AI.SupportWorkspace.ClipboardCompanion.Clipboard;
using AI.SupportWorkspace.ClipboardCompanion.Imaging;
using AI.SupportWorkspace.ClipboardCompanion.Protocol;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

public sealed class ConcurrencyAndPrivacyTests
{
    [Fact]
    public void HeldSessionMutexRejectsOverlappingImageOperationAsBusy()
    {
        using var ready = new ManualResetEventSlim();
        using var release = new ManualResetEventSlim();
        var holder = new Thread(() =>
        {
            using var mutex = new Mutex(false, ImageWriteService.MutexName);
            mutex.WaitOne();
            ready.Set();
            release.Wait();
            mutex.ReleaseMutex();
        });
        holder.Start();
        Assert.True(ready.Wait(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken));
        try
        {
            var service = new ImageWriteService(new NeverDecoder(), new NeverPlatform(), new NeverWindowFactory(), new NoWait());
            Assert.Equal(HostErrorCode.ClipboardBusy, service.Write(TestPng.Rgba2X2()));
        }
        finally
        {
            release.Set();
            holder.Join();
        }
    }

    [Fact]
    public void SafeProtocolErrorContainsNoPayloadOrNativeDetail()
    {
        string base64 = Convert.ToBase64String(TestPng.Rgba2X2());
        byte[] error = ProtocolJson.Error("0123456789abcdef0123456789abcdef", HostErrorCode.ImageDecodeFailed);
        string json = Encoding.UTF8.GetString(error);
        Assert.DoesNotContain(base64, json, StringComparison.Ordinal);
        Assert.DoesNotContain("HRESULT", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Exception", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\\", json, StringComparison.Ordinal);
        Assert.True(error.Length < HostConstants.MaxResponseBytes);
    }

    [Fact]
    public void ErrorResponseStdoutIsOneFramedJsonObjectOnly()
    {
        byte[] body = ProtocolJson.Error(null, HostErrorCode.InvalidRequest);
        using var output = new MemoryStream();
        NativeMessageFraming.WriteResponse(output, body);
        byte[] framed = output.ToArray();
        int length = checked((int)BinaryPrimitives.ReadUInt32LittleEndian(framed));
        Assert.Equal(body.Length, length);
        Assert.Equal(body, framed[4..]);
        Assert.Equal(4 + length, framed.Length);
    }

    private sealed class NeverDecoder : IImageDecoder
    {
        public DecodedImage Decode(ValidatedPng png) => throw new Xunit.Sdk.XunitException("Decoder must not run.");
    }

    private sealed class NeverPlatform : IClipboardPlatform
    {
        public uint RegisterPngFormat() => throw new Xunit.Sdk.XunitException("Clipboard must not run.");
        public ClipboardOpenResult Open(nint ownerWindow) => throw new Xunit.Sdk.XunitException("Clipboard must not run.");
        public bool Empty() => throw new Xunit.Sdk.XunitException("Clipboard must not run.");
        public bool Set(uint format, nint memory) => throw new Xunit.Sdk.XunitException("Clipboard must not run.");
        public bool Close() => throw new Xunit.Sdk.XunitException("Clipboard must not run.");
    }

    private sealed class NeverWindowFactory : ICompanionWindowFactory
    {
        public ICompanionWindow Create() => throw new Xunit.Sdk.XunitException("Window must not run.");
    }

    private sealed class NoWait : IBackoff
    {
        public void Wait(int milliseconds) => throw new Xunit.Sdk.XunitException("Backoff must not run.");
    }
}
