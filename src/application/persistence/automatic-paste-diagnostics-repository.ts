import type { AutomaticPasteDiagnosticRecordV1 } from '../../domain/automatic-paste-diagnostics';

export interface AutomaticPasteDiagnosticsRepository {
  isEnabled(): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<void>;
  appendAndPrune(
    record: AutomaticPasteDiagnosticRecordV1,
    retainFromInclusive: string,
  ): Promise<void>;
  pruneAndList(
    retainFromInclusive: string,
  ): Promise<readonly AutomaticPasteDiagnosticRecordV1[]>;
  clearRecords(): Promise<void>;
}
