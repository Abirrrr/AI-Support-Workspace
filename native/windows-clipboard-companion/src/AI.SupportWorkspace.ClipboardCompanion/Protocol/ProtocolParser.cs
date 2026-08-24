using System.Text.Json;
using System.Text.RegularExpressions;
using System.Globalization;

namespace AI.SupportWorkspace.ClipboardCompanion.Protocol;

internal static partial class ProtocolParser
{
    private static readonly HashSet<string> CommonKeys = ["protocolVersion", "requestId", "operation"];
    private static readonly HashSet<string> ImageTopLevelKeys = [.. CommonKeys, "image"];
    private static readonly HashSet<string> ImageKeys = ["encoding", "byteLength", "data"];
    private static readonly HashSet<string> CaptureKeys = [.. CommonKeys, "activationId"];
    private static readonly HashSet<string> PasteKeys = [
        .. CommonKeys,
        "activationId",
        "expectedForegroundHwnd",
        "expectedRootHwnd",
        "expectedProcessId",
        "expectedClipboardSequenceNumber",
    ];
    private static readonly HashSet<string> DangerousKeys = ["__proto__", "prototype", "constructor"];

    [GeneratedRegex("^[0-9a-f]{32}$", RegexOptions.CultureInvariant)]
    private static partial Regex RequestIdPattern();

    [GeneratedRegex("^[0-9a-f]{16}$", RegexOptions.CultureInvariant)]
    private static partial Regex WindowHandlePattern();

    internal static ProtocolParseResult Parse(byte[] json)
    {
        try
        {
            if (!HasSafeUniqueProperties(json))
            {
                return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, null);
            }

            using JsonDocument document = JsonDocument.Parse(json, new JsonDocumentOptions
            {
                AllowTrailingCommas = false,
                CommentHandling = JsonCommentHandling.Disallow,
                MaxDepth = 8,
            });

            JsonElement root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
            {
                return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, null);
            }

            string? requestId = TryReadValidRequestId(root);
            if (!root.TryGetProperty("protocolVersion", out JsonElement versionElement)
                || versionElement.ValueKind != JsonValueKind.Number
                || !versionElement.TryGetInt32(out int version))
            {
                return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId);
            }

            if (version is not 1 and not 2)
            {
                return ProtocolParseResult.Failure(HostErrorCode.ProtocolVersionUnsupported, requestId, version);
            }

            if (requestId is null
                || !root.TryGetProperty("operation", out JsonElement operationElement)
                || operationElement.ValueKind != JsonValueKind.String)
            {
                return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId, version);
            }

            string? operation = operationElement.GetString();
            if (operation is null || operation.Length > 32)
            {
                return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId, version);
            }

            return operation switch
            {
                "get-capabilities" => ParseCapabilities(root, requestId, version),
                "write-image-png" => ParseImage(root, requestId, version),
                "capture-paste-context" when version == 2 => ParseCapturePasteContext(root, requestId),
                "paste-clipboard" when version == 2 => ParsePasteClipboard(root, requestId),
                _ => HasExactKeys(root, CommonKeys)
                    ? ProtocolParseResult.Failure(HostErrorCode.UnsupportedOperation, requestId, version)
                    : ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId, version),
            };
        }
        catch (JsonException)
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, null);
        }
        catch (OverflowException)
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, null);
        }
    }

    private static ProtocolParseResult ParseCapabilities(JsonElement root, string requestId, int version)
    {
        if (!HasExactKeys(root, CommonKeys))
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId, version);
        }

        return ProtocolParseResult.Success(new GetCapabilitiesRequest(version, requestId));
    }

    private static ProtocolParseResult ParseImage(JsonElement root, string requestId, int version)
    {
        if (!HasExactKeys(root, ImageTopLevelKeys)
            || !root.TryGetProperty("image", out JsonElement image)
            || image.ValueKind != JsonValueKind.Object
            || !HasExactKeys(image, ImageKeys)
            || !image.TryGetProperty("encoding", out JsonElement encoding)
            || encoding.ValueKind != JsonValueKind.String
            || !string.Equals(encoding.GetString(), "base64", StringComparison.Ordinal)
            || !image.TryGetProperty("byteLength", out JsonElement byteLength)
            || byteLength.ValueKind != JsonValueKind.Number
            || !byteLength.TryGetInt32(out int declaredLength)
            || declaredLength < 1)
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId, version);
        }

        if (declaredLength > HostConstants.MaxPngBytes)
        {
            return ProtocolParseResult.Failure(HostErrorCode.PayloadTooLarge, requestId, version);
        }

        if (!image.TryGetProperty("data", out JsonElement dataElement)
            || dataElement.ValueKind != JsonValueKind.String)
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId, version);
        }

        string? data = dataElement.GetString();
        if (data is null)
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId, version);
        }

        if (data.Length > 6_990_508)
        {
            return ProtocolParseResult.Failure(HostErrorCode.PayloadTooLarge, requestId, version);
        }

        if (!CanonicalBase64.TryDecode(data, declaredLength, out byte[] decoded, out HostErrorCode error))
        {
            return ProtocolParseResult.Failure(error, requestId, version);
        }

        return ProtocolParseResult.Success(new WriteImagePngRequest(version, requestId, decoded));
    }

    private static ProtocolParseResult ParseCapturePasteContext(JsonElement root, string requestId)
    {
        if (!HasExactKeys(root, CaptureKeys)
            || !TryReadActivationId(root, out string activationId))
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId, 2);
        }

        return ProtocolParseResult.Success(new CapturePasteContextRequest(requestId, activationId));
    }

    private static ProtocolParseResult ParsePasteClipboard(JsonElement root, string requestId)
    {
        if (!HasExactKeys(root, PasteKeys)
            || !TryReadActivationId(root, out string activationId)
            || !TryReadWindowHandle(root, "expectedForegroundHwnd", out nint foreground)
            || !TryReadWindowHandle(root, "expectedRootHwnd", out nint rootWindow)
            || !TryReadNonzeroUInt32(root, "expectedProcessId", out uint processId)
            || !TryReadNonzeroUInt32(root, "expectedClipboardSequenceNumber", out uint sequence))
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId, 2);
        }

        return ProtocolParseResult.Success(new PasteClipboardRequest(
            requestId,
            activationId,
            foreground,
            rootWindow,
            processId,
            sequence));
    }

    private static bool TryReadActivationId(JsonElement root, out string activationId)
    {
        activationId = string.Empty;
        if (!root.TryGetProperty("activationId", out JsonElement element)
            || element.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        string? value = element.GetString();
        if (value is null || !RequestIdPattern().IsMatch(value))
        {
            return false;
        }

        activationId = value;
        return true;
    }

    private static bool TryReadWindowHandle(JsonElement root, string name, out nint handle)
    {
        handle = nint.Zero;
        if (!root.TryGetProperty(name, out JsonElement element)
            || element.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        string? value = element.GetString();
        ulong max = nint.Size == 8 ? (ulong)nint.MaxValue : int.MaxValue;
        if (value is null
            || !WindowHandlePattern().IsMatch(value)
            || !ulong.TryParse(value, NumberStyles.AllowHexSpecifier, CultureInfo.InvariantCulture, out ulong parsed)
            || parsed == 0
            || parsed > max)
        {
            return false;
        }

        handle = checked((nint)(long)parsed);
        return true;
    }

    private static bool TryReadNonzeroUInt32(JsonElement root, string name, out uint value)
    {
        value = 0;
        return root.TryGetProperty(name, out JsonElement element)
            && element.ValueKind == JsonValueKind.Number
            && element.TryGetUInt32(out value)
            && value != 0;
    }

    private static string? TryReadValidRequestId(JsonElement root)
    {
        if (!root.TryGetProperty("requestId", out JsonElement requestIdElement)
            || requestIdElement.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        string? requestId = requestIdElement.GetString();
        return requestId is not null && RequestIdPattern().IsMatch(requestId) ? requestId : null;
    }

    private static bool HasExactKeys(JsonElement element, HashSet<string> expected)
    {
        int count = 0;
        foreach (JsonProperty property in element.EnumerateObject())
        {
            count++;
            if (!expected.Contains(property.Name))
            {
                return false;
            }
        }

        return count == expected.Count;
    }

    private static bool HasSafeUniqueProperties(ReadOnlySpan<byte> json)
    {
        var reader = new Utf8JsonReader(json, new JsonReaderOptions
        {
            AllowTrailingCommas = false,
            CommentHandling = JsonCommentHandling.Disallow,
            MaxDepth = 8,
        });
        var objects = new Stack<HashSet<string>>();
        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.StartObject)
            {
                objects.Push(new HashSet<string>(StringComparer.Ordinal));
            }
            else if (reader.TokenType == JsonTokenType.EndObject)
            {
                objects.Pop();
            }
            else if (reader.TokenType == JsonTokenType.PropertyName)
            {
                string name = reader.GetString()!;
                if (objects.Count == 0 || DangerousKeys.Contains(name) || !objects.Peek().Add(name))
                {
                    return false;
                }
            }
        }

        return true;
    }
}
