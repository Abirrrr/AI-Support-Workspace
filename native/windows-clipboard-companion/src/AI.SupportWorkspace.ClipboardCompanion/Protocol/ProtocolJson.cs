using System.Buffers;
using System.Text.Json;
using AI.SupportWorkspace.ClipboardCompanion.Clipboard;

namespace AI.SupportWorkspace.ClipboardCompanion.Protocol;

internal static class ProtocolJson
{
    internal static byte[] CapabilitiesSuccess(string requestId) => Write(writer =>
    {
        WriteSuccessEnvelope(writer, requestId);
        writer.WriteStartObject("result");
        writer.WriteString("operation", "get-capabilities");
        writer.WriteStartArray("supportedProtocolVersions");
        writer.WriteNumberValue(1);
        writer.WriteEndArray();
        writer.WriteStartArray("supportedOperations");
        writer.WriteStringValue("write-image-png");
        writer.WriteEndArray();
        writer.WriteNumber("maxPngBytes", HostConstants.MaxPngBytes);
        WriteClipboardFormats(writer);
        writer.WriteEndObject();
        writer.WriteEndObject();
    });

    internal static byte[] CapabilitiesV2Success(string requestId) => Write(writer =>
    {
        WriteSuccessEnvelope(writer, 2, requestId);
        writer.WriteStartObject("result");
        writer.WriteString("operation", "get-capabilities");
        writer.WriteStartArray("supportedProtocolVersions");
        writer.WriteNumberValue(1);
        writer.WriteNumberValue(2);
        writer.WriteEndArray();
        writer.WriteStartArray("supportedOperations");
        writer.WriteStringValue("write-image-png");
        writer.WriteStringValue("capture-paste-context");
        writer.WriteStringValue("paste-clipboard");
        writer.WriteEndArray();
        writer.WriteNumber("maxPngBytes", HostConstants.MaxPngBytes);
        WriteClipboardFormats(writer);
        writer.WriteEndObject();
        writer.WriteEndObject();
    });

    internal static byte[] WriteSuccess(string requestId) => Write(writer =>
        WriteImageSuccess(writer, 1, requestId));

    internal static byte[] WriteSuccess(int protocolVersion, string requestId) => Write(writer =>
        WriteImageSuccess(writer, protocolVersion, requestId));

    private static void WriteImageSuccess(Utf8JsonWriter writer, int protocolVersion, string requestId)
    {
        WriteSuccessEnvelope(writer, protocolVersion, requestId);
        writer.WriteStartObject("result");
        writer.WriteString("operation", "write-image-png");
        WriteClipboardFormats(writer);
        writer.WriteEndObject();
        writer.WriteEndObject();
    }

    internal static byte[] Error(string? requestId, HostErrorCode code) => Write(writer =>
        WriteError(writer, 1, requestId, code, null));

    internal static byte[] Error(int protocolVersion, string? requestId, HostErrorCode code) => Write(writer =>
        WriteError(writer, protocolVersion, requestId, code, null));

    internal static byte[] Error(
        int protocolVersion,
        string? requestId,
        HostErrorCode code,
        PasteAttemptDiagnostic diagnostic) => Write(writer =>
            WriteError(writer, protocolVersion, requestId, code, diagnostic));

    internal static byte[] CapturePasteContextSuccess(
        string requestId,
        string activationId,
        nint foregroundHwnd,
        nint rootHwnd,
        uint processId,
        uint clipboardSequenceNumber) => Write(writer =>
    {
        WriteSuccessEnvelope(writer, 2, requestId);
        writer.WriteStartObject("result");
        writer.WriteString("operation", "capture-paste-context");
        writer.WriteString("activationId", activationId);
        writer.WriteString("foregroundHwnd", FormatWindowHandle(foregroundHwnd));
        writer.WriteString("rootHwnd", FormatWindowHandle(rootHwnd));
        writer.WriteNumber("processId", processId);
        writer.WriteNumber("clipboardSequenceNumber", clipboardSequenceNumber);
        writer.WriteEndObject();
        writer.WriteEndObject();
    });

    internal static byte[] PasteIssuedSuccess(
        string requestId,
        PasteAttemptDiagnostic? diagnostic = null) => Write(writer =>
    {
        WriteSuccessEnvelope(writer, 2, requestId);
        writer.WriteStartObject("result");
        writer.WriteString("operation", "paste-clipboard");
        writer.WriteString("outcome", "paste-issued");
        writer.WriteEndObject();
        if (diagnostic is PasteAttemptDiagnostic value)
        {
            WritePasteAttemptDiagnostic(writer, value);
        }
        writer.WriteEndObject();
    });

    private static void WriteError(
        Utf8JsonWriter writer,
        int protocolVersion,
        string? requestId,
        HostErrorCode code,
        PasteAttemptDiagnostic? diagnostic)
    {
        writer.WriteStartObject();
        writer.WriteNumber("protocolVersion", protocolVersion);
        if (requestId is null)
        {
            writer.WriteNull("requestId");
        }
        else
        {
            writer.WriteString("requestId", requestId);
        }

        writer.WriteString("status", "error");
        writer.WriteString("hostVersion", HostConstants.HostVersion);
        writer.WriteString("safeErrorCode", code.ToProtocolValue());
        if (diagnostic is PasteAttemptDiagnostic value)
        {
            WritePasteAttemptDiagnostic(writer, value);
        }
        writer.WriteEndObject();
    }

    private static void WritePasteAttemptDiagnostic(
        Utf8JsonWriter writer,
        PasteAttemptDiagnostic diagnostic)
    {
        writer.WriteStartObject("nativePasteDiagnostic");
        writer.WriteNumber("sendInputRequestedCount", diagnostic.SendInputRequestedCount);
        writer.WriteNumber("sendInputInsertedCount", diagnostic.SendInputInsertedCount);
        writer.WriteNumber("sendInputStructSize", diagnostic.SendInputStructSize);
        writer.WriteNumber("sendInputLastError", diagnostic.SendInputLastError);
        writer.WriteBoolean("foregroundValidationPassed", diagnostic.ForegroundValidationPassed);
        writer.WriteBoolean("rootWindowValidationPassed", diagnostic.RootWindowValidationPassed);
        writer.WriteBoolean("pidValidationPassed", diagnostic.PidValidationPassed);
        writer.WriteBoolean("clipboardSequenceValidationPassed", diagnostic.ClipboardSequenceValidationPassed);
        writer.WriteBoolean("modifierValidationPassed", diagnostic.ModifierValidationPassed);
        if (diagnostic.HostSessionMatchesTarget is bool sessionsMatch)
        {
            writer.WriteBoolean("hostSessionMatchesTarget", sessionsMatch);
        }
        else
        {
            writer.WriteNull("hostSessionMatchesTarget");
        }
        writer.WriteString("hostIntegrityRelation", diagnostic.HostIntegrityRelation switch
        {
            HostIntegrityRelation.Same => "same",
            HostIntegrityRelation.HostLower => "host-lower",
            HostIntegrityRelation.HostHigher => "host-higher",
            _ => "unknown",
        });
        writer.WriteEndObject();
    }

    private static void WriteSuccessEnvelope(Utf8JsonWriter writer, string requestId)
        => WriteSuccessEnvelope(writer, 1, requestId);

    private static void WriteSuccessEnvelope(Utf8JsonWriter writer, int protocolVersion, string requestId)
    {
        writer.WriteStartObject();
        writer.WriteNumber("protocolVersion", protocolVersion);
        writer.WriteString("requestId", requestId);
        writer.WriteString("status", "success");
        writer.WriteString("hostVersion", HostConstants.HostVersion);
    }

    internal static string FormatWindowHandle(nint handle)
    {
        ulong value = checked((ulong)handle);
        if (value == 0)
        {
            throw new ArgumentOutOfRangeException(nameof(handle));
        }

        return value.ToString("x16", System.Globalization.CultureInfo.InvariantCulture);
    }

    private static void WriteClipboardFormats(Utf8JsonWriter writer)
    {
        writer.WriteStartArray("clipboardFormats");
        writer.WriteStringValue("png");
        writer.WriteStringValue("cf-dibv5");
        writer.WriteEndArray();
    }

    private static byte[] Write(Action<Utf8JsonWriter> action)
    {
        var buffer = new ArrayBufferWriter<byte>();
        using (var writer = new Utf8JsonWriter(buffer, new JsonWriterOptions { Indented = false }))
        {
            action(writer);
        }

        if (buffer.WrittenCount > HostConstants.MaxResponseBytes)
        {
            throw new InvalidOperationException("Response exceeded the frozen protocol bound.");
        }

        return buffer.WrittenSpan.ToArray();
    }
}
