import type { AutomaticBackupState } from '../../domain/automatic-backup';

export interface AutomaticBackupStateRepository {
  load(): Promise<AutomaticBackupState | undefined>;
  save(state: AutomaticBackupState): Promise<AutomaticBackupState>;
  updateAtomically(
    update: (
      current: AutomaticBackupState | undefined,
    ) => AutomaticBackupState | undefined,
  ): Promise<AutomaticBackupState | undefined>;
  clear(): Promise<void>;
}
