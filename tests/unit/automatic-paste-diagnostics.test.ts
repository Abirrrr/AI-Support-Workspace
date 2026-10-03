import { describe, expect, it } from 'vitest';
import { parseBackupFile } from '../../src/application/backup/backup-validator';

import { mapSnippetDeliveryFailureCodeToDiagnosticV1 } from '../../src/application/snippet/automatic-paste-diagnostics';
import {
  normalizeAutomaticPasteDiagnosticDuration,
  validateAutomaticPasteDiagnosticExportV1,
  validateAutomaticPasteDiagnosticRecordV1,
  type AutomaticPasteDiagnosticRecordV1,
} from '../../src/domain/automatic-paste-diagnostics';

const FAILURE_CODES = [
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
] as const;

const RESULTS = [
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
] as const;

const TERMINAL_STAGES = [
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
] as const;

const SAFETY_CATEGORIES = [
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
  null,
] as const;

function validRecord() {
  return {
    schemaVersion: 1 as const,
    id: '123e4567-e89b-42d3-a456-426614174000',
    occurredAt: '2026-10-03T00:00:00.000Z',
    requestId: '223e4567-e89b-42d3-a456-426614174000',
    kind: 'text' as const,
    result: 'paste-issued' as const,
    terminalStage: 'complete' as const,
    safetyCategory: null,
    failureCode: null,
    timingsMs: {
      clipboardPreparation: 1,
      clipboardWrite: 2,
      browserSafetyPreparation: 3,
      nativeContextCaptureRoundtrip: 4,
      triggerCleanupAndRevalidation: 5,
      nativePasteRequestRoundtrip: 6,
      totalObservedDelivery: 7,
    },
  };
}

describe('Automatic Paste Diagnostic Record v1', () => {
  it('accepts the exact record and timing keys and returns an owned copy', () => {
    const source = validRecord();
    const validated = validateAutomaticPasteDiagnosticRecordV1(source);

    expect(validated).toEqual(source);
    expect(validated).not.toBe(source);
    expect(validated.timingsMs).not.toBe(source.timingsMs);
    expect(Object.keys(validated).sort()).toEqual(
      [
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
      ].sort(),
    );
    expect(Object.keys(validated.timingsMs).sort()).toEqual(
      [
        'clipboardPreparation',
        'clipboardWrite',
        'browserSafetyPreparation',
        'nativeContextCaptureRoundtrip',
        'triggerCleanupAndRevalidation',
        'nativePasteRequestRoundtrip',
        'totalObservedDelivery',
      ].sort(),
    );
  });

  it.each(RESULTS)('accepts result %s', (result) => {
    expect(
      validateAutomaticPasteDiagnosticRecordV1({
        ...validRecord(),
        result,
      }).result,
    ).toBe(result);
  });

  it.each(TERMINAL_STAGES)('accepts terminal stage %s', (terminalStage) => {
    expect(
      validateAutomaticPasteDiagnosticRecordV1({
        ...validRecord(),
        terminalStage,
      }).terminalStage,
    ).toBe(terminalStage);
  });

  it.each(SAFETY_CATEGORIES)('accepts safety category %s', (safetyCategory) => {
    expect(
      validateAutomaticPasteDiagnosticRecordV1({
        ...validRecord(),
        safetyCategory,
      }).safetyCategory,
    ).toBe(safetyCategory);
  });

  it.each(FAILURE_CODES)('accepts frozen failure code %s', (failureCode) => {
    expect(
      validateAutomaticPasteDiagnosticRecordV1({
        ...validRecord(),
        result: 'delivery-failed',
        terminalStage: 'clipboard-preparation',
        failureCode,
      }).failureCode,
    ).toBe(failureCode);
  });

  const invalidRecordMutations: ReadonlyArray<
    readonly [string, (value: AutomaticPasteDiagnosticRecordV1) => unknown]
  > = [
    [
      'missing record key',
      (value) => {
        const changed: Record<string, unknown> = { ...value };
        Reflect.deleteProperty(changed, 'failureCode');
        return changed;
      },
    ],
    ['extra record key', (value) => ({ ...value, metadata: {} })],
    [
      'missing timing key',
      (value) => {
        const timingsMs: Record<string, unknown> = { ...value.timingsMs };
        Reflect.deleteProperty(timingsMs, 'clipboardWrite');
        return { ...value, timingsMs };
      },
    ],
    [
      'extra timing key',
      (value) => ({ ...value, timingsMs: { ...value.timingsMs, message: '' } }),
    ],
    ['uppercase UUID', (value) => ({ ...value, id: value.id.toUpperCase() })],
    ['malformed UUID', (value) => ({ ...value, requestId: 'request-1' })],
    ['same IDs', (value) => ({ ...value, requestId: value.id })],
    [
      'noncanonical timestamp',
      (value) => ({ ...value, occurredAt: '2026-10-03T00:00:00Z' }),
    ],
    ['unknown result', (value) => ({ ...value, result: 'unknown' })],
    ['unknown stage', (value) => ({ ...value, terminalStage: 'unknown' })],
    [
      'unknown safety category',
      (value) => ({ ...value, safetyCategory: 'unknown' }),
    ],
    [
      'unknown failure code',
      (value) => ({ ...value, failureCode: 'new-code' }),
    ],
    [
      'unexpected prototype',
      (value) => Object.assign(Object.create({ inherited: true }), value),
    ],
    [
      'dangerous nested key',
      (value) => ({
        ...value,
        timingsMs: JSON.parse(
          '{"clipboardPreparation":1,"clipboardWrite":2,"browserSafetyPreparation":3,"nativeContextCaptureRoundtrip":4,"triggerCleanupAndRevalidation":5,"nativePasteRequestRoundtrip":6,"totalObservedDelivery":7,"__proto__":{}}',
        ),
      }),
    ],
  ];

  it.each(invalidRecordMutations)('rejects %s', (_name, mutate) => {
    expect(() =>
      validateAutomaticPasteDiagnosticRecordV1(mutate(validRecord())),
    ).toThrow(TypeError);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1, 300_000.001])(
    'rejects invalid timing %s',
    (clipboardWrite) => {
      expect(() =>
        validateAutomaticPasteDiagnosticRecordV1({
          ...validRecord(),
          timingsMs: { ...validRecord().timingsMs, clipboardWrite },
        }),
      ).toThrow(TypeError);
    },
  );

  it('rejects cyclic malformed objects without traversing indefinitely', () => {
    const cyclic = { ...validRecord() } as Record<string, unknown>;
    cyclic.timingsMs = cyclic;
    expect(() => validateAutomaticPasteDiagnosticRecordV1(cyclic)).toThrow(
      TypeError,
    );
  });

  it.each([null, 0, 300_000])(
    'accepts timing boundary %s',
    (clipboardWrite) => {
      expect(
        validateAutomaticPasteDiagnosticRecordV1({
          ...validRecord(),
          timingsMs: { ...validRecord().timingsMs, clipboardWrite },
        }).timingsMs.clipboardWrite,
      ).toBe(clipboardWrite);
    },
  );
});

describe('Automatic Paste diagnostic failure-code mapping', () => {
  it.each(FAILURE_CODES)('explicitly maps approved live code %s', (code) => {
    expect(mapSnippetDeliveryFailureCodeToDiagnosticV1(code)).toBe(code);
  });

  it.each(['future-code', '', null, undefined, new Error('private detail')])(
    'maps unknown or invalid value to null',
    (value) => {
      expect(mapSnippetDeliveryFailureCodeToDiagnosticV1(value)).toBeNull();
    },
  );
});

describe('Automatic Paste diagnostics export v1', () => {
  it('accepts only the exact standalone export keys and strict records', () => {
    const value = {
      format: 'ai-support-workspace-automatic-paste-diagnostics' as const,
      formatVersion: 1 as const,
      exportedAt: '2026-10-03T01:02:03.004Z',
      records: [validRecord()],
    };

    expect(validateAutomaticPasteDiagnosticExportV1(value)).toEqual(value);
    expect(() =>
      validateAutomaticPasteDiagnosticExportV1({ ...value, enabled: true }),
    ).toThrow(TypeError);
    expect(() =>
      validateAutomaticPasteDiagnosticExportV1({
        ...value,
        format: 'ai-support-workspace-backup',
      }),
    ).toThrow(TypeError);
    expect(() =>
      validateAutomaticPasteDiagnosticExportV1({
        ...value,
        records: [{ ...validRecord(), message: 'private detail' }],
      }),
    ).toThrow(TypeError);
    expect(() => parseBackupFile(JSON.stringify(value))).toThrow();
  });
});

describe('Automatic Paste diagnostic timing normalization', () => {
  it.each([
    [null, null],
    [undefined, null],
    [Number.NaN, null],
    [Number.POSITIVE_INFINITY, null],
    [-1, null],
    [300_000.001, null],
    [0, 0],
    [12.5, 12.5],
    [300_000, 300_000],
  ] as const)('normalizes %s to %s without clamping', (value, expected) => {
    expect(normalizeAutomaticPasteDiagnosticDuration(value)).toBe(expected);
  });
});
