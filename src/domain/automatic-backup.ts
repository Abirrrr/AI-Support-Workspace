export type AutomaticBackupCadence = 'off' | 'daily' | 'weekly';

export type ActiveAutomaticBackupCadence = Exclude<
  AutomaticBackupCadence,
  'off'
>;

export const AUTOMATIC_BACKUP_INTERVAL_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 168 * 60 * 60 * 1000,
} as const satisfies Record<ActiveAutomaticBackupCadence, number>;

export const AUTOMATIC_BACKUP_RETENTION_LIMIT = {
  daily: 7,
  weekly: 4,
} as const satisfies Record<ActiveAutomaticBackupCadence, number>;

export const AUTOMATIC_BACKUP_LEASE_MS = 30 * 60 * 1000;
export const MAX_MANAGED_BACKUP_ENTRIES = 32;

export interface AutomaticBackupDirectoryHandle {
  readonly kind: 'directory';
  readonly name: string;
}

export interface AutomaticBackupSchedule {
  readonly scheduleId: string;
  readonly cadence: ActiveAutomaticBackupCadence;
  readonly anchorAt: string;
  readonly nextDueAt: string;
}

export interface AutomaticBackupLease {
  readonly leaseId: string;
  readonly backupSetId: string;
  readonly scheduleId: string;
  readonly acquiredAt: string;
  readonly expiresAt: string;
}

export interface ManagedBackupManifestEntry {
  readonly backupId: string;
  readonly backupSetId: string;
  readonly filename: string;
  readonly createdAt: string;
  readonly formatVersion: 7;
  readonly creationMode: 'automatic';
  readonly byteLength: number;
  readonly sha256: string;
}

export type AutomaticBackupFailureCode =
  | 'location-unavailable'
  | 'overlapping-run'
  | 'lease-active'
  | 'backup-creation-failed'
  | 'file-collision'
  | 'write-or-verification-failed'
  | 'active-context-changed'
  | 'retention-warning';

export interface AutomaticBackupFailureState {
  readonly code: AutomaticBackupFailureCode;
  readonly occurredAt: string;
}

export interface AutomaticBackupState {
  readonly directoryHandle: AutomaticBackupDirectoryHandle;
  readonly backupSetId: string;
  readonly schedule?: AutomaticBackupSchedule | undefined;
  readonly lease?: AutomaticBackupLease | undefined;
  readonly managedBackups: readonly ManagedBackupManifestEntry[];
  readonly lastAttemptAt?: string;
  readonly lastSuccessAt?: string;
  readonly lastFailure?: AutomaticBackupFailureState | undefined;
}

export function isAutomaticBackupCadence(
  value: unknown,
): value is AutomaticBackupCadence {
  return value === 'off' || value === 'daily' || value === 'weekly';
}

export function isActiveAutomaticBackupCadence(
  value: AutomaticBackupCadence,
): value is ActiveAutomaticBackupCadence {
  return value !== 'off';
}
