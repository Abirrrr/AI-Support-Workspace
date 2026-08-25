export type AutomaticBackupCadence = 'off' | 'daily' | 'weekly';

export interface AutomaticBackupDirectoryHandle {
  readonly kind: 'directory';
  readonly name: string;
}

export interface AutomaticBackupState {
  readonly directoryHandle: AutomaticBackupDirectoryHandle;
  readonly backupSetId: string;
}

export function isAutomaticBackupCadence(
  value: unknown,
): value is AutomaticBackupCadence {
  return value === 'off' || value === 'daily' || value === 'weekly';
}
