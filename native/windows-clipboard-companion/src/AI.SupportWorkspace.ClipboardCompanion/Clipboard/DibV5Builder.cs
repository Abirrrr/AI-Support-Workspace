using System.Runtime.InteropServices;
using AI.SupportWorkspace.ClipboardCompanion.Imaging;

namespace AI.SupportWorkspace.ClipboardCompanion.Clipboard;

internal static class DibV5Builder
{
    internal const int HeaderSize = 124;
    internal const uint RedMask = 0x00ff0000;
    internal const uint GreenMask = 0x0000ff00;
    internal const uint BlueMask = 0x000000ff;
    internal const uint AlphaMask = 0xff000000;
    internal const uint SrgbColorSpace = 0x73524742;
    internal const uint ImagesIntent = 4;

    static DibV5Builder()
    {
        if (Marshal.SizeOf<BitmapV5Header>() != HeaderSize)
        {
            throw new TypeLoadException("Unexpected BITMAPV5HEADER layout.");
        }
    }

    internal static int GetTotalSize(DecodedImage image) => checked(HeaderSize + image.PremultipliedBgra.Length);

    internal static byte[] Build(DecodedImage image)
    {
        byte[] result = GC.AllocateUninitializedArray<byte>(GetTotalSize(image));
        Write(image, result);
        return result;
    }

    internal static void Write(DecodedImage image, Span<byte> destination)
    {
        Validate(image, destination.Length);
        BitmapV5Header header = CreateHeader(image);
        MemoryMarshal.Write(destination, in header);
        Span<byte> pixels = destination[HeaderSize..];
        int height = checked((int)image.Height);
        for (int sourceRow = 0; sourceRow < height; sourceRow++)
        {
            int destinationRow = height - 1 - sourceRow;
            image.PremultipliedBgra.AsSpan(sourceRow * image.Stride, image.Stride)
                .CopyTo(pixels.Slice(destinationRow * image.Stride, image.Stride));
        }
    }

    private static BitmapV5Header CreateHeader(DecodedImage image) => new()
    {
        Size = HeaderSize,
        Width = checked((int)image.Width),
        Height = checked((int)image.Height),
        Planes = 1,
        BitCount = 32,
        Compression = 3,
        SizeImage = checked((uint)image.PremultipliedBgra.Length),
        RedMask = RedMask,
        GreenMask = GreenMask,
        BlueMask = BlueMask,
        AlphaMask = AlphaMask,
        ColorSpaceType = SrgbColorSpace,
        Intent = ImagesIntent,
    };

    private static void Validate(DecodedImage image, int destinationLength)
    {
        int width = checked((int)image.Width);
        int height = checked((int)image.Height);
        int stride = checked(width * 4);
        int imageSize = checked(stride * height);
        if (image.Width == 0
            || image.Height == 0
            || image.Stride != stride
            || image.PremultipliedBgra.Length != imageSize
            || (ulong)imageSize > HostConstants.MaxDecodedBytes
            || destinationLength != checked(HeaderSize + imageSize))
        {
            throw new ArgumentException("Invalid decoded image shape.");
        }
    }
}

[StructLayout(LayoutKind.Sequential)]
internal struct BitmapV5Header
{
    internal uint Size;
    internal int Width;
    internal int Height;
    internal ushort Planes;
    internal ushort BitCount;
    internal uint Compression;
    internal uint SizeImage;
    internal int XPelsPerMeter;
    internal int YPelsPerMeter;
    internal uint ClrUsed;
    internal uint ClrImportant;
    internal uint RedMask;
    internal uint GreenMask;
    internal uint BlueMask;
    internal uint AlphaMask;
    internal uint ColorSpaceType;
    internal int EndpointRedX;
    internal int EndpointRedY;
    internal int EndpointRedZ;
    internal int EndpointGreenX;
    internal int EndpointGreenY;
    internal int EndpointGreenZ;
    internal int EndpointBlueX;
    internal int EndpointBlueY;
    internal int EndpointBlueZ;
    internal uint GammaRed;
    internal uint GammaGreen;
    internal uint GammaBlue;
    internal uint Intent;
    internal uint ProfileData;
    internal uint ProfileSize;
    internal uint Reserved;
}
