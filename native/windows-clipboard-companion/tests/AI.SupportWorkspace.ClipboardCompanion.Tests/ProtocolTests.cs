using System.Text;
using AI.SupportWorkspace.ClipboardCompanion.Imaging;
using AI.SupportWorkspace.ClipboardCompanion.Protocol;

namespace AI.SupportWorkspace.ClipboardCompanion.Tests;

public sealed class ProtocolTests
{
    private const string Id = "0123456789abcdef0123456789abcdef";

    [Fact]
    public void ParsesCapabilitiesFixture()
    {
        ProtocolParseResult result = Parse(File.ReadAllText(Fixture("get-capabilities.request.json")));
        Assert.IsType<GetCapabilitiesRequest>(result.Request);
        Assert.Null(result.Error);
    }

    [Fact]
    public void ParsesValidImageRequest()
    {
        byte[] png = TestPng.Rgba2X2();
        ProtocolParseResult result = Parse(ImageRequest(Convert.ToBase64String(png), png.Length));
        var request = Assert.IsType<WriteImagePngRequest>(result.Request);
        Assert.Equal(png, request.PngBytes);
    }

    [Fact]
    public void MinimalImageGoldenFixtureIsAValidPngRequest()
    {
        ProtocolParseResult result = Parse(ReadFixture("write-image-png.request.json"));
        var request = Assert.IsType<WriteImagePngRequest>(result.Request);
        Assert.Null(PngValidator.Validate(request.PngBytes).Error);
    }

    [Theory]
    [InlineData("{}")]
    [InlineData("{")]
    [InlineData("null")]
    [InlineData("[]")]
    [InlineData("{\"protocolVersion\":1,\"requestId\":\"0123456789abcdef0123456789abcdef\"}")]
    [InlineData("{\"protocolVersion\":1,\"requestId\":null,\"operation\":\"get-capabilities\"}")]
    [InlineData("{\"protocolVersion\":\"1\",\"requestId\":\"0123456789abcdef0123456789abcdef\",\"operation\":\"get-capabilities\"}")]
    [InlineData("{\"protocolVersion\":1,\"requestId\":\"0123456789abcdef0123456789abcdef\",\"operation\":\"get-capabilities\",\"extra\":true}")]
    [InlineData("{\"protocolVersion\":1,\"requestId\":\"0123456789abcdef0123456789abcdef\",\"requestId\":\"0123456789abcdef0123456789abcdef\",\"operation\":\"get-capabilities\"}")]
    [InlineData("{\"protocolVersion\":1,\"requestId\":\"0123456789abcdef0123456789abcdef\",\"operation\":\"get-capabilities\",\"__proto__\":{}}")]
    public void RejectsInexactSchemas(string json) =>
        Assert.Equal(HostErrorCode.InvalidRequest, Parse(json).Error);

    [Theory]
    [InlineData("0123456789ABCDEF0123456789ABCDEF")]
    [InlineData("0123456789abcdef")]
    [InlineData("g123456789abcdef0123456789abcdef")]
    public void RejectsMalformedRequestIds(string id)
    {
        ProtocolParseResult result = Parse($"{{\"protocolVersion\":1,\"requestId\":\"{id}\",\"operation\":\"get-capabilities\"}}");
        Assert.Equal(HostErrorCode.InvalidRequest, result.Error);
        Assert.Null(result.RequestId);
    }

    [Fact]
    public void ReportsUnsupportedOperation()
    {
        ProtocolParseResult result = Parse($"{{\"protocolVersion\":1,\"requestId\":\"{Id}\",\"operation\":\"run-command\"}}");
        Assert.Equal(HostErrorCode.UnsupportedOperation, result.Error);
    }

    [Fact]
    public void UnsupportedVersionWinsBeforeV1FieldRules()
    {
        ProtocolParseResult result = Parse($"{{\"protocolVersion\":2,\"requestId\":\"{Id}\",\"future\":{{\"anything\":true}}}}");
        Assert.Equal(HostErrorCode.ProtocolVersionUnsupported, result.Error);
        Assert.Equal(Id, result.RequestId);
    }

    [Fact]
    public void RejectsUnknownImageField()
    {
        string request = ImageRequest("AA==", 1).Replace("\"data\":", "\"filename\":\"x\",\"data\":", StringComparison.Ordinal);
        Assert.Equal(HostErrorCode.InvalidRequest, Parse(request).Error);
    }

    [Theory]
    [InlineData("YQ==", 1)]
    [InlineData("YWJj", 3)]
    public void AcceptsCanonicalBase64(string data, int length)
    {
        Assert.True(CanonicalBase64.TryDecode(data, length, out byte[] decoded, out _));
        Assert.Equal(length, decoded.Length);
    }

    [Theory]
    [InlineData("Y Q==", 1)]
    [InlineData("YQ--", 3)]
    [InlineData("YQ=", 1)]
    [InlineData("YR==", 1)]
    [InlineData("YWJ=", 2)]
    public void RejectsNoncanonicalBase64(string data, int length) =>
        Assert.False(CanonicalBase64.TryDecode(data, length, out _, out _));

    [Fact]
    public void RejectsDeclaredLengthMismatch()
    {
        Assert.Equal(HostErrorCode.InvalidBase64, Parse(ImageRequest("YQ==", 2)).Error);
    }

    [Fact]
    public void RejectsDecodedPayloadOverFiveMebibytesBeforeDecode()
    {
        string json = $"{{\"protocolVersion\":1,\"requestId\":\"{Id}\",\"operation\":\"write-image-png\",\"image\":{{\"encoding\":\"base64\",\"byteLength\":5242881,\"data\":\"AA==\"}}}}";
        Assert.Equal(HostErrorCode.PayloadTooLarge, Parse(json).Error);
    }

    [Fact]
    public void GoldenResponsesAreExact()
    {
        Assert.Equal(ReadFixture("get-capabilities.success.json"), Encoding.UTF8.GetString(ProtocolJson.CapabilitiesSuccess(Id)));
        Assert.Equal(ReadFixture("invalid-png.error.json").Replace("fedcba9876543210fedcba9876543210", Id, StringComparison.Ordinal), Encoding.UTF8.GetString(ProtocolJson.Error(Id, HostErrorCode.InvalidPng)));
    }

    private static ProtocolParseResult Parse(string json) => ProtocolParser.Parse(Encoding.UTF8.GetBytes(json));

    private static string ImageRequest(string data, int length) =>
        $"{{\"protocolVersion\":1,\"requestId\":\"{Id}\",\"operation\":\"write-image-png\",\"image\":{{\"encoding\":\"base64\",\"byteLength\":{length},\"data\":\"{data}\"}}}}";

    private static string Fixture(string name) => Path.Combine(AppContext.BaseDirectory, "fixtures", "protocol-v1", name);
    private static string ReadFixture(string name) => File.ReadAllText(Fixture(name)).TrimEnd('\r', '\n');
}
