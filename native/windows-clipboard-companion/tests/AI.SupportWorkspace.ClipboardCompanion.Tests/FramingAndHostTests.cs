using System.Buffers.Binary;
using System.Text;
using System.Text.Json;
using AI.SupportWorkspace.ClipboardCompanion.Clipboard;
using AI.SupportWorkspace.ClipboardCompanion.Protocol;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

public sealed class FramingAndHostTests
{
    private const string Origin = "chrome-extension://abcdefghijklmnopabcdefghijklmnop/";
    private static readonly string[] Invocation = [Origin, "--parent-window=0"];

    [Fact]
    public void ReadsValidFrame()
    {
        byte[] body = "{}"u8.ToArray();
        FrameReadResult result = NativeMessageFraming.ReadRequest(Frame(body));
        Assert.Equal(body, result.Body);
        Assert.Null(result.Error);
    }

    [Fact]
    public void RejectsZeroBody() => Assert.Equal(
        HostErrorCode.InvalidRequest,
        NativeMessageFraming.ReadRequest(new MemoryStream(new byte[4])).Error);

    [Fact]
    public void RejectsTruncatedPrefix() => Assert.Equal(
        HostErrorCode.InvalidRequest,
        NativeMessageFraming.ReadRequest(new MemoryStream([1, 0, 0])).Error);

    [Fact]
    public void RejectsTruncatedBody() => Assert.Equal(
        HostErrorCode.InvalidRequest,
        NativeMessageFraming.ReadRequest(new MemoryStream([4, 0, 0, 0, 1, 2])).Error);

    [Fact]
    public void RejectsOversizeBeforeAllocation()
    {
        byte[] prefix = new byte[4];
        BinaryPrimitives.WriteUInt32LittleEndian(prefix, HostConstants.MaxRequestBytes + 1);
        Assert.Equal(HostErrorCode.PayloadTooLarge, NativeMessageFraming.ReadRequest(new MemoryStream(prefix)).Error);
    }

    [Fact]
    public void RejectsInvalidUtf8() => Assert.Equal(
        HostErrorCode.InvalidRequest,
        NativeMessageFraming.ReadRequest(Frame([0xc3, 0x28])).Error);

    [Fact]
    public void CompleteDeclaredFrameIsProcessedWithoutReadingForEof()
    {
        byte[] request = File.ReadAllBytes(Fixture("get-capabilities.request.json"));
        using var input = new ThrowsAfterDeclaredFrameStream(FramedBytes(request));
        using var output = new MemoryStream();

        int exitCode = HostProcess.Run(Invocation, input, output, Origin);

        Assert.Equal(0, exitCode);
        Assert.False(input.ReadPastDeclaredFrame);
        Assert.Equal(2, input.ReadCalls);
        byte[] expected = Encoding.UTF8.GetBytes(File.ReadAllText(Fixture("get-capabilities.success.json")).TrimEnd('\r', '\n'));
        Assert.Equal(expected, ReadSingleResponse(output));
    }

    [Fact]
    public void SynchronouslyBufferedBytesAfterDeclaredFrameAreNotConsumed()
    {
        byte[] body = "{}"u8.ToArray();
        byte[] framed = [.. FramedBytes(body), 0xff];
        using var input = new MemoryStream(framed);

        FrameReadResult result = NativeMessageFraming.ReadRequest(input);

        Assert.Equal(body, result.Body);
        Assert.Null(result.Error);
        Assert.Equal(4 + body.Length, input.Position);
        Assert.Equal(framed.Length, input.Length);
    }

    [Fact]
    public void CapabilitiesWritesExactlyOneResponseFrameWithNoExtraBytes()
    {
        byte[] request = File.ReadAllBytes(Fixture("get-capabilities.request.json"));
        using var output = new MemoryStream();
        int exitCode = HostProcess.Run(Invocation, Frame(request), output, Origin);
        Assert.Equal(0, exitCode);
        byte[] expected = Encoding.UTF8.GetBytes(File.ReadAllText(Fixture("get-capabilities.success.json")).TrimEnd('\r', '\n'));
        Assert.Equal(expected, ReadSingleResponse(output));
    }

    [Fact]
    public void StdoutFailureDoesNotAttemptASecondResponse()
    {
        byte[] request = File.ReadAllBytes(Fixture("get-capabilities.request.json"));
        using var output = new ThrowingWriteStream();

        int exitCode = HostProcess.Run(Invocation, Frame(request), output, Origin);

        Assert.Equal(1, exitCode);
        Assert.Equal(1, output.WriteAttempts);
    }

    [Fact]
    public void InvalidFramingReturnsOnlySafeCorrelatedNullError()
    {
        using var output = new MemoryStream();
        int exitCode = HostProcess.Run(Invocation, new MemoryStream([0, 0, 0, 0]), output, Origin);
        Assert.Equal(1, exitCode);
        using JsonDocument response = JsonDocument.Parse(ReadSingleResponse(output));
        Assert.Equal(JsonValueKind.Null, response.RootElement.GetProperty("requestId").ValueKind);
        Assert.Equal("invalid-request", response.RootElement.GetProperty("safeErrorCode").GetString());
    }

    [Fact]
    public void InvalidCallerProducesNoStdout()
    {
        using var output = new MemoryStream();
        int exitCode = HostProcess.Run(["chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/", "--parent-window=0"], Frame("{}"u8.ToArray()), output, Origin);
        Assert.Equal(2, exitCode);
        Assert.Empty(output.ToArray());
    }

    [Fact]
    public void ImageSuccessUsesInjectedServiceAndNeverWritesExtraOutput()
    {
        byte[] png = TestPng.Rgba2X2();
        string request = $"{{\"protocolVersion\":1,\"requestId\":\"fedcba9876543210fedcba9876543210\",\"operation\":\"write-image-png\",\"image\":{{\"encoding\":\"base64\",\"byteLength\":{png.Length},\"data\":\"{Convert.ToBase64String(png)}\"}}}}";
        using var output = new MemoryStream();
        var service = new FakeImageWriteService();
        int exitCode = HostProcess.Run(Invocation, Frame(Encoding.UTF8.GetBytes(request)), output, Origin, service);
        Assert.Equal(0, exitCode);
        Assert.Equal(1, service.CallCount);
        using JsonDocument response = JsonDocument.Parse(ReadSingleResponse(output));
        Assert.Equal("success", response.RootElement.GetProperty("status").GetString());
    }

    private static MemoryStream Frame(byte[] body) => new(FramedBytes(body));

    private static byte[] FramedBytes(byte[] body)
    {
        byte[] framed = new byte[4 + body.Length];
        BinaryPrimitives.WriteUInt32LittleEndian(framed, checked((uint)body.Length));
        body.CopyTo(framed, 4);
        return framed;
    }

    private static byte[] ReadSingleResponse(MemoryStream output)
    {
        byte[] framed = output.ToArray();
        Assert.True(framed.Length >= 4);
        int length = checked((int)BinaryPrimitives.ReadUInt32LittleEndian(framed));
        Assert.Equal(4 + length, framed.Length);
        return framed.AsSpan(4, length).ToArray();
    }

    private static string Fixture(string name) => Path.Combine(AppContext.BaseDirectory, "fixtures", "protocol-v1", name);

    private sealed class FakeImageWriteService : IImageWriteService
    {
        internal int CallCount { get; private set; }
        public HostErrorCode? Write(byte[] pngBytes)
        {
            CallCount++;
            return null;
        }
    }

    private sealed class ThrowsAfterDeclaredFrameStream(byte[] framedRequest) : Stream
    {
        private int offset;

        internal int ReadCalls { get; private set; }
        internal bool ReadPastDeclaredFrame { get; private set; }
        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => false;
        public override long Length => throw new NotSupportedException();
        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public override int Read(byte[] buffer, int bufferOffset, int count) =>
            Read(buffer.AsSpan(bufferOffset, count));

        public override int Read(Span<byte> buffer)
        {
            ReadCalls++;
            if (offset == framedRequest.Length)
            {
                ReadPastDeclaredFrame = true;
                throw new InvalidOperationException("Sentinel: host attempted a post-frame stdin read.");
            }

            int count = Math.Min(buffer.Length, framedRequest.Length - offset);
            framedRequest.AsSpan(offset, count).CopyTo(buffer);
            offset += count;
            return count;
        }

        public override void Flush() => throw new NotSupportedException();
        public override long Seek(long seekOffset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int bufferOffset, int count) => throw new NotSupportedException();
    }

    private sealed class ThrowingWriteStream : Stream
    {
        internal int WriteAttempts { get; private set; }
        public override bool CanRead => false;
        public override bool CanSeek => false;
        public override bool CanWrite => true;
        public override long Length => throw new NotSupportedException();
        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public override void Flush() => throw new InvalidOperationException("Sentinel: stdout flush failed.");
        public override int Read(byte[] buffer, int offset, int count) => throw new NotSupportedException();
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => FailWrite();
        public override void Write(ReadOnlySpan<byte> buffer) => FailWrite();

        private void FailWrite()
        {
            WriteAttempts++;
            throw new InvalidOperationException("Sentinel: stdout write failed.");
        }
    }
}
