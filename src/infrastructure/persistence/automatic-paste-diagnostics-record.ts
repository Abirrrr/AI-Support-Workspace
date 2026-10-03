import {
  validateAutomaticPasteDiagnosticRecordV1,
  type AutomaticPasteDiagnosticRecordV1,
} from '../../domain/automatic-paste-diagnostics';

export interface AutomaticPasteDiagnosticsStateRecord {
  readonly id: 'global';
  readonly enabled: boolean;
}

export type AutomaticPasteDiagnosticRecord = AutomaticPasteDiagnosticRecordV1;

export function toAutomaticPasteDiagnosticRecordV1(
  record: AutomaticPasteDiagnosticRecord,
): AutomaticPasteDiagnosticRecordV1 {
  return validateAutomaticPasteDiagnosticRecordV1(record);
}

export function toAutomaticPasteDiagnosticRecord(
  value: AutomaticPasteDiagnosticRecordV1,
): AutomaticPasteDiagnosticRecord {
  return validateAutomaticPasteDiagnosticRecordV1(value);
}
