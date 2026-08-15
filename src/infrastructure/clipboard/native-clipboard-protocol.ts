import { encodeBase64 } from '../../application/backup/base64';

export const NATIVE_CLIPBOARD_PROTOCOL_VERSION = 1;
export const NATIVE_CLIPBOARD_MAX_PNG_BYTES = 5_242_880;
export const NATIVE_CLIPBOARD_REQUEST_ID_PATTERN = /^[0-9a-f]{32}$/;

export const NATIVE_CLIPBOARD_HOST_ERROR_CODES = [
  'protocol-version-unsupported',
  'invalid-request',
  'unsupported-operation',
  'payload-too-large',
  'invalid-base64',
  'invalid-png',
  'image-too-large',
  'image-decode-failed',
  'clipboard-busy',
  'clipboard-open-failed',
  'clipboard-write-failed',
  'clipboard-close-failed',
  'internal-failure',
] as const;

export type NativeClipboardHostErrorCode =
  (typeof NATIVE_CLIPBOARD_HOST_ERROR_CODES)[number];

export interface GetCapabilitiesRequest {
  readonly protocolVersion: 1;
  readonly requestId: string;
  readonly operation: 'get-capabilities';
}

export interface WriteImagePngRequest {
  readonly protocolVersion: 1;
  readonly requestId: string;
  readonly operation: 'write-image-png';
  readonly image: {
    readonly encoding: 'base64';
    readonly byteLength: number;
    readonly data: string;
  };
}

export type NativeClipboardResponseResult =
  | { readonly status: 'success'; readonly hostVersion: string }
  | {
      readonly status: 'error';
      readonly hostVersion: string;
      readonly safeErrorCode: NativeClipboardHostErrorCode;
    };

export type NativeClipboardResponseValidationErrorCode =
  'host-version-mismatch' | 'invalid-host-response';

export class NativeClipboardResponseValidationError extends Error {
  constructor(readonly code: NativeClipboardResponseValidationErrorCode) {
    super('The native clipboard companion returned an invalid response.');
    this.name = 'NativeClipboardResponseValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function isHostVersion(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 32 &&
    /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
      value,
    )
  );
}

function isHostErrorCode(
  value: unknown,
): value is NativeClipboardHostErrorCode {
  return (
    typeof value === 'string' &&
    (NATIVE_CLIPBOARD_HOST_ERROR_CODES as readonly string[]).includes(value)
  );
}

function validateRequestId(requestId: string): void {
  if (!NATIVE_CLIPBOARD_REQUEST_ID_PATTERN.test(requestId)) {
    throw new TypeError(
      'Native request ID must be 32 lowercase hex characters.',
    );
  }
}

export function createNativeClipboardRequestId(
  random: Pick<Crypto, 'getRandomValues'> = crypto,
): string {
  const bytes = new Uint8Array(16);
  random.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

export function createGetCapabilitiesRequest(
  requestId: string,
): GetCapabilitiesRequest {
  validateRequestId(requestId);
  return {
    protocolVersion: NATIVE_CLIPBOARD_PROTOCOL_VERSION,
    requestId,
    operation: 'get-capabilities',
  };
}

export function createWriteImagePngRequest(
  requestId: string,
  pngBytes: Uint8Array,
): WriteImagePngRequest {
  validateRequestId(requestId);
  if (
    pngBytes.byteLength === 0 ||
    pngBytes.byteLength > NATIVE_CLIPBOARD_MAX_PNG_BYTES
  ) {
    throw new RangeError('Native PNG payload is outside the protocol bound.');
  }
  return {
    protocolVersion: NATIVE_CLIPBOARD_PROTOCOL_VERSION,
    requestId,
    operation: 'write-image-png',
    image: {
      encoding: 'base64',
      byteLength: pngBytes.byteLength,
      data: encodeBase64(pngBytes),
    },
  };
}

function parseEnvelope(
  value: unknown,
  expectedRequestId: string,
): {
  readonly response: Record<string, unknown>;
  readonly hostVersion: string;
} {
  if (!isRecord(value)) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  if (value.protocolVersion !== NATIVE_CLIPBOARD_PROTOCOL_VERSION) {
    throw new NativeClipboardResponseValidationError('host-version-mismatch');
  }
  if (
    value.requestId !== expectedRequestId ||
    !isHostVersion(value.hostVersion)
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  return { response: value, hostVersion: value.hostVersion };
}

function parseError(
  response: Record<string, unknown>,
  hostVersion: string,
): NativeClipboardResponseResult | undefined {
  if (response.status !== 'error') return undefined;
  if (
    !exactKeys(response, [
      'protocolVersion',
      'requestId',
      'status',
      'hostVersion',
      'safeErrorCode',
    ]) ||
    !isHostErrorCode(response.safeErrorCode)
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  return {
    status: 'error',
    hostVersion,
    safeErrorCode: response.safeErrorCode,
  };
}

export function parseGetCapabilitiesResponse(
  value: unknown,
  expectedRequestId: string,
): NativeClipboardResponseResult {
  const { response, hostVersion } = parseEnvelope(value, expectedRequestId);
  const error = parseError(response, hostVersion);
  if (error !== undefined) return error;
  if (
    response.status !== 'success' ||
    !exactKeys(response, [
      'protocolVersion',
      'requestId',
      'status',
      'hostVersion',
      'result',
    ]) ||
    !isRecord(response.result) ||
    !exactKeys(response.result, [
      'operation',
      'supportedProtocolVersions',
      'supportedOperations',
      'maxPngBytes',
      'clipboardFormats',
    ])
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  if (
    response.result.operation !== 'get-capabilities' ||
    !Array.isArray(response.result.supportedProtocolVersions) ||
    response.result.supportedProtocolVersions.length !== 1 ||
    response.result.supportedProtocolVersions[0] !== 1 ||
    !Array.isArray(response.result.supportedOperations) ||
    response.result.supportedOperations.length !== 1 ||
    response.result.supportedOperations[0] !== 'write-image-png' ||
    response.result.maxPngBytes !== NATIVE_CLIPBOARD_MAX_PNG_BYTES ||
    !Array.isArray(response.result.clipboardFormats) ||
    response.result.clipboardFormats.length !== 2 ||
    response.result.clipboardFormats[0] !== 'png' ||
    response.result.clipboardFormats[1] !== 'cf-dibv5'
  ) {
    throw new NativeClipboardResponseValidationError('host-version-mismatch');
  }
  return { status: 'success', hostVersion };
}

export function parseWriteImagePngResponse(
  value: unknown,
  expectedRequestId: string,
): NativeClipboardResponseResult {
  const { response, hostVersion } = parseEnvelope(value, expectedRequestId);
  const error = parseError(response, hostVersion);
  if (error !== undefined) return error;
  if (
    response.status !== 'success' ||
    !exactKeys(response, [
      'protocolVersion',
      'requestId',
      'status',
      'hostVersion',
      'result',
    ]) ||
    !isRecord(response.result) ||
    !exactKeys(response.result, ['operation', 'clipboardFormats']) ||
    response.result.operation !== 'write-image-png' ||
    !Array.isArray(response.result.clipboardFormats) ||
    response.result.clipboardFormats.length !== 2 ||
    response.result.clipboardFormats[0] !== 'png' ||
    response.result.clipboardFormats[1] !== 'cf-dibv5'
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  return { status: 'success', hostVersion };
}
