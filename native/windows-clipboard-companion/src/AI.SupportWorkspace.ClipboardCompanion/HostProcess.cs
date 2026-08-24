using System.Security.Cryptography;
using AI.SupportWorkspace.ClipboardCompanion.Clipboard;
using AI.SupportWorkspace.ClipboardCompanion.Protocol;
using AI.SupportWorkspace.ClipboardCompanion.Security;

namespace AI.SupportWorkspace.ClipboardCompanion;

internal static class HostProcess
{
    internal static int Run(
        IReadOnlyList<string> args,
        Stream input,
        Stream output,
        string expectedOrigin,
        IImageWriteService? imageWriteService = null,
        IPasteService? pasteService = null,
        bool includePasteDiagnostics = false)
    {
        if (!InvocationValidator.TryValidate(args, expectedOrigin, out _))
        {
            return 2;
        }

        string? correlationId = null;
        int responseProtocolVersion = 1;
        bool responseAttempted = false;
        void WriteResponseOnce(byte[] response)
        {
            if (responseAttempted)
            {
                throw new InvalidOperationException("A Native Messaging response was already attempted.");
            }

            responseAttempted = true;
            NativeMessageFraming.WriteResponse(output, response);
        }

        try
        {
            FrameReadResult frame = NativeMessageFraming.ReadRequest(input);
            if (frame.Error is HostErrorCode frameError)
            {
                WriteResponseOnce(ProtocolJson.Error(null, frameError));
                return 1;
            }

            ProtocolParseResult parsed = ProtocolParser.Parse(frame.Body!);
            correlationId = parsed.RequestId;
            responseProtocolVersion = parsed.ProtocolVersion ?? 1;
            if (parsed.Error is HostErrorCode parseError)
            {
                WriteResponseOnce(ProtocolJson.Error(responseProtocolVersion, parsed.RequestId, parseError));
                return 1;
            }

            if (parsed.Request is GetCapabilitiesRequest capabilities)
            {
                WriteResponseOnce(capabilities.ProtocolVersion == 1
                    ? ProtocolJson.CapabilitiesSuccess(capabilities.RequestId)
                    : ProtocolJson.CapabilitiesV2Success(capabilities.RequestId));
                return 0;
            }

            IPasteService resolvedPasteService = pasteService
                ?? PasteService.CreateDefault(includePasteDiagnostics);
            if (parsed.Request is CapturePasteContextRequest captureRequest)
            {
                (PasteContext? context, HostErrorCode? error) = resolvedPasteService.CaptureContext();
                if (context is PasteContext captured)
                {
                    WriteResponseOnce(ProtocolJson.CapturePasteContextSuccess(
                        captureRequest.RequestId,
                        captureRequest.ActivationId,
                        captured.ForegroundHwnd,
                        captured.RootHwnd,
                        captured.ProcessId,
                        captured.ClipboardSequenceNumber));
                    return 0;
                }

                WriteResponseOnce(ProtocolJson.Error(2, captureRequest.RequestId, error ?? HostErrorCode.InternalFailure));
                return 1;
            }

            if (parsed.Request is PasteClipboardRequest pasteRequest)
            {
                PasteOperationResult result = resolvedPasteService.Paste(pasteRequest);
                WriteResponseOnce(result.Error is null
                    ? ProtocolJson.PasteIssuedSuccess(
                        pasteRequest.RequestId,
                        includePasteDiagnostics ? result.Diagnostic : null)
                    : includePasteDiagnostics
                        ? ProtocolJson.Error(2, pasteRequest.RequestId, result.Error.Value, result.Diagnostic)
                        : ProtocolJson.Error(2, pasteRequest.RequestId, result.Error.Value));
                return result.Error is null ? 0 : 1;
            }

            var writeRequest = (WriteImagePngRequest)parsed.Request!;
            try
            {
                HostErrorCode? error = RunImageWriteOnSta(
                    imageWriteService ?? ImageWriteService.CreateDefault(),
                    writeRequest.PngBytes);
                byte[] response = error is null
                    ? ProtocolJson.WriteSuccess(writeRequest.ProtocolVersion, writeRequest.RequestId)
                    : ProtocolJson.Error(writeRequest.ProtocolVersion, writeRequest.RequestId, error.Value);
                WriteResponseOnce(response);
                return error is null ? 0 : 1;
            }
            finally
            {
                CryptographicOperations.ZeroMemory(writeRequest.PngBytes);
            }
        }
        catch (Exception)
        {
            if (!responseAttempted)
            {
                try
                {
                    WriteResponseOnce(ProtocolJson.Error(responseProtocolVersion, correlationId, HostErrorCode.InternalFailure));
                }
                catch (Exception)
                {
                    // A protocol response cannot be guaranteed when stdout itself fails.
                }
            }

            return 1;
        }
    }

    private static HostErrorCode? RunImageWriteOnSta(IImageWriteService service, byte[] pngBytes)
    {
        HostErrorCode? result = HostErrorCode.InternalFailure;
        var thread = new Thread(() =>
        {
            try
            {
                result = service.Write(pngBytes);
            }
            catch (Exception)
            {
                result = HostErrorCode.InternalFailure;
            }
        })
        {
            IsBackground = false,
            Name = "Clipboard Companion Request",
        };
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();
        return result;
    }
}
