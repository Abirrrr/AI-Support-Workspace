using System.Buffers.Binary;
using System.Text;

namespace AI.SupportWorkspace.ClipboardCompanion.Protocol;

internal readonly record struct FrameReadResult(byte[]? Body, HostErrorCode? Error)
{
    internal static FrameReadResult Success(byte[] body) => new(body, null);
    internal static FrameReadResult Failure(HostErrorCode error) => new(null, error);
}

internal static class NativeMessageFraming
{
    private static readonly UTF8Encoding StrictUtf8 = new(false, true);

    internal static FrameReadResult ReadRequest(Stream input)
    {
        Span<byte> prefix = stackalloc byte[4];
        if (!ReadExactly(input, prefix))
        {
            return FrameReadResult.Failure(HostErrorCode.InvalidRequest);
        }

        uint length = BinaryPrimitives.ReadUInt32LittleEndian(prefix);
        if (length > HostConstants.MaxRequestBytes)
        {
            return FrameReadResult.Failure(HostErrorCode.PayloadTooLarge);
        }

        if (length == 0)
        {
            return FrameReadResult.Failure(HostErrorCode.InvalidRequest);
        }

        byte[] body = GC.AllocateUninitializedArray<byte>(checked((int)length));
        if (!ReadExactly(input, body))
        {
            return FrameReadResult.Failure(HostErrorCode.InvalidRequest);
        }

        try
        {
            _ = StrictUtf8.GetCharCount(body);
        }
        catch (DecoderFallbackException)
        {
            return FrameReadResult.Failure(HostErrorCode.InvalidRequest);
        }

        return FrameReadResult.Success(body);
    }

    internal static void WriteResponse(Stream output, ReadOnlySpan<byte> json)
    {
        if (json.Length > HostConstants.MaxResponseBytes)
        {
            throw new InvalidOperationException("Response exceeded the frozen protocol bound.");
        }

        Span<byte> prefix = stackalloc byte[4];
        BinaryPrimitives.WriteUInt32LittleEndian(prefix, checked((uint)json.Length));
        output.Write(prefix);
        output.Write(json);
        output.Flush();
    }

    private static bool ReadExactly(Stream stream, Span<byte> destination)
    {
        int offset = 0;
        while (offset < destination.Length)
        {
            int read = stream.Read(destination[offset..]);
            if (read == 0)
            {
                return false;
            }

            offset += read;
        }

        return true;
    }
}
