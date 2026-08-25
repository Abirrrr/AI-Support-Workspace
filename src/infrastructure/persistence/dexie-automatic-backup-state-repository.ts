import type { AutomaticBackupStateRepository } from '../../application/persistence/automatic-backup-state-repository';
import {
  MAX_MANAGED_BACKUP_ENTRIES,
  type AutomaticBackupFailureCode,
  type AutomaticBackupState,
} from '../../domain/automatic-backup';
import type { AiSupportWorkspaceDatabase } from './database';
import {
  AUTOMATIC_BACKUP_STATE_ID,
  type AutomaticBackupStateRecord,
} from './automatic-backup-state-record';
import { runPersistenceOperation } from './repository-helpers';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value);
}

function isCanonicalUtc(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const milliseconds = Date.parse(value);
  return (
    Number.isFinite(milliseconds) &&
    new Date(milliseconds).toISOString() === value
  );
}

function isFailureCode(value: unknown): value is AutomaticBackupFailureCode {
  return (
    value === 'location-unavailable' ||
    value === 'overlapping-run' ||
    value === 'lease-active' ||
    value === 'backup-creation-failed' ||
    value === 'file-collision' ||
    value === 'write-or-verification-failed' ||
    value === 'active-context-changed' ||
    value === 'retention-warning'
  );
}

function toState(record: AutomaticBackupStateRecord): AutomaticBackupState {
  if (
    typeof record.directoryHandle !== 'object' ||
    record.directoryHandle === null ||
    record.directoryHandle.kind !== 'directory' ||
    typeof record.directoryHandle.name !== 'string' ||
    !isUuid(record.backupSetId) ||
    (record.schedule !== undefined &&
      (!isUuid(record.schedule.scheduleId) ||
        (record.schedule.cadence !== 'daily' &&
          record.schedule.cadence !== 'weekly') ||
        !isCanonicalUtc(record.schedule.anchorAt) ||
        !isCanonicalUtc(record.schedule.nextDueAt) ||
        record.schedule.nextDueAt <= record.schedule.anchorAt)) ||
    (record.lease !== undefined &&
      (!isUuid(record.lease.leaseId) ||
        record.lease.backupSetId !== record.backupSetId ||
        !isUuid(record.lease.scheduleId) ||
        record.schedule?.scheduleId !== record.lease.scheduleId ||
        !isCanonicalUtc(record.lease.acquiredAt) ||
        !isCanonicalUtc(record.lease.expiresAt) ||
        record.lease.expiresAt <= record.lease.acquiredAt))
  ) {
    throw new TypeError('Persisted automatic-backup state is invalid.');
  }
  const managedBackups = record.managedBackups ?? [];
  const backupIds = managedBackups.map(({ backupId }) => backupId);
  const filenames = managedBackups.map(({ filename }) => filename);
  if (
    managedBackups.length > MAX_MANAGED_BACKUP_ENTRIES ||
    new Set(backupIds).size !== backupIds.length ||
    new Set(filenames).size !== filenames.length ||
    managedBackups.some(
      (entry) =>
        !isUuid(entry.backupId) ||
        entry.backupSetId !== record.backupSetId ||
        typeof entry.filename !== 'string' ||
        entry.filename.length === 0 ||
        !isCanonicalUtc(entry.createdAt) ||
        entry.formatVersion !== 7 ||
        entry.creationMode !== 'automatic' ||
        !Number.isSafeInteger(entry.byteLength) ||
        entry.byteLength < 0 ||
        !SHA256_PATTERN.test(entry.sha256),
    ) ||
    (record.lastAttemptAt !== undefined &&
      !isCanonicalUtc(record.lastAttemptAt)) ||
    (record.lastSuccessAt !== undefined &&
      !isCanonicalUtc(record.lastSuccessAt)) ||
    (record.lastFailure !== undefined &&
      (!isFailureCode(record.lastFailure.code) ||
        !isCanonicalUtc(record.lastFailure.occurredAt)))
  ) {
    throw new TypeError('Persisted automatic-backup state is invalid.');
  }
  return {
    directoryHandle: record.directoryHandle,
    backupSetId: record.backupSetId,
    ...(record.schedule === undefined ? {} : { schedule: record.schedule }),
    ...(record.lease === undefined ? {} : { lease: record.lease }),
    managedBackups: managedBackups.map((entry) => ({ ...entry })),
    ...(record.lastAttemptAt === undefined
      ? {}
      : { lastAttemptAt: record.lastAttemptAt }),
    ...(record.lastSuccessAt === undefined
      ? {}
      : { lastSuccessAt: record.lastSuccessAt }),
    ...(record.lastFailure === undefined
      ? {}
      : { lastFailure: { ...record.lastFailure } }),
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

  updateAtomically(
    update: (
      current: AutomaticBackupState | undefined,
    ) => AutomaticBackupState | undefined,
  ): Promise<AutomaticBackupState | undefined> {
    return runPersistenceOperation('update automatic-backup state', () =>
      this.database.transaction(
        'rw',
        this.database.automaticBackupState,
        async () => {
          const record = await this.database.automaticBackupState.get(
            AUTOMATIC_BACKUP_STATE_ID,
          );
          const next = update(
            record === undefined ? undefined : toState(record),
          );
          if (next === undefined) {
            await this.database.automaticBackupState.delete(
              AUTOMATIC_BACKUP_STATE_ID,
            );
            return undefined;
          }
          const nextRecord: AutomaticBackupStateRecord = {
            id: AUTOMATIC_BACKUP_STATE_ID,
            ...next,
          };
          const validated = toState(nextRecord);
          await this.database.automaticBackupState.put(nextRecord);
          return validated;
        },
      ),
    );
  }

  clear(): Promise<void> {
    return runPersistenceOperation('clear automatic-backup state', async () => {
      await this.database.automaticBackupState.clear();
    });
  }
}
