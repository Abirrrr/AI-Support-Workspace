import type { NativeClipboardCapabilityStatus } from '../application/snippet/image-clipboard-transport';

export interface NativeClipboardStatusRequest {
  readonly type: 'native-clipboard-status-request';
}

export interface NativeClipboardStatusResponse {
  readonly type: 'native-clipboard-status-response';
  readonly status: NativeClipboardCapabilityStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

export function isNativeClipboardStatusRequest(
  value: unknown,
): value is NativeClipboardStatusRequest {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['type']) &&
    value.type === 'native-clipboard-status-request'
  );
}

export function isNativeClipboardStatusResponse(
  value: unknown,
): value is NativeClipboardStatusResponse {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['type', 'status']) &&
    value.type === 'native-clipboard-status-response' &&
    (value.status === 'unsupported-platform' ||
      value.status === 'permission-not-granted' ||
      value.status === 'host-unavailable' ||
      value.status === 'host-version-mismatch' ||
      value.status === 'invalid-host-response' ||
      value.status === 'ready')
  );
}
