using System.Buffers.Binary;
using AI.SupportWorkspace.ClipboardCompanion.Clipboard;
using AI.SupportWorkspace.ClipboardCompanion.Imaging;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

public sealed class DibV5Tests
{
    private static readonly DecodedImage Image = new(
        2,
        2,
        8,
        [
            0, 0, 255, 255, 0, 128, 0, 128,
            64, 0, 0, 64, 0, 0, 0, 0,
        ]);

    [Fact]
    public void HeaderMatchesBitmapV5Contract()
    {
        byte[] dib = DibV5Builder.Build(Image);
        Assert.Equal(124 + 16, dib.Length);
        Assert.Equal((uint)124, U32(dib, 0));
        Assert.Equal(2, I32(dib, 4));
        Assert.Equal(2, I32(dib, 8));
        Assert.Equal((ushort)1, U16(dib, 12));
        Assert.Equal((ushort)32, U16(dib, 14));
        Assert.Equal((uint)3, U32(dib, 16));
        Assert.Equal((uint)16, U32(dib, 20));
        Assert.Equal(DibV5Builder.RedMask, U32(dib, 40));
        Assert.Equal(DibV5Builder.GreenMask, U32(dib, 44));
        Assert.Equal(DibV5Builder.BlueMask, U32(dib, 48));
        Assert.Equal(DibV5Builder.AlphaMask, U32(dib, 52));
        Assert.Equal(DibV5Builder.SrgbColorSpace, U32(dib, 56));
        Assert.Equal(DibV5Builder.ImagesIntent, U32(dib, 108));
    }

    [Fact]
    public void PixelRowsAreBottomUpAndPremultipliedAlphaIsPreserved()
    {
        byte[] dib = DibV5Builder.Build(Image);
        Assert.Equal(new byte[]
        {
            64, 0, 0, 64, 0, 0, 0, 0,
            0, 0, 255, 255, 0, 128, 0, 128,
        }, dib[124..]);
    }

    [Fact]
    public void PayloadHasNoBitmapFileHeader()
    {
        byte[] dib = DibV5Builder.Build(Image);
        Assert.NotEqual((byte)'B', dib[0]);
        Assert.NotEqual((byte)'M', dib[1]);
        Assert.Equal((uint)124, U32(dib, 0));
    }

    [Fact]
    public void RejectsInexactStrideOrBuffer()
    {
        Assert.Throws<ArgumentException>(() => DibV5Builder.Build(new DecodedImage(2, 2, 7, new byte[14])));
    }

    private static ushort U16(byte[] value, int offset) => BinaryPrimitives.ReadUInt16LittleEndian(value.AsSpan(offset));
    private static uint U32(byte[] value, int offset) => BinaryPrimitives.ReadUInt32LittleEndian(value.AsSpan(offset));
    private static int I32(byte[] value, int offset) => BinaryPrimitives.ReadInt32LittleEndian(value.AsSpan(offset));
}
