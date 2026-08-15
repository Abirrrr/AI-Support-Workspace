namespace AI.SupportWorkspace.ClipboardCompanion.Protocol;

internal enum HostErrorCode
{
    ProtocolVersionUnsupported,
    InvalidRequest,
    UnsupportedOperation,
    PayloadTooLarge,
    InvalidBase64,
    InvalidPng,
    ImageTooLarge,
    ImageDecodeFailed,
    ClipboardBusy,
    ClipboardOpenFailed,
    ClipboardWriteFailed,
    ClipboardCloseFailed,
    InternalFailure,
}

internal static class HostErrorCodeExtensions
{
    internal static string ToProtocolValue(this HostErrorCode code) => code switch
    {
        HostErrorCode.ProtocolVersionUnsupported => "protocol-version-unsupported",
        HostErrorCode.InvalidRequest => "invalid-request",
        HostErrorCode.UnsupportedOperation => "unsupported-operation",
        HostErrorCode.PayloadTooLarge => "payload-too-large",
        HostErrorCode.InvalidBase64 => "invalid-base64",
        HostErrorCode.InvalidPng => "invalid-png",
        HostErrorCode.ImageTooLarge => "image-too-large",
        HostErrorCode.ImageDecodeFailed => "image-decode-failed",
        HostErrorCode.ClipboardBusy => "clipboard-busy",
        HostErrorCode.ClipboardOpenFailed => "clipboard-open-failed",
        HostErrorCode.ClipboardWriteFailed => "clipboard-write-failed",
        HostErrorCode.ClipboardCloseFailed => "clipboard-close-failed",
        _ => "internal-failure",
    };
}

internal abstract record ProtocolRequest(string RequestId);
internal sealed record GetCapabilitiesRequest(string Id) : ProtocolRequest(Id);
internal sealed record WriteImagePngRequest(string Id, byte[] PngBytes) : ProtocolRequest(Id);

internal readonly record struct ProtocolParseResult(
    ProtocolRequest? Request,
    HostErrorCode? Error,
    string? RequestId)
{
    internal static ProtocolParseResult Success(ProtocolRequest request) => new(request, null, request.RequestId);
    internal static ProtocolParseResult Failure(HostErrorCode error, string? requestId) => new(null, error, requestId);
}
