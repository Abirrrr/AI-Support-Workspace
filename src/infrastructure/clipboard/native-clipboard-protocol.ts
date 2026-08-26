import type { NativePasteAttemptDiagnostic } from '../../application/snippet/automatic-paste-transport';

export const NATIVE_CLIPBOARD_PROTOCOL_VERSION = 1;
export const NATIVE_CLIPBOARD_PROTOCOL_VERSION_2 = 2;
export const NATIVE_CLIPBOARD_MAX_PNG_BYTES = 5_242_880;
export const NATIVE_CLIPBOARD_REQUEST_ID_PATTERN = /^[0-9a-f]{32}$/;
export const NATIVE_CLIPBOARD_ACTIVATION_ID_PATTERN = /^[0-9a-f]{32}$/;
export const NATIVE_WINDOW_HANDLE_PATTERN = /^[0-9a-f]{16}$/;
export const NATIVE_WINDOW_HANDLE_MAX = 0x7fff_ffff_ffff_ffffn;

const NATIVE_CLIPBOARD_BASE64_CHUNK_BYTES = 0x6000;

function encodeNativeClipboardBase64(bytes: Uint8Array): string {
  const toBase64 = (bytes as Uint8Array & { readonly toBase64?: () => string })
    .toBase64;
  if (toBase64 !== undefined) return toBase64.call(bytes);

  const chunks = new Array<string>(
    Math.ceil(bytes.byteLength / NATIVE_CLIPBOARD_BASE64_CHUNK_BYTES),
  );
  for (
    let offset = 0, index = 0;
    offset < bytes.byteLength;
    offset += NATIVE_CLIPBOARD_BASE64_CHUNK_BYTES, index += 1
  ) {
    chunks[index] = btoa(
      String.fromCharCode(
        ...bytes.subarray(offset, offset + NATIVE_CLIPBOARD_BASE64_CHUNK_BYTES),
      ),
    );
  }
  return chunks.join('');
}

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

export const NATIVE_AUTOMATIC_PASTE_ERROR_CODES = [
  'protocol-version-unsupported',
  'invalid-request',
  'unsupported-operation',
  'foreground-unavailable',
  'not-foreground',
  'clipboard-changed',
  'unsafe-keyboard-state',
  'paste-busy',
  'input-injection-failed',
  'indeterminate',
  'internal-failure',
] as const;

export type NativeAutomaticPasteErrorCode =
  (typeof NATIVE_AUTOMATIC_PASTE_ERROR_CODES)[number];

export interface GetCapabilitiesRequest {
  readonly protocolVersion: 1;
  readonly requestId: string;
  readonly operation: 'get-capabilities';
}

export interface GetCapabilitiesV2Request {
  readonly protocolVersion: 2;
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

export interface CapturePasteContextRequest {
  readonly protocolVersion: 2;
  readonly requestId: string;
  readonly activationId: string;
  readonly operation: 'capture-paste-context';
}

export interface PasteClipboardRequest {
  readonly protocolVersion: 2;
  readonly requestId: string;
  readonly activationId: string;
  readonly operation: 'paste-clipboard';
  readonly expectedForegroundHwnd: string;
  readonly expectedRootHwnd: string;
  readonly expectedProcessId: number;
  readonly expectedClipboardSequenceNumber: number;
}

export interface CapturedNativePasteContext {
  readonly foregroundWindowHandle: string;
  readonly rootWindowHandle: string;
  readonly processId: number;
  readonly clipboardSequenceNumber: number;
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

function validateActivationId(activationId: string): void {
  if (!NATIVE_CLIPBOARD_ACTIVATION_ID_PATTERN.test(activationId)) {
    throw new TypeError(
      'Native activation ID must be 32 lowercase hex characters.',
    );
  }
}

function validateWindowHandle(handle: string): void {
  if (
    !NATIVE_WINDOW_HANDLE_PATTERN.test(handle) ||
    handle === '0000000000000000' ||
    BigInt(`0x${handle}`) > NATIVE_WINDOW_HANDLE_MAX
  ) {
    throw new TypeError('Native window handle must be nonzero canonical hex.');
  }
}

function validateUint32(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0 || value > 0xffff_ffff) {
    throw new RangeError(`${name} must be a nonzero unsigned 32-bit integer.`);
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

export function createGetCapabilitiesV2Request(
  requestId: string,
): GetCapabilitiesV2Request {
  validateRequestId(requestId);
  return {
    protocolVersion: NATIVE_CLIPBOARD_PROTOCOL_VERSION_2,
    requestId,
    operation: 'get-capabilities',
  };
}

export function createCapturePasteContextRequest(
  requestId: string,
  activationId: string,
): CapturePasteContextRequest {
  validateRequestId(requestId);
  validateActivationId(activationId);
  return {
    protocolVersion: NATIVE_CLIPBOARD_PROTOCOL_VERSION_2,
    requestId,
    activationId,
    operation: 'capture-paste-context',
  };
}

export function createPasteClipboardRequest(
  requestId: string,
  activationId: string,
  context: CapturedNativePasteContext,
): PasteClipboardRequest {
  validateRequestId(requestId);
  validateActivationId(activationId);
  validateWindowHandle(context.foregroundWindowHandle);
  validateWindowHandle(context.rootWindowHandle);
  validateUint32(context.processId, 'Process ID');
  validateUint32(context.clipboardSequenceNumber, 'Clipboard sequence number');
  return {
    protocolVersion: NATIVE_CLIPBOARD_PROTOCOL_VERSION_2,
    requestId,
    activationId,
    operation: 'paste-clipboard',
    expectedForegroundHwnd: context.foregroundWindowHandle,
    expectedRootHwnd: context.rootWindowHandle,
    expectedProcessId: context.processId,
    expectedClipboardSequenceNumber: context.clipboardSequenceNumber,
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
      data: encodeNativeClipboardBase64(pngBytes),
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

function parseV2Envelope(
  value: unknown,
  expectedRequestId: string,
): {
  readonly response: Record<string, unknown>;
  readonly hostVersion: string;
} {
  if (!isRecord(value)) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  if (value.protocolVersion !== NATIVE_CLIPBOARD_PROTOCOL_VERSION_2) {
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

function parseV2Error(
  response: Record<string, unknown>,
): NativeAutomaticPasteErrorCode | undefined {
  if (response.status !== 'error') return undefined;
  if (
    !exactKeys(response, [
      'protocolVersion',
      'requestId',
      'status',
      'hostVersion',
      'safeErrorCode',
    ]) ||
    typeof response.safeErrorCode !== 'string' ||
    !(NATIVE_AUTOMATIC_PASTE_ERROR_CODES as readonly string[]).includes(
      response.safeErrorCode,
    )
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  return response.safeErrorCode as NativeAutomaticPasteErrorCode;
}

export function parseGetCapabilitiesV2Response(
  value: unknown,
  expectedRequestId: string,
): { readonly status: 'success'; readonly hostVersion: string } {
  const { response, hostVersion } = parseV2Envelope(value, expectedRequestId);
  if (parseV2Error(response) !== undefined) {
    throw new NativeClipboardResponseValidationError('host-version-mismatch');
  }
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
    ]) ||
    response.result.operation !== 'get-capabilities' ||
    !Array.isArray(response.result.supportedProtocolVersions) ||
    response.result.supportedProtocolVersions.length !== 2 ||
    response.result.supportedProtocolVersions[0] !== 1 ||
    response.result.supportedProtocolVersions[1] !== 2 ||
    !Array.isArray(response.result.supportedOperations) ||
    response.result.supportedOperations.length !== 3 ||
    response.result.supportedOperations[0] !== 'write-image-png' ||
    response.result.supportedOperations[1] !== 'capture-paste-context' ||
    response.result.supportedOperations[2] !== 'paste-clipboard' ||
    response.result.maxPngBytes !== NATIVE_CLIPBOARD_MAX_PNG_BYTES ||
    !Array.isArray(response.result.clipboardFormats) ||
    response.result.clipboardFormats.length !== 2 ||
    response.result.clipboardFormats[0] !== 'png' ||
    response.result.clipboardFormats[1] !== 'cf-dibv5'
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  return { status: 'success', hostVersion };
}

export function parseCapturePasteContextResponse(
  value: unknown,
  expectedRequestId: string,
  expectedActivationId: string,
): CapturedNativePasteContext {
  const { response } = parseV2Envelope(value, expectedRequestId);
  const error = parseV2Error(response);
  if (error !== undefined) {
    throw new NativeClipboardResponseValidationError(
      error === 'protocol-version-unsupported' ||
        error === 'unsupported-operation'
        ? 'host-version-mismatch'
        : 'invalid-host-response',
    );
  }
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
      'activationId',
      'foregroundHwnd',
      'rootHwnd',
      'processId',
      'clipboardSequenceNumber',
    ]) ||
    response.result.operation !== 'capture-paste-context' ||
    response.result.activationId !== expectedActivationId ||
    typeof response.result.foregroundHwnd !== 'string' ||
    typeof response.result.rootHwnd !== 'string' ||
    typeof response.result.processId !== 'number' ||
    typeof response.result.clipboardSequenceNumber !== 'number'
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  try {
    validateWindowHandle(response.result.foregroundHwnd);
    validateWindowHandle(response.result.rootHwnd);
    validateUint32(response.result.processId, 'Process ID');
    validateUint32(
      response.result.clipboardSequenceNumber,
      'Clipboard sequence number',
    );
  } catch {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  return {
    foregroundWindowHandle: response.result.foregroundHwnd,
    rootWindowHandle: response.result.rootHwnd,
    processId: response.result.processId,
    clipboardSequenceNumber: response.result.clipboardSequenceNumber,
  };
}

export interface ParsedPasteClipboardResponse {
  readonly result:
    | 'paste-issued'
    | 'not-foreground'
    | 'clipboard-changed'
    | 'unsafe-keyboard-state'
    | 'busy'
    | 'input-injection-failed'
    | 'indeterminate';
  readonly diagnostic?: NativePasteAttemptDiagnostic;
}

const NATIVE_PASTE_DIAGNOSTIC_KEYS = [
  'sendInputRequestedCount',
  'sendInputInsertedCount',
  'sendInputStructSize',
  'sendInputLastError',
  'foregroundValidationPassed',
  'rootWindowValidationPassed',
  'pidValidationPassed',
  'clipboardSequenceValidationPassed',
  'modifierValidationPassed',
  'hostSessionMatchesTarget',
  'hostIntegrityRelation',
] as const;

function parseNativePasteDiagnostic(
  value: unknown,
): NativePasteAttemptDiagnostic | undefined {
  if (value === undefined) return undefined;
  if (
    !isRecord(value) ||
    !exactKeys(value, NATIVE_PASTE_DIAGNOSTIC_KEYS) ||
    !Number.isInteger(value.sendInputRequestedCount) ||
    (value.sendInputRequestedCount as number) < 0 ||
    (value.sendInputRequestedCount as number) > 4 ||
    !Number.isInteger(value.sendInputInsertedCount) ||
    (value.sendInputInsertedCount as number) < 0 ||
    (value.sendInputInsertedCount as number) > 4 ||
    !Number.isInteger(value.sendInputStructSize) ||
    (value.sendInputStructSize as number) <= 0 ||
    (value.sendInputStructSize as number) > 1024 ||
    !Number.isInteger(value.sendInputLastError) ||
    (value.sendInputLastError as number) < 0 ||
    (value.sendInputLastError as number) > 0xffff_ffff ||
    typeof value.foregroundValidationPassed !== 'boolean' ||
    typeof value.rootWindowValidationPassed !== 'boolean' ||
    typeof value.pidValidationPassed !== 'boolean' ||
    typeof value.clipboardSequenceValidationPassed !== 'boolean' ||
    typeof value.modifierValidationPassed !== 'boolean' ||
    (value.hostSessionMatchesTarget !== null &&
      typeof value.hostSessionMatchesTarget !== 'boolean') ||
    (value.hostIntegrityRelation !== 'same' &&
      value.hostIntegrityRelation !== 'host-lower' &&
      value.hostIntegrityRelation !== 'host-higher' &&
      value.hostIntegrityRelation !== 'unknown')
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  return value as unknown as NativePasteAttemptDiagnostic;
}

function mapPasteError(
  error: NativeAutomaticPasteErrorCode,
): ParsedPasteClipboardResponse['result'] {
  if (error === 'not-foreground' || error === 'foreground-unavailable')
    return 'not-foreground';
  if (error === 'clipboard-changed') return 'clipboard-changed';
  if (error === 'unsafe-keyboard-state') return 'unsafe-keyboard-state';
  if (error === 'paste-busy') return 'busy';
  if (error === 'input-injection-failed') return 'input-injection-failed';
  return 'indeterminate';
}

export function parsePasteClipboardResponseWithDiagnostic(
  value: unknown,
  expectedRequestId: string,
  allowNativeDiagnostic: boolean,
): ParsedPasteClipboardResponse {
  const { response } = parseV2Envelope(value, expectedRequestId);
  const diagnostic = allowNativeDiagnostic
    ? parseNativePasteDiagnostic(response.nativePasteDiagnostic)
    : undefined;
  const envelopeDiagnosticKey =
    diagnostic === undefined ? [] : ['nativePasteDiagnostic'];
  if (response.status === 'error') {
    if (
      !exactKeys(response, [
        'protocolVersion',
        'requestId',
        'status',
        'hostVersion',
        'safeErrorCode',
        ...envelopeDiagnosticKey,
      ]) ||
      typeof response.safeErrorCode !== 'string' ||
      !(NATIVE_AUTOMATIC_PASTE_ERROR_CODES as readonly string[]).includes(
        response.safeErrorCode,
      )
    ) {
      throw new NativeClipboardResponseValidationError('invalid-host-response');
    }
    return {
      result: mapPasteError(
        response.safeErrorCode as NativeAutomaticPasteErrorCode,
      ),
      ...(diagnostic === undefined ? {} : { diagnostic }),
    };
  }
  if (
    response.status !== 'success' ||
    !exactKeys(response, [
      'protocolVersion',
      'requestId',
      'status',
      'hostVersion',
      'result',
      ...envelopeDiagnosticKey,
    ]) ||
    !isRecord(response.result) ||
    !exactKeys(response.result, ['operation', 'outcome']) ||
    response.result.operation !== 'paste-clipboard' ||
    response.result.outcome !== 'paste-issued'
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  return {
    result: 'paste-issued',
    ...(diagnostic === undefined ? {} : { diagnostic }),
  };
}

export function parsePasteClipboardResponse(
  value: unknown,
  expectedRequestId: string,
): ParsedPasteClipboardResponse['result'] {
  const { response } = parseV2Envelope(value, expectedRequestId);
  const error = parseV2Error(response);
  if (error !== undefined) return mapPasteError(error);
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
    !exactKeys(response.result, ['operation', 'outcome']) ||
    response.result.operation !== 'paste-clipboard' ||
    response.result.outcome !== 'paste-issued'
  ) {
    throw new NativeClipboardResponseValidationError('invalid-host-response');
  }
  return 'paste-issued';
}
