import type { AutomaticBackupStateRepository } from '../../application/persistence/automatic-backup-state-repository';
import type { AutomaticBackupState } from '../../domain/automatic-backup';
import type { AiSupportWorkspaceDatabase } from './database';
import {
  AUTOMATIC_BACKUP_STATE_ID,
  type AutomaticBackupStateRecord,
} from './automatic-backup-state-record';
import { runPersistenceOperation } from './repository-helpers';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function toState(record: AutomaticBackupStateRecord): AutomaticBackupState {
  if (
    record.directoryHandle.kind !== 'directory' ||
    typeof record.directoryHandle.name !== 'string' ||
    !UUID_V4_PATTERN.test(record.backupSetId)
  ) {
    throw new TypeError('Persisted automatic-backup state is invalid.');
  }
  return {
    directoryHandle: record.directoryHandle,
    backupSetId: record.backupSetId,
  };
}

export class DexieAutomaticBackupStateRepository implements AutomaticBackupStateRepository {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  load(): Promise<AutomaticBackupState | undefined> {
    return runPersistenceOperation('load automatic-backup state', async () => {
      const record = await this.database.automaticBackupState.get(
        AUTOMATIC_BACKUP_STATE_ID,
      );
      return record === undefined ? undefined : toState(record);
    });
  }

  save(state: AutomaticBackupState): Promise<AutomaticBackupState> {
    return runPersistenceOperation('save automatic-backup state', async () => {
      const record: AutomaticBackupStateRecord = {
        id: AUTOMATIC_BACKUP_STATE_ID,
        ...state,
      };
      const validated = toState(record);
      await this.database.automaticBackupState.put(record);
      return validated;
    });
  }

  clear(): Promise<void> {
    return runPersistenceOperation('clear automatic-backup state', async () => {
      await this.database.automaticBackupState.clear();
    });
  }
}
