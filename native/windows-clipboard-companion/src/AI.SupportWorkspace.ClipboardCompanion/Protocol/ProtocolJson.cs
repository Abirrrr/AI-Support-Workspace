using System.Buffers;
using System.Text.Json;

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

    internal static byte[] WriteSuccess(string requestId) => Write(writer =>
    {
        WriteSuccessEnvelope(writer, requestId);
        writer.WriteStartObject("result");
        writer.WriteString("operation", "write-image-png");
        WriteClipboardFormats(writer);
        writer.WriteEndObject();
        writer.WriteEndObject();
    });

    internal static byte[] Error(string? requestId, HostErrorCode code) => Write(writer =>
    {
        writer.WriteStartObject();
        writer.WriteNumber("protocolVersion", HostConstants.ProtocolVersion);
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
        writer.WriteEndObject();
    });

    private static void WriteSuccessEnvelope(Utf8JsonWriter writer, string requestId)
    {
        writer.WriteStartObject();
        writer.WriteNumber("protocolVersion", HostConstants.ProtocolVersion);
        writer.WriteString("requestId", requestId);
        writer.WriteString("status", "success");
        writer.WriteString("hostVersion", HostConstants.HostVersion);
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
