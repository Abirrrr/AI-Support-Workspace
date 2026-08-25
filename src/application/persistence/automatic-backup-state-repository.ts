import type { AutomaticBackupState } from '../../domain/automatic-backup';

export interface AutomaticBackupStateRepository {
  load(): Promise<AutomaticBackupState | undefined>;
  save(state: AutomaticBackupState): Promise<AutomaticBackupState>;
  clear(): Promise<void>;
}
