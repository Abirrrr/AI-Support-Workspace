export type AutomaticPasteDiagnosticFailureCodeV1 =
  | 'snippet-unavailable'
  | 'stale-trigger'
  | 'unsupported-content'
  | 'asset-unavailable'
  | 'asset-ownership-invalid'
  | 'asset-invalid'
  | 'permission-required'
  | 'offscreen-create-failed'
  | 'offscreen-message-failed'
  | 'invalid-offscreen-response'
  | 'clipboard-write-failed'
  | 'clipboard-copy-event-unavailable'
  | 'clipboard-copy-command-failed'
  | 'clipboard-copy-data-failed'
  | 'image-invalid'
  | 'image-decode-failed'
  | 'image-too-large'
  | 'animated-webp'
  | 'native-permission-required'
  | 'host-unavailable'
  | 'host-version-mismatch'
  | 'invalid-host-response'
  | 'native-delivery-busy'
  | 'automatic-delivery-busy'
  | 'stale-catalog'
  | 'unexpected-delivery-failure';

export type AutomaticPasteDiagnosticResultV1 =
  | 'paste-issued'
  | 'clipboard-only'
  | 'unsafe-focus'
  | 'not-foreground'
  | 'clipboard-changed'
  | 'unsafe-keyboard-state'
  | 'busy'
  | 'native-unavailable'
  | 'input-injection-failed'
  | 'indeterminate'
  | 'delivery-failed';

export type AutomaticPasteDiagnosticTerminalStageV1 =
  | 'activation'
  | 'preflight'
  | 'clipboard-preparation'
  | 'clipboard-write'
  | 'browser-safety-validation'
  | 'native-context-capture'
  | 'trigger-cleanup'
  | 'editor-revalidation'
  | 'service-worker-coordination'
  | 'native-foreground-validation'
  | 'native-clipboard-validation'
  | 'native-keyboard-validation'
  | 'input-injection'
  | 'native-response'
  | 'complete';

export type AutomaticPasteDiagnosticSafetyCategoryV1 =
  | 'browser-sender'
  | 'browser-tab-window'
  | 'editor-focus-selection'
  | 'editor-cleanup-state'
  | 'native-foreground-context'
  | 'clipboard-sequence'
  | 'keyboard-modifiers'
  | 'delivery-concurrency'
  | 'native-capability'
  | 'response-correlation'
  | 'input-injection'
  | null;

export interface AutomaticPasteDiagnosticTimingsV1 {
  readonly clipboardPreparation: number | null;
  readonly clipboardWrite: number | null;
  readonly browserSafetyPreparation: number | null;
  readonly nativeContextCaptureRoundtrip: number | null;
  readonly triggerCleanupAndRevalidation: number | null;
  readonly nativePasteRequestRoundtrip: number | null;
  readonly totalObservedDelivery: number | null;
}

export interface AutomaticPasteDiagnosticRecordV1 {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly occurredAt: string;
  readonly requestId: string;
  readonly kind: 'text' | 'image';
  readonly result: AutomaticPasteDiagnosticResultV1;
  readonly terminalStage: AutomaticPasteDiagnosticTerminalStageV1;
  readonly safetyCategory: AutomaticPasteDiagnosticSafetyCategoryV1;
  readonly failureCode: AutomaticPasteDiagnosticFailureCodeV1 | null;
  readonly timingsMs: AutomaticPasteDiagnosticTimingsV1;
}

export interface AutomaticPasteDiagnosticsExportV1 {
  readonly format: 'ai-support-workspace-automatic-paste-diagnostics';
  readonly formatVersion: 1;
  readonly exportedAt: string;
  readonly records: readonly AutomaticPasteDiagnosticRecordV1[];
}

const FAILURE_CODES = new Set<AutomaticPasteDiagnosticFailureCodeV1>([
  'snippet-unavailable',
  'stale-trigger',
  'unsupported-content',
  'asset-unavailable',
  'asset-ownership-invalid',
  'asset-invalid',
  'permission-required',
  'offscreen-create-failed',
  'offscreen-message-failed',
  'invalid-offscreen-response',
  'clipboard-write-failed',
  'clipboard-copy-event-unavailable',
  'clipboard-copy-command-failed',
  'clipboard-copy-data-failed',
  'image-invalid',
  'image-decode-failed',
  'image-too-large',
  'animated-webp',
  'native-permission-required',
  'host-unavailable',
  'host-version-mismatch',
  'invalid-host-response',
  'native-delivery-busy',
  'automatic-delivery-busy',
  'stale-catalog',
  'unexpected-delivery-failure',
]);

const RESULTS = new Set<AutomaticPasteDiagnosticResultV1>([
  'paste-issued',
  'clipboard-only',
  'unsafe-focus',
  'not-foreground',
  'clipboard-changed',
  'unsafe-keyboard-state',
  'busy',
  'native-unavailable',
  'input-injection-failed',
  'indeterminate',
  'delivery-failed',
]);

const TERMINAL_STAGES = new Set<AutomaticPasteDiagnosticTerminalStageV1>([
  'activation',
  'preflight',
  'clipboard-preparation',
  'clipboard-write',
  'browser-safety-validation',
  'native-context-capture',
  'trigger-cleanup',
  'editor-revalidation',
  'service-worker-coordination',
  'native-foreground-validation',
  'native-clipboard-validation',
  'native-keyboard-validation',
  'input-injection',
  'native-response',
  'complete',
]);

const SAFETY_CATEGORIES = new Set<
  Exclude<AutomaticPasteDiagnosticSafetyCategoryV1, null>
>([
  'browser-sender',
  'browser-tab-window',
  'editor-focus-selection',
  'editor-cleanup-state',
  'native-foreground-context',
  'clipboard-sequence',
  'keyboard-modifiers',
  'delivery-concurrency',
  'native-capability',
  'response-correlation',
  'input-injection',
]);

const RECORD_KEYS = [
  'schemaVersion',
  'id',
  'occurredAt',
  'requestId',
  'kind',
  'result',
  'terminalStage',
  'safetyCategory',
  'failureCode',
  'timingsMs',
] as const;

const TIMING_KEYS = [
  'clipboardPreparation',
  'clipboardWrite',
  'browserSafetyPreparation',
  'nativeContextCaptureRoundtrip',
  'triggerCleanupAndRevalidation',
  'nativePasteRequestRoundtrip',
  'totalObservedDelivery',
] as const;

const EXPORT_KEYS = [
  'format',
  'formatVersion',
  'exportedAt',
  'records',
] as const;
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function containsDangerousKey(
  value: unknown,
  seen: WeakSet<object> = new WeakSet(),
): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (seen.has(value)) return true;
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) return true;
    if (containsDangerousKey((value as Record<string, unknown>)[key], seen)) {
      return true;
    }
  }
  return false;
}

function isCanonicalUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value);
}

function isCanonicalUtc(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

export function normalizeAutomaticPasteDiagnosticDuration(
  value: unknown,
): number | null {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 300_000
    ? value
    : null;
}

function validateTimings(value: unknown): AutomaticPasteDiagnosticTimingsV1 {
  if (
    !isPlainRecord(value) ||
    containsDangerousKey(value) ||
    !hasExactKeys(value, TIMING_KEYS)
  ) {
    throw new TypeError('Automatic Paste diagnostic timings are invalid.');
  }
  for (const key of TIMING_KEYS) {
    const timing = value[key];
    if (
      timing !== null &&
      (typeof timing !== 'number' ||
        !Number.isFinite(timing) ||
        timing < 0 ||
        timing > 300_000)
    ) {
      throw new TypeError('Automatic Paste diagnostic timings are invalid.');
    }
  }
  return {
    clipboardPreparation: value.clipboardPreparation as number | null,
    clipboardWrite: value.clipboardWrite as number | null,
    browserSafetyPreparation: value.browserSafetyPreparation as number | null,
    nativeContextCaptureRoundtrip: value.nativeContextCaptureRoundtrip as
      number | null,
    triggerCleanupAndRevalidation: value.triggerCleanupAndRevalidation as
      number | null,
    nativePasteRequestRoundtrip: value.nativePasteRequestRoundtrip as
      number | null,
    totalObservedDelivery: value.totalObservedDelivery as number | null,
  };
}

export function validateAutomaticPasteDiagnosticRecordV1(
  value: unknown,
): AutomaticPasteDiagnosticRecordV1 {
  if (
    !isPlainRecord(value) ||
    containsDangerousKey(value) ||
    !hasExactKeys(value, RECORD_KEYS) ||
    value.schemaVersion !== 1 ||
    !isCanonicalUuid(value.id) ||
    !isCanonicalUuid(value.requestId) ||
    value.id === value.requestId ||
    !isCanonicalUtc(value.occurredAt) ||
    (value.kind !== 'text' && value.kind !== 'image') ||
    !RESULTS.has(value.result as AutomaticPasteDiagnosticResultV1) ||
    !TERMINAL_STAGES.has(
      value.terminalStage as AutomaticPasteDiagnosticTerminalStageV1,
    ) ||
    (value.safetyCategory !== null &&
      !SAFETY_CATEGORIES.has(
        value.safetyCategory as Exclude<
          AutomaticPasteDiagnosticSafetyCategoryV1,
          null
        >,
      )) ||
    (value.failureCode !== null &&
      !FAILURE_CODES.has(
        value.failureCode as AutomaticPasteDiagnosticFailureCodeV1,
      )) ||
    (value.result !== 'delivery-failed' && value.failureCode !== null)
  ) {
    throw new TypeError('Automatic Paste diagnostic record is invalid.');
  }
  return {
    schemaVersion: 1,
    id: value.id,
    occurredAt: value.occurredAt,
    requestId: value.requestId,
    kind: value.kind,
    result: value.result as AutomaticPasteDiagnosticResultV1,
    terminalStage:
      value.terminalStage as AutomaticPasteDiagnosticTerminalStageV1,
    safetyCategory:
      value.safetyCategory as AutomaticPasteDiagnosticSafetyCategoryV1,
    failureCode:
      value.failureCode as AutomaticPasteDiagnosticFailureCodeV1 | null,
    timingsMs: validateTimings(value.timingsMs),
  };
}

export function validateAutomaticPasteDiagnosticExportV1(
  value: unknown,
): AutomaticPasteDiagnosticsExportV1 {
  if (
    !isPlainRecord(value) ||
    containsDangerousKey(value) ||
    !hasExactKeys(value, EXPORT_KEYS) ||
    value.format !== 'ai-support-workspace-automatic-paste-diagnostics' ||
    value.formatVersion !== 1 ||
    !isCanonicalUtc(value.exportedAt) ||
    !Array.isArray(value.records)
  ) {
    throw new TypeError('Automatic Paste diagnostics export is invalid.');
  }
  return {
    format: 'ai-support-workspace-automatic-paste-diagnostics',
    formatVersion: 1,
    exportedAt: value.exportedAt,
    records: value.records.map(validateAutomaticPasteDiagnosticRecordV1),
  };
}
