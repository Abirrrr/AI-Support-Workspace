import {
  validateAutomaticPasteDiagnosticExportV1,
  type AutomaticPasteDiagnosticsExportV1,
} from '../domain/automatic-paste-diagnostics';

export type AutomaticPasteDiagnosticsRequest =
  | { readonly type: 'automatic-paste-diagnostics-get-state' }
  | {
      readonly type: 'automatic-paste-diagnostics-set-enabled';
      readonly enabled: boolean;
    }
  | { readonly type: 'automatic-paste-diagnostics-export' }
  | { readonly type: 'automatic-paste-diagnostics-clear' };

export type AutomaticPasteDiagnosticsResponse =
  | {
      readonly type: 'automatic-paste-diagnostics-state';
      readonly enabled: boolean;
    }
  | {
      readonly type: 'automatic-paste-diagnostics-export-result';
      readonly export: AutomaticPasteDiagnosticsExportV1;
    }
  | { readonly type: 'automatic-paste-diagnostics-cleared' };

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

export function isAutomaticPasteDiagnosticsRequest(
  value: unknown,
): value is AutomaticPasteDiagnosticsRequest {
  if (!isPlainRecord(value)) return false;
  if (value.type === 'automatic-paste-diagnostics-get-state') {
    return hasExactKeys(value, ['type']);
  }
  if (value.type === 'automatic-paste-diagnostics-set-enabled') {
    return (
      hasExactKeys(value, ['type', 'enabled']) &&
      typeof value.enabled === 'boolean'
    );
  }
  return (
    (value.type === 'automatic-paste-diagnostics-export' ||
      value.type === 'automatic-paste-diagnostics-clear') &&
    hasExactKeys(value, ['type'])
  );
}

export function validateAutomaticPasteDiagnosticsResponse(
  value: unknown,
): AutomaticPasteDiagnosticsResponse {
  if (!isPlainRecord(value)) {
    throw new TypeError('Automatic Paste diagnostics response is invalid.');
  }
  if (
    value.type === 'automatic-paste-diagnostics-state' &&
    hasExactKeys(value, ['type', 'enabled']) &&
    typeof value.enabled === 'boolean'
  ) {
    return { type: value.type, enabled: value.enabled };
  }
  if (
    value.type === 'automatic-paste-diagnostics-export-result' &&
    hasExactKeys(value, ['type', 'export'])
  ) {
    return {
      type: value.type,
      export: validateAutomaticPasteDiagnosticExportV1(value.export),
    };
  }
  if (
    value.type === 'automatic-paste-diagnostics-cleared' &&
    hasExactKeys(value, ['type'])
  ) {
    return { type: value.type };
  }
  throw new TypeError('Automatic Paste diagnostics response is invalid.');
}
