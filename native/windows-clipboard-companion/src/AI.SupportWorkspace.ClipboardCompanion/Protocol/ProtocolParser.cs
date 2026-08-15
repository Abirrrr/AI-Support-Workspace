using System.Text.Json;
using System.Text.RegularExpressions;

namespace AI.SupportWorkspace.ClipboardCompanion.Protocol;

internal static partial class ProtocolParser
{
    private static readonly HashSet<string> CommonKeys = ["protocolVersion", "requestId", "operation"];
    private static readonly HashSet<string> ImageTopLevelKeys = [.. CommonKeys, "image"];
    private static readonly HashSet<string> ImageKeys = ["encoding", "byteLength", "data"];
    private static readonly HashSet<string> DangerousKeys = ["__proto__", "prototype", "constructor"];

    [GeneratedRegex("^[0-9a-f]{32}$", RegexOptions.CultureInvariant)]
    private static partial Regex RequestIdPattern();

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

            if (version != HostConstants.ProtocolVersion)
            {
                return ProtocolParseResult.Failure(HostErrorCode.ProtocolVersionUnsupported, requestId);
            }

            if (requestId is null
                || !root.TryGetProperty("operation", out JsonElement operationElement)
                || operationElement.ValueKind != JsonValueKind.String)
            {
                return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId);
            }

            string? operation = operationElement.GetString();
            if (operation is null || operation.Length > 32)
            {
                return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId);
            }

            return operation switch
            {
                "get-capabilities" => ParseCapabilities(root, requestId),
                "write-image-png" => ParseImage(root, requestId),
                _ => HasExactKeys(root, CommonKeys)
                    ? ProtocolParseResult.Failure(HostErrorCode.UnsupportedOperation, requestId)
                    : ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId),
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

    private static ProtocolParseResult ParseCapabilities(JsonElement root, string requestId)
    {
        if (!HasExactKeys(root, CommonKeys))
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId);
        }

        return ProtocolParseResult.Success(new GetCapabilitiesRequest(requestId));
    }

    private static ProtocolParseResult ParseImage(JsonElement root, string requestId)
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
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId);
        }

        if (declaredLength > HostConstants.MaxPngBytes)
        {
            return ProtocolParseResult.Failure(HostErrorCode.PayloadTooLarge, requestId);
        }

        if (!image.TryGetProperty("data", out JsonElement dataElement)
            || dataElement.ValueKind != JsonValueKind.String)
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId);
        }

        string? data = dataElement.GetString();
        if (data is null)
        {
            return ProtocolParseResult.Failure(HostErrorCode.InvalidRequest, requestId);
        }

        if (data.Length > 6_990_508)
        {
            return ProtocolParseResult.Failure(HostErrorCode.PayloadTooLarge, requestId);
        }

        if (!CanonicalBase64.TryDecode(data, declaredLength, out byte[] decoded, out HostErrorCode error))
        {
            return ProtocolParseResult.Failure(error, requestId);
        }

        return ProtocolParseResult.Success(new WriteImagePngRequest(requestId, decoded));
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
