export const BACKUP_REMINDER_INTERVAL_MS = 30 * 24 * 60 * 60 * 1_000;

export type BackupReminderStatus = 'never' | 'current' | 'due';

export interface BackupReminderSnapshot {
  readonly lastSuccessfulBackupAt: string | null;
  readonly status: BackupReminderStatus;
}

export interface BackupReminderStateRepository {
  loadLastSuccessfulBackupAt(): Promise<unknown>;
  recordSuccessfulBackupAt(timestamp: string): Promise<void>;
}

export interface SuccessfulBackupRecorder {
  recordSuccessfulBackup(): Promise<BackupReminderSnapshot>;
}

export function isCanonicalUtcIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

export function deriveBackupReminderSnapshot(
  value: unknown,
  now: Date,
): BackupReminderSnapshot {
  if (!isCanonicalUtcIsoTimestamp(value)) {
    return { lastSuccessfulBackupAt: null, status: 'never' };
  }

  const elapsed = now.valueOf() - new Date(value).valueOf();
  if (elapsed < 0) {
    return { lastSuccessfulBackupAt: null, status: 'never' };
  }

  return {
    lastSuccessfulBackupAt: value,
    status: elapsed >= BACKUP_REMINDER_INTERVAL_MS ? 'due' : 'current',
  };
}

export class BackupReminderService implements SuccessfulBackupRecorder {
  constructor(
    private readonly repository: BackupReminderStateRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async load(): Promise<BackupReminderSnapshot> {
    return deriveBackupReminderSnapshot(
      await this.repository.loadLastSuccessfulBackupAt(),
      this.now(),
    );
  }

  async recordSuccessfulBackup(): Promise<BackupReminderSnapshot> {
    const now = this.now();
    const timestamp = now.toISOString();
    await this.repository.recordSuccessfulBackupAt(timestamp);
    return deriveBackupReminderSnapshot(timestamp, now);
  }
}
