using AI.SupportWorkspace.ClipboardCompanion.Imaging;
using AI.SupportWorkspace.ClipboardCompanion.Protocol;
using System.Runtime.InteropServices;

namespace AI.SupportWorkspace.ClipboardCompanion.Clipboard;

internal interface IImageWriteService
{
    HostErrorCode? Write(byte[] pngBytes);
}

internal sealed class ImageWriteService(
    IImageDecoder decoder,
    IClipboardPlatform platform,
    ICompanionWindowFactory windowFactory,
    IBackoff backoff) : IImageWriteService
{
    internal const string MutexName = @"Local\AI.SupportWorkspace.ClipboardCompanion.Write.v1";

    internal static ImageWriteService CreateDefault() => new(
        new WicImageDecoder(),
        new Win32ClipboardPlatform(),
        new CompanionWindowFactory(),
        new ThreadBackoff());

    public HostErrorCode? Write(byte[] pngBytes)
    {
        using var mutex = new Mutex(false, MutexName);
        bool acquired;
        try
        {
            acquired = mutex.WaitOne(0);
        }
        catch (AbandonedMutexException)
        {
            acquired = true;
        }

        if (!acquired)
        {
            return HostErrorCode.ClipboardBusy;
        }

        try
        {
            PngValidationResult validation = PngValidator.Validate(pngBytes);
            if (validation.Error is HostErrorCode validationError)
            {
                return validationError;
            }

            DecodedImage decoded;
            try
            {
                decoded = decoder.Decode(validation.Png!);
            }
            catch (Exception exception) when (exception is COMException or InvalidDataException or ArgumentException or OverflowException or OutOfMemoryException)
            {
                return HostErrorCode.ImageDecodeFailed;
            }

            uint pngFormat = platform.RegisterPngFormat();
            if (pngFormat == 0)
            {
                return HostErrorCode.ClipboardWriteFailed;
            }

            try
            {
                using GlobalMemory pngMemory = GlobalMemory.FromBytes(pngBytes);
                using GlobalMemory dibMemory = GlobalMemory.FromDibV5(decoded);
                ICompanionWindow window;
                try
                {
                    window = windowFactory.Create();
                }
                catch (InvalidOperationException)
                {
                    return HostErrorCode.ClipboardOpenFailed;
                }

                using (window)
                {
                    if (window.Handle == nint.Zero)
                    {
                        return HostErrorCode.ClipboardOpenFailed;
                    }

                    return new ClipboardTransaction(platform, backoff)
                        .Write(window.Handle, pngFormat, pngMemory, dibMemory);
                }
            }
            catch (Exception exception) when (exception is OutOfMemoryException or ArgumentException or OverflowException)
            {
                return HostErrorCode.ClipboardWriteFailed;
            }
        }
        finally
        {
            mutex.ReleaseMutex();
        }
    }
}
