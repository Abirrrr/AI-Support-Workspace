import type { AutomaticBackupState } from '../../domain/automatic-backup';

export const AUTOMATIC_BACKUP_STATE_ID = 'global' as const;

export interface AutomaticBackupStateRecord extends AutomaticBackupState {
  readonly id: typeof AUTOMATIC_BACKUP_STATE_ID;
}
