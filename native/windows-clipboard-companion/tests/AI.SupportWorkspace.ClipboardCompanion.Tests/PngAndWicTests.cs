using AI.SupportWorkspace.ClipboardCompanion.Imaging;
using AI.SupportWorkspace.ClipboardCompanion.Protocol;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

public sealed class PngAndWicTests
{
    [Fact]
    public void ValidPngPassesWithDimensions()
    {
        byte[] bytes = TestPng.Rgba2X2();
        PngValidationResult result = PngValidator.Validate(bytes);
        Assert.Null(result.Error);
        Assert.Equal((uint)2, result.Png!.Width);
        Assert.Equal((uint)2, result.Png.Height);
        Assert.Same(bytes, result.Png.Bytes);
    }

    [Fact]
    public void RejectsInvalidSignature()
    {
        byte[] bytes = TestPng.Rgba2X2();
        bytes[0] = 0;
        Assert.Equal(HostErrorCode.InvalidPng, PngValidator.Validate(bytes).Error);
    }

    [Fact]
    public void RejectsMissingFirstIhdr()
    {
        byte[] bytes = TestPng.Rgba2X2();
        bytes[12] = (byte)'X';
        Assert.Equal(HostErrorCode.InvalidPng, PngValidator.Validate(bytes).Error);
    }

    [Fact]
    public void RejectsInvalidIhdrSize()
    {
        byte[] bytes = TestPng.Rgba2X2();
        bytes[11] = 12;
        Assert.Equal(HostErrorCode.InvalidPng, PngValidator.Validate(bytes).Error);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 0)]
    public void RejectsZeroDimensions(uint width, uint height) =>
        Assert.Equal(HostErrorCode.InvalidPng, PngValidator.Validate(TestPng.HeaderOnly(width, height)).Error);

    [Theory]
    [InlineData(8193, 1)]
    [InlineData(1, 8193)]
    public void RejectsAxisLimit(uint width, uint height) =>
        Assert.Equal(HostErrorCode.ImageTooLarge, PngValidator.Validate(TestPng.HeaderOnly(width, height)).Error);

    [Theory]
    [InlineData(8192, 2049)]
    [InlineData(4097, 4096)]
    public void RejectsPixelAndDecodedMemoryLimits(uint width, uint height) =>
        Assert.Equal(HostErrorCode.ImageTooLarge, PngValidator.Validate(TestPng.HeaderOnly(width, height)).Error);

    [Fact]
    public void RejectsTruncatedChunk()
    {
        byte[] bytes = TestPng.Rgba2X2()[..^3];
        Assert.Equal(HostErrorCode.InvalidPng, PngValidator.Validate(bytes).Error);
    }

    [Fact]
    public void RejectsCrcMismatch()
    {
        byte[] bytes = TestPng.Rgba2X2();
        bytes[29] ^= 1;
        Assert.Equal(HostErrorCode.InvalidPng, PngValidator.Validate(bytes).Error);
    }

    [Fact]
    public void WicDecodesDeterministicallyToPremultipliedBgra()
    {
        ValidatedPng png = PngValidator.Validate(TestPng.Rgba2X2()).Png!;
        DecodedImage first = DecodeOnSta(png);
        DecodedImage second = DecodeOnSta(png);
        Assert.Equal((uint)2, first.Width);
        Assert.Equal((uint)2, first.Height);
        Assert.Equal(8, first.Stride);
        Assert.Equal(first.PremultipliedBgra, second.PremultipliedBgra);
        Assert.Equal(new byte[]
        {
            0, 0, 255, 255, 0, 128, 0, 128,
            64, 0, 0, 64, 0, 0, 0, 0,
        }, first.PremultipliedBgra);
    }

    [Fact]
    public void WicRejectsStructurallyEligibleButUndecodablePng()
    {
        ValidatedPng png = PngValidator.Validate(TestPng.HeaderOnly(1, 1)).Png!;
        Assert.ThrowsAny<Exception>(() => DecodeOnSta(png));
    }

    private static DecodedImage DecodeOnSta(ValidatedPng png)
    {
        DecodedImage? decoded = null;
        Exception? failure = null;
        var thread = new Thread(() =>
        {
            try
            {
                decoded = new WicImageDecoder().Decode(png);
            }
            catch (Exception exception)
            {
                failure = exception;
            }
        });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();
        if (failure is not null)
        {
            throw failure;
        }

        return decoded!;
    }
}
