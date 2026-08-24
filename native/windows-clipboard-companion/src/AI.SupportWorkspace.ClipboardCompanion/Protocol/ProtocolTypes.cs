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
    ForegroundUnavailable,
    NotForeground,
    ClipboardChanged,
    UnsafeKeyboardState,
    PasteBusy,
    InputInjectionFailed,
    Indeterminate,
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
        HostErrorCode.ForegroundUnavailable => "foreground-unavailable",
        HostErrorCode.NotForeground => "not-foreground",
        HostErrorCode.ClipboardChanged => "clipboard-changed",
        HostErrorCode.UnsafeKeyboardState => "unsafe-keyboard-state",
        HostErrorCode.PasteBusy => "paste-busy",
        HostErrorCode.InputInjectionFailed => "input-injection-failed",
        HostErrorCode.Indeterminate => "indeterminate",
        _ => "internal-failure",
    };
}

internal abstract record ProtocolRequest(int ProtocolVersion, string RequestId);
internal sealed record GetCapabilitiesRequest(int Version, string Id) : ProtocolRequest(Version, Id);
internal sealed record WriteImagePngRequest(int Version, string Id, byte[] PngBytes) : ProtocolRequest(Version, Id);
internal sealed record CapturePasteContextRequest(string Id, string ActivationId) : ProtocolRequest(2, Id);
internal sealed record PasteClipboardRequest(
    string Id,
    string ActivationId,
    nint ExpectedForegroundHwnd,
    nint ExpectedRootHwnd,
    uint ExpectedProcessId,
    uint ExpectedClipboardSequenceNumber) : ProtocolRequest(2, Id);

internal readonly record struct ProtocolParseResult(
    ProtocolRequest? Request,
    HostErrorCode? Error,
    string? RequestId,
    int? ProtocolVersion)
{
    internal static ProtocolParseResult Success(ProtocolRequest request) => new(request, null, request.RequestId, request.ProtocolVersion);
    internal static ProtocolParseResult Failure(HostErrorCode error, string? requestId, int? protocolVersion = null) => new(null, error, requestId, protocolVersion);
}
