import {
  NativeImageClipboardError,
  type ImageClipboardTransport,
  type NativeClipboardCapability,
  type NativeClipboardCapabilityStatus,
  type NativeImageClipboardErrorCode,
} from '../../application/snippet/image-clipboard-transport';
import {
  AutomaticPasteUnavailableError,
  type AutomaticPasteRequest,
  type AutomaticPasteResult,
  type AutomaticPasteTransport,
  type NativePasteAttemptDiagnostic,
  type NativePasteContext,
} from '../../application/snippet/automatic-paste-transport';
import {
  createCapturePasteContextRequest,
  createGetCapabilitiesRequest,
  createGetCapabilitiesV2Request,
  createNativeClipboardRequestId,
  createPasteClipboardRequest,
  createWriteImagePngRequest,
  NativeClipboardResponseValidationError,
  parseCapturePasteContextResponse,
  parseGetCapabilitiesResponse,
  parseGetCapabilitiesV2Response,
  parsePasteClipboardResponse,
  parsePasteClipboardResponseWithDiagnostic,
  parseWriteImagePngResponse,
  type NativeClipboardHostErrorCode,
} from './native-clipboard-protocol';

export interface NativeClipboardExtensionApi {
  readonly permissions: {
    contains(options: {
      readonly permissions: readonly ['nativeMessaging'];
    }): Promise<boolean>;
  };
  readonly runtime: {
    readonly lastError?: { readonly message?: string } | undefined;
    getPlatformInfo(): Promise<{ readonly os: string }>;
    sendNativeMessage(
      hostName: string,
      message: unknown,
      callback: (response: unknown) => void,
    ): void;
  };
}

function sendNativeMessage(
  runtime: NativeClipboardExtensionApi['runtime'],
  hostName: string,
  message: unknown,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    runtime.sendNativeMessage(hostName, message, (response) => {
      if (runtime.lastError !== undefined) {
        reject(new Error('Native messaging transport is unavailable.'));
        return;
      }
      resolve(response);
    });
  });
}

function mapHostError(
  code: NativeClipboardHostErrorCode,
): NativeImageClipboardErrorCode {
  if (
    code === 'protocol-version-unsupported' ||
    code === 'unsupported-operation'
  ) {
    return 'host-version-mismatch';
  }
  if (code === 'clipboard-busy') return 'native-delivery-busy';
  if (code === 'image-too-large') return 'image-too-large';
  if (code === 'image-decode-failed') return 'image-decode-failed';
  if (
    code === 'invalid-request' ||
    code === 'payload-too-large' ||
    code === 'invalid-base64' ||
    code === 'invalid-png'
  ) {
    return 'image-invalid';
  }
  return 'clipboard-write-failed';
}

function mapValidationError(
  error: NativeClipboardResponseValidationError,
): NativeImageClipboardError {
  return new NativeImageClipboardError(error.code);
}

export class WindowsNativeImageClipboardTransport
  implements
    ImageClipboardTransport,
    NativeClipboardCapability,
    AutomaticPasteTransport
{
  private capabilitiesReady = false;
  private automaticPasteCapabilitiesReady = false;
  private imageWriteInFlight = false;
  private lastPasteAttemptDiagnostic: NativePasteAttemptDiagnostic | undefined;

  constructor(
    private readonly chromeApi: NativeClipboardExtensionApi,
    private readonly hostName: string | undefined,
    private readonly createRequestId: () => string = () =>
      createNativeClipboardRequestId(),
  ) {}

  async getStatus(): Promise<NativeClipboardCapabilityStatus> {
    this.capabilitiesReady = false;
    let platform;
    try {
      platform = await this.chromeApi.runtime.getPlatformInfo();
    } catch {
      return 'host-unavailable';
    }
    if (platform.os !== 'win') return 'unsupported-platform';

    let permissionGranted;
    try {
      permissionGranted = await this.chromeApi.permissions.contains({
        permissions: ['nativeMessaging'],
      });
    } catch {
      return 'permission-not-granted';
    }
    if (!permissionGranted) return 'permission-not-granted';
    if (this.hostName === undefined) return 'host-unavailable';

    const requestId = this.createRequestId();
    let response: unknown;
    try {
      response = await sendNativeMessage(
        this.chromeApi.runtime,
        this.hostName,
        createGetCapabilitiesRequest(requestId),
      );
    } catch {
      return 'host-unavailable';
    }

    try {
      const parsed = parseGetCapabilitiesResponse(response, requestId);
      if (parsed.status === 'error') return 'host-version-mismatch';
      this.capabilitiesReady = true;
      return 'ready';
    } catch (error) {
      return error instanceof NativeClipboardResponseValidationError
        ? error.code
        : 'invalid-host-response';
    }
  }

  async writePng(pngBytes: Uint8Array): Promise<void> {
    if (this.imageWriteInFlight) {
      throw new NativeImageClipboardError('native-delivery-busy');
    }
    this.imageWriteInFlight = true;
    try {
      if (!this.capabilitiesReady) {
        const status = await this.getStatus();
        if (status !== 'ready') {
          throw new NativeImageClipboardError(
            status === 'permission-not-granted'
              ? 'native-permission-required'
              : status === 'host-version-mismatch'
                ? 'host-version-mismatch'
                : status === 'invalid-host-response'
                  ? 'invalid-host-response'
                  : 'host-unavailable',
          );
        }
      }

      const requestId = this.createRequestId();
      let request;
      try {
        request = createWriteImagePngRequest(requestId, pngBytes);
      } catch {
        throw new NativeImageClipboardError(
          pngBytes.byteLength > 5_242_880 ? 'image-too-large' : 'image-invalid',
        );
      }

      const hostName = this.hostName;
      if (hostName === undefined) {
        this.capabilitiesReady = false;
        throw new NativeImageClipboardError('host-unavailable');
      }
      let response: unknown;
      try {
        response = await sendNativeMessage(
          this.chromeApi.runtime,
          hostName,
          request,
        );
      } catch {
        this.capabilitiesReady = false;
        throw new NativeImageClipboardError('host-unavailable');
      }

      try {
        const parsed = parseWriteImagePngResponse(response, requestId);
        if (parsed.status === 'error') {
          throw new NativeImageClipboardError(
            mapHostError(parsed.safeErrorCode),
          );
        }
      } catch (error) {
        this.capabilitiesReady = false;
        if (error instanceof NativeImageClipboardError) throw error;
        if (error instanceof NativeClipboardResponseValidationError) {
          throw mapValidationError(error);
        }
        throw new NativeImageClipboardError('invalid-host-response');
      }
    } finally {
      this.imageWriteInFlight = false;
    }
  }

  async capturePasteContext(activationId: string): Promise<NativePasteContext> {
    if (!(await this.ensureAutomaticPasteReady())) {
      throw new AutomaticPasteUnavailableError();
    }
    const hostName = this.hostName;
    if (hostName === undefined) throw new AutomaticPasteUnavailableError();
    const requestId = this.createRequestId();
    try {
      const response = await sendNativeMessage(
        this.chromeApi.runtime,
        hostName,
        createCapturePasteContextRequest(requestId, activationId),
      );
      return parseCapturePasteContextResponse(
        response,
        requestId,
        activationId,
      );
    } catch {
      this.automaticPasteCapabilitiesReady = false;
      throw new AutomaticPasteUnavailableError();
    }
  }

  async requestPaste(
    request: AutomaticPasteRequest,
  ): Promise<AutomaticPasteResult> {
    this.lastPasteAttemptDiagnostic = undefined;
    const hostName = this.hostName;
    if (hostName === undefined || !this.automaticPasteCapabilitiesReady) {
      return 'native-unavailable';
    }
    const requestId = this.createRequestId();
    let message;
    try {
      message = createPasteClipboardRequest(
        requestId,
        request.activationId,
        request,
      );
    } catch {
      return 'indeterminate';
    }
    let response: unknown;
    try {
      response = await sendNativeMessage(
        this.chromeApi.runtime,
        hostName,
        message,
      );
    } catch {
      // The host may have issued input before the one-shot IPC response was lost.
      return 'indeterminate';
    }
    try {
      if (
        import.meta.env.MODE === 'native-dev' ||
        import.meta.env.MODE === 'test'
      ) {
        const parsed = parsePasteClipboardResponseWithDiagnostic(
          response,
          requestId,
          true,
        );
        this.lastPasteAttemptDiagnostic = parsed.diagnostic;
        return parsed.result;
      }
      return parsePasteClipboardResponse(response, requestId);
    } catch {
      return 'indeterminate';
    }
  }

  takeLastPasteAttemptDiagnostic(): NativePasteAttemptDiagnostic | undefined {
    const diagnostic = this.lastPasteAttemptDiagnostic;
    this.lastPasteAttemptDiagnostic = undefined;
    return diagnostic;
  }

  private async ensureAutomaticPasteReady(): Promise<boolean> {
    if (this.automaticPasteCapabilitiesReady) return true;
    let platform;
    try {
      platform = await this.chromeApi.runtime.getPlatformInfo();
      if (platform.os !== 'win') return false;
      const permissionGranted = await this.chromeApi.permissions.contains({
        permissions: ['nativeMessaging'],
      });
      if (!permissionGranted || this.hostName === undefined) return false;
    } catch {
      return false;
    }
    const requestId = this.createRequestId();
    try {
      const response = await sendNativeMessage(
        this.chromeApi.runtime,
        this.hostName,
        createGetCapabilitiesV2Request(requestId),
      );
      parseGetCapabilitiesV2Response(response, requestId);
      this.automaticPasteCapabilitiesReady = true;
      return true;
    } catch {
      return false;
    }
  }
}
