using System.Buffers.Binary;

namespace AI.SupportWorkspace.ClipboardCompanion.Imaging;

internal sealed record ValidatedPng(byte[] Bytes, uint Width, uint Height);

internal readonly record struct PngValidationResult(ValidatedPng? Png, Protocol.HostErrorCode? Error)
{
    internal static PngValidationResult Success(ValidatedPng png) => new(png, null);
    internal static PngValidationResult Failure(Protocol.HostErrorCode error) => new(null, error);
}

internal static class PngValidator
{
    private static ReadOnlySpan<byte> Signature => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    internal static PngValidationResult Validate(byte[] bytes)
    {
        if (bytes.Length < 33 || !bytes.AsSpan(0, 8).SequenceEqual(Signature))
        {
            return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
        }

        int offset = 8;
        bool seenHeader = false;
        bool seenData = false;
        bool seenEnd = false;
        uint width = 0;
        uint height = 0;

        while (offset < bytes.Length)
        {
            if (bytes.Length - offset < 12)
            {
                return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
            }

            uint chunkLength = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset, 4));
            if (chunkLength > int.MaxValue)
            {
                return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
            }

            int length = (int)chunkLength;
            int chunkEnd;
            try
            {
                chunkEnd = checked(offset + 12 + length);
            }
            catch (OverflowException)
            {
                return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
            }

            if (chunkEnd > bytes.Length)
            {
                return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
            }

            ReadOnlySpan<byte> type = bytes.AsSpan(offset + 4, 4);
            if (!IsChunkType(type))
            {
                return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
            }

            uint expectedCrc = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset + 8 + length, 4));
            uint actualCrc = Crc32(bytes.AsSpan(offset + 4, 4 + length));
            if (expectedCrc != actualCrc)
            {
                return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
            }

            if (!seenHeader)
            {
                if (!type.SequenceEqual("IHDR"u8) || length != 13)
                {
                    return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
                }

                width = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset + 8, 4));
                height = BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset + 12, 4));
                if (width == 0 || height == 0 || !IsValidHeader(bytes.AsSpan(offset + 8, 13)))
                {
                    return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
                }

                seenHeader = true;
            }
            else if (type.SequenceEqual("IHDR"u8))
            {
                return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
            }
            else if (type.SequenceEqual("IDAT"u8))
            {
                if (seenEnd)
                {
                    return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
                }

                seenData = true;
            }
            else if (type.SequenceEqual("IEND"u8))
            {
                if (length != 0 || !seenData || seenEnd)
                {
                    return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
                }

                seenEnd = true;
                if (chunkEnd != bytes.Length)
                {
                    return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
                }
            }

            offset = chunkEnd;
        }

        if (!seenHeader || !seenData || !seenEnd)
        {
            return PngValidationResult.Failure(Protocol.HostErrorCode.InvalidPng);
        }

        if (width > HostConstants.MaxAxis || height > HostConstants.MaxAxis)
        {
            return PngValidationResult.Failure(Protocol.HostErrorCode.ImageTooLarge);
        }

        ulong pixels = checked((ulong)width * height);
        ulong decodedBytes = checked(pixels * 4);
        if (pixels > HostConstants.MaxPixels || decodedBytes > HostConstants.MaxDecodedBytes)
        {
            return PngValidationResult.Failure(Protocol.HostErrorCode.ImageTooLarge);
        }

        return PngValidationResult.Success(new ValidatedPng(bytes, width, height));
    }

    private static bool IsValidHeader(ReadOnlySpan<byte> header)
    {
        byte bitDepth = header[8];
        byte colorType = header[9];
        bool depthValid = colorType switch
        {
            0 => bitDepth is 1 or 2 or 4 or 8 or 16,
            2 => bitDepth is 8 or 16,
            3 => bitDepth is 1 or 2 or 4 or 8,
            4 => bitDepth is 8 or 16,
            6 => bitDepth is 8 or 16,
            _ => false,
        };
        return depthValid && header[10] == 0 && header[11] == 0 && header[12] <= 1;
    }

    private static bool IsChunkType(ReadOnlySpan<byte> type)
    {
        foreach (byte value in type)
        {
            if (value is not (>= (byte)'A' and <= (byte)'Z')
                and not (>= (byte)'a' and <= (byte)'z'))
            {
                return false;
            }
        }

        return true;
    }

    private static uint Crc32(ReadOnlySpan<byte> data)
    {
        uint crc = 0xffffffff;
        foreach (byte value in data)
        {
            crc ^= value;
            for (int bit = 0; bit < 8; bit++)
            {
                crc = (crc >> 1) ^ (0xedb88320u & unchecked((uint)-(int)(crc & 1)));
            }
        }

        return ~crc;
    }
}
