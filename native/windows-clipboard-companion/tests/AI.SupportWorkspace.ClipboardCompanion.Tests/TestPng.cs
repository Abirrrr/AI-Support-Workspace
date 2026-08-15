using System.Buffers.Binary;
using System.IO.Compression;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

internal static class TestPng
{
    internal static byte[] Rgba2X2()
    {
        byte[] pixels =
        [
            255, 0, 0, 255, 0, 255, 0, 128,
            0, 0, 255, 64, 255, 255, 255, 0,
        ];
        return Create(2, 2, 6, pixels);
    }

    internal static byte[] HeaderOnly(uint width, uint height) => Create(width, height, 6, []);

    internal static byte[] Create(uint width, uint height, byte colorType, byte[] rgba)
    {
        using var output = new MemoryStream();
        output.Write([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        Span<byte> header = stackalloc byte[13];
        BinaryPrimitives.WriteUInt32BigEndian(header, width);
        BinaryPrimitives.WriteUInt32BigEndian(header[4..], height);
        header[8] = 8;
        header[9] = colorType;
        WriteChunk(output, "IHDR"u8, header);

        byte[] compressed;
        using (var compressedOutput = new MemoryStream())
        {
            using (var zlib = new ZLibStream(compressedOutput, CompressionLevel.SmallestSize, true))
            {
                if (rgba.Length != 0)
                {
                    int stride = checked((int)width * 4);
                    for (int row = 0; row < height; row++)
                    {
                        zlib.WriteByte(0);
                        zlib.Write(rgba, checked(row * stride), stride);
                    }
                }
            }

            compressed = compressedOutput.ToArray();
        }

        WriteChunk(output, "IDAT"u8, compressed);
        WriteChunk(output, "IEND"u8, []);
        return output.ToArray();
    }

    internal static void WriteChunk(Stream output, ReadOnlySpan<byte> type, ReadOnlySpan<byte> data)
    {
        Span<byte> length = stackalloc byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(length, checked((uint)data.Length));
        output.Write(length);
        output.Write(type);
        output.Write(data);
        byte[] crcInput = new byte[type.Length + data.Length];
        type.CopyTo(crcInput);
        data.CopyTo(crcInput.AsSpan(type.Length));
        Span<byte> crc = stackalloc byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(crc, Crc32(crcInput));
        output.Write(crc);
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
