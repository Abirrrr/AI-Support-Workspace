import type { AutomaticPasteDiagnosticsRepository } from '../../application/persistence/automatic-paste-diagnostics-repository';
import { AUTOMATIC_PASTE_DIAGNOSTIC_MAX_RECORDS } from '../../application/snippet/automatic-paste-diagnostics';
import {
  validateAutomaticPasteDiagnosticRecordV1,
  type AutomaticPasteDiagnosticRecordV1,
} from '../../domain/automatic-paste-diagnostics';
import type { AiSupportWorkspaceDatabase } from './database';
import { runPersistenceOperation } from './repository-helpers';
import {
  toAutomaticPasteDiagnosticRecord,
  toAutomaticPasteDiagnosticRecordV1,
} from './automatic-paste-diagnostics-record';

const GLOBAL_DIAGNOSTICS_STATE_ID = 'global';

export interface AutomaticPasteDiagnosticsRepositoryTestHooks {
  afterAppend?(): void | Promise<void>;
}

function validateCanonicalUtc(value: string): void {
  try {
    if (new Date(value).toISOString() !== value) throw new TypeError();
  } catch {
    throw new TypeError('Automatic Paste diagnostics cutoff is invalid.');
  }
}

function compareRecords(
  left: AutomaticPasteDiagnosticRecordV1,
  right: AutomaticPasteDiagnosticRecordV1,
): number {
  return (
    left.occurredAt.localeCompare(right.occurredAt) ||
    left.id.localeCompare(right.id)
  );
}

export class DexieAutomaticPasteDiagnosticsRepository implements AutomaticPasteDiagnosticsRepository {
  constructor(
    private readonly database: AiSupportWorkspaceDatabase,
    private readonly testHooks: AutomaticPasteDiagnosticsRepositoryTestHooks = {},
  ) {}

  isEnabled(): Promise<boolean> {
    return runPersistenceOperation(
      'read Automatic Paste diagnostics state',
      async () => {
        const record = await this.database.automaticPasteDiagnosticsState.get(
          GLOBAL_DIAGNOSTICS_STATE_ID,
        );
        if (record === undefined) return false;
        if (
          Object.keys(record).sort().join(',') !== 'enabled,id' ||
          record.id !== GLOBAL_DIAGNOSTICS_STATE_ID ||
          typeof record.enabled !== 'boolean'
        ) {
          throw new TypeError(
            'Persisted Automatic Paste diagnostics state is invalid.',
          );
        }
        return record.enabled;
      },
    );
  }

  setEnabled(enabled: boolean): Promise<void> {
    if (typeof enabled !== 'boolean') {
      return Promise.reject(
        new TypeError('Automatic Paste diagnostics state is invalid.'),
      );
    }
    return runPersistenceOperation(
      'save Automatic Paste diagnostics state',
      async () => {
        await this.database.automaticPasteDiagnosticsState.put({
          id: GLOBAL_DIAGNOSTICS_STATE_ID,
          enabled,
        });
      },
    );
  }

  appendAndPrune(
    record: AutomaticPasteDiagnosticRecordV1,
    retainFromInclusive: string,
  ): Promise<void> {
    const validated = validateAutomaticPasteDiagnosticRecordV1(record);
    validateCanonicalUtc(retainFromInclusive);
    return runPersistenceOperation(
      'append Automatic Paste diagnostic record',
      () =>
        this.database.transaction(
          'rw',
          this.database.automaticPasteDiagnosticRecords,
          async () => {
            await this.database.automaticPasteDiagnosticRecords.add(
              toAutomaticPasteDiagnosticRecord(validated),
            );
            await this.testHooks.afterAppend?.();
            await this.pruneWithinTransaction(retainFromInclusive);
          },
        ),
    );
  }

  pruneAndList(
    retainFromInclusive: string,
  ): Promise<readonly AutomaticPasteDiagnosticRecordV1[]> {
    validateCanonicalUtc(retainFromInclusive);
    return runPersistenceOperation(
      'prune and list Automatic Paste diagnostic records',
      () =>
        this.database.transaction(
          'rw',
          this.database.automaticPasteDiagnosticRecords,
          async () => {
            await this.pruneWithinTransaction(retainFromInclusive);
            return (
              await this.database.automaticPasteDiagnosticRecords.toArray()
            )
              .map(toAutomaticPasteDiagnosticRecordV1)
              .sort(compareRecords);
          },
        ),
    );
  }

  clearRecords(): Promise<void> {
    return runPersistenceOperation(
      'clear Automatic Paste diagnostic records',
      async () => {
        await this.database.automaticPasteDiagnosticRecords.clear();
      },
    );
  }

  private async pruneWithinTransaction(
    retainFromInclusive: string,
  ): Promise<void> {
    await this.database.automaticPasteDiagnosticRecords
      .where('occurredAt')
      .below(retainFromInclusive)
      .delete();
    const count = await this.database.automaticPasteDiagnosticRecords.count();
    const excess = count - AUTOMATIC_PASTE_DIAGNOSTIC_MAX_RECORDS;
    if (excess <= 0) return;
    const oldestIds = await this.database.automaticPasteDiagnosticRecords
      .orderBy('[occurredAt+id]')
      .limit(excess)
      .primaryKeys();
    await this.database.automaticPasteDiagnosticRecords.bulkDelete(oldestIds);
  }
}
