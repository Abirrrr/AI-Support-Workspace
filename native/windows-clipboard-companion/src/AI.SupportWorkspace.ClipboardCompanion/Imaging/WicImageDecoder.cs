using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

namespace AI.SupportWorkspace.ClipboardCompanion.Imaging;

internal sealed record DecodedImage(uint Width, uint Height, int Stride, byte[] PremultipliedBgra);

internal interface IImageDecoder
{
    DecodedImage Decode(ValidatedPng png);
}

internal sealed class WicImageDecoder : IImageDecoder
{
    private static readonly Guid ClsidWicImagingFactory = new("cacaf262-9370-4615-a13b-9f5539da4c0a");
    private static readonly Guid IidWicImagingFactory = new("ec5ec8a9-c395-4314-9c77-54d7a935ff70");
    private static readonly Guid ContainerFormatPng = new("1b7cfaf4-713f-473c-bbcd-6137425faeaf");
    private static readonly Guid PixelFormat32BppPbgra = new("6fddc324-4e03-4bfe-b185-3d77768dc910");

    public DecodedImage Decode(ValidatedPng png)
    {
        int comResult = CoInitializeEx(nint.Zero, 0x2);
        if (comResult < 0)
        {
            Marshal.ThrowExceptionForHR(comResult);
        }

        object? factoryObject = null;
        IStream? stream = null;
        IWICBitmapDecoder? decoder = null;
        IWICBitmapFrameDecode? frame = null;
        IWICFormatConverter? converter = null;
        try
        {
            Guid classId = ClsidWicImagingFactory;
            Guid interfaceId = IidWicImagingFactory;
            Marshal.ThrowExceptionForHR(CoCreateInstance(ref classId, nint.Zero, 1, ref interfaceId, out factoryObject));
            var factory = (IWICImagingFactory)factoryObject;

            Marshal.ThrowExceptionForHR(CreateStreamOnHGlobal(nint.Zero, true, out stream));
            stream.Write(png.Bytes, png.Bytes.Length, nint.Zero);
            stream.Seek(0, 0, nint.Zero);

            Marshal.ThrowExceptionForHR(factory.CreateDecoderFromStream(stream, nint.Zero, 1, out decoder));
            Marshal.ThrowExceptionForHR(decoder.GetContainerFormat(out Guid container));
            if (container != ContainerFormatPng)
            {
                throw new InvalidDataException();
            }

            Marshal.ThrowExceptionForHR(decoder.GetFrameCount(out uint frameCount));
            if (frameCount != 1)
            {
                throw new InvalidDataException();
            }

            Marshal.ThrowExceptionForHR(decoder.GetFrame(0, out frame));
            Marshal.ThrowExceptionForHR(frame.GetSize(out uint width, out uint height));
            if (width != png.Width || height != png.Height)
            {
                throw new InvalidDataException();
            }

            Marshal.ThrowExceptionForHR(factory.CreateFormatConverter(out converter));
            Guid destinationFormat = PixelFormat32BppPbgra;
            Marshal.ThrowExceptionForHR(converter.Initialize(frame, ref destinationFormat, 0, nint.Zero, 0, 0));
            Marshal.ThrowExceptionForHR(converter.GetSize(out uint convertedWidth, out uint convertedHeight));
            if (convertedWidth != width || convertedHeight != height)
            {
                throw new InvalidDataException();
            }

            int stride = checked((int)width * 4);
            int size = checked(stride * (int)height);
            if ((ulong)size > HostConstants.MaxDecodedBytes)
            {
                throw new InvalidDataException();
            }

            byte[] pixels = GC.AllocateUninitializedArray<byte>(size);
            unsafe
            {
                fixed (byte* pixelPointer = pixels)
                {
                    Marshal.ThrowExceptionForHR(converter.CopyPixels(
                        nint.Zero,
                        checked((uint)stride),
                        checked((uint)size),
                        (nint)pixelPointer));
                }
            }
            return new DecodedImage(width, height, stride, pixels);
        }
        finally
        {
            Release(converter);
            Release(frame);
            Release(decoder);
            Release(stream);
            Release(factoryObject);
            CoUninitialize();
        }
    }

    private static void Release(object? value)
    {
        if (value is not null && Marshal.IsComObject(value))
        {
            _ = Marshal.FinalReleaseComObject(value);
        }
    }

    [DllImport("ole32.dll")]
    private static extern int CoInitializeEx(nint reserved, uint coInit);

    [DllImport("ole32.dll")]
    private static extern void CoUninitialize();

    [DllImport("ole32.dll")]
    private static extern int CoCreateInstance(
        ref Guid classId,
        nint outer,
        uint context,
        ref Guid interfaceId,
        [MarshalAs(UnmanagedType.Interface)] out object instance);

    [DllImport("ole32.dll")]
    private static extern int CreateStreamOnHGlobal(
        nint globalMemory,
        [MarshalAs(UnmanagedType.Bool)] bool deleteOnRelease,
        out IStream stream);
}

[ComImport]
[Guid("ec5ec8a9-c395-4314-9c77-54d7a935ff70")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IWICImagingFactory
{
    [PreserveSig] int CreateDecoderFromFilename(nint filename, nint vendor, uint access, int options, out nint decoder);
    [PreserveSig] int CreateDecoderFromStream([MarshalAs(UnmanagedType.Interface)] IStream stream, nint vendor, int options, out IWICBitmapDecoder decoder);
    [PreserveSig] int CreateDecoderFromFileHandle(nint file, nint vendor, int options, out nint decoder);
    [PreserveSig] int CreateComponentInfo(ref Guid component, out nint info);
    [PreserveSig] int CreateDecoder(ref Guid container, nint vendor, out nint decoder);
    [PreserveSig] int CreateEncoder(ref Guid container, nint vendor, out nint encoder);
    [PreserveSig] int CreatePalette(out nint palette);
    [PreserveSig] int CreateFormatConverter(out IWICFormatConverter converter);
}

[ComImport]
[Guid("9edde9e7-8dee-47ea-99df-e6faf2ed44bf")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IWICBitmapDecoder
{
    [PreserveSig] int QueryCapability([MarshalAs(UnmanagedType.Interface)] IStream stream, out uint capability);
    [PreserveSig] int Initialize([MarshalAs(UnmanagedType.Interface)] IStream stream, int options);
    [PreserveSig] int GetContainerFormat(out Guid containerFormat);
    [PreserveSig] int GetDecoderInfo(out nint decoderInfo);
    [PreserveSig] int CopyPalette(nint palette);
    [PreserveSig] int GetMetadataQueryReader(out nint metadataReader);
    [PreserveSig] int GetPreview(out nint preview);
    [PreserveSig] int GetColorContexts(uint count, nint contexts, out uint actualCount);
    [PreserveSig] int GetThumbnail(out nint thumbnail);
    [PreserveSig] int GetFrameCount(out uint count);
    [PreserveSig] int GetFrame(uint index, out IWICBitmapFrameDecode frame);
}

[ComImport]
[Guid("00000120-a8f2-4877-ba0a-fd2b6645fb94")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IWICBitmapSource
{
    [PreserveSig] int GetSize(out uint width, out uint height);
    [PreserveSig] int GetPixelFormat(out Guid pixelFormat);
    [PreserveSig] int GetResolution(out double dpiX, out double dpiY);
    [PreserveSig] int CopyPalette(nint palette);
    [PreserveSig] int CopyPixels(nint rectangle, uint stride, uint bufferSize, nint buffer);
}

[ComImport]
[Guid("3b16811b-6a43-4ec9-a813-3d930c13b940")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IWICBitmapFrameDecode : IWICBitmapSource
{
    [PreserveSig] new int GetSize(out uint width, out uint height);
    [PreserveSig] new int GetPixelFormat(out Guid pixelFormat);
    [PreserveSig] new int GetResolution(out double dpiX, out double dpiY);
    [PreserveSig] new int CopyPalette(nint palette);
    [PreserveSig] new int CopyPixels(nint rectangle, uint stride, uint bufferSize, nint buffer);
    [PreserveSig] int GetMetadataQueryReader(out nint metadataReader);
    [PreserveSig] int GetColorContexts(uint count, nint contexts, out uint actualCount);
    [PreserveSig] int GetThumbnail(out nint thumbnail);
}

[ComImport]
[Guid("00000301-a8f2-4877-ba0a-fd2b6645fb94")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IWICFormatConverter : IWICBitmapSource
{
    [PreserveSig] new int GetSize(out uint width, out uint height);
    [PreserveSig] new int GetPixelFormat(out Guid pixelFormat);
    [PreserveSig] new int GetResolution(out double dpiX, out double dpiY);
    [PreserveSig] new int CopyPalette(nint palette);
    [PreserveSig] new int CopyPixels(nint rectangle, uint stride, uint bufferSize, nint buffer);
    [PreserveSig] int Initialize(IWICBitmapSource source, ref Guid destinationFormat, int dither, nint palette, double alphaThreshold, int paletteTranslate);
    [PreserveSig] int CanConvert(ref Guid sourceFormat, ref Guid destinationFormat, [MarshalAs(UnmanagedType.Bool)] out bool canConvert);
}
