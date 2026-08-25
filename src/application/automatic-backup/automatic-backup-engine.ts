import type { CanonicalBackupV7 } from '../backup/backup-service';
import { parseBackupFile } from '../backup/backup-validator';
import type { AutomaticBackupStateRepository } from '../persistence/automatic-backup-state-repository';
import {
  AUTOMATIC_BACKUP_LEASE_MS,
  AUTOMATIC_BACKUP_RETENTION_LIMIT,
  MAX_MANAGED_BACKUP_ENTRIES,
  type AutomaticBackupFailureCode,
  type AutomaticBackupSchedule,
  type AutomaticBackupState,
  type ManagedBackupManifestEntry,
} from '../../domain/automatic-backup';
import {
  AutomaticBackupFileCollisionError,
  type AutomaticBackupDirectoryPort,
} from './ports';

const MANAGED_FILENAME_PATTERN =
  /^ai-support-workspace-managed-([0-9a-f-]{36})-(\d{8}T\d{9}Z)-([0-9a-f-]{36})\.json$/;

export type AutomaticBackupExecutionStatus =
  | 'success'
  | 'success-with-retention-warning'
  | 'location-unavailable'
  | 'overlapping-run'
  | 'lease-active'
  | 'backup-creation-failed'
  | 'file-collision'
  | 'write-or-verification-failed'
  | 'active-context-changed';

export interface AutomaticBackupExecutionResult {
  readonly status: AutomaticBackupExecutionStatus;
  readonly backupId?: string;
}

export function createManagedBackupFilename(
  backupSetId: string,
  createdAt: string,
  backupId: string,
): string {
  const compactTimestamp = createdAt.replace(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/,
    '$1$2$3T$4$5$6$7Z',
  );
  return `ai-support-workspace-managed-${backupSetId}-${compactTimestamp}-${backupId}.json`;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    Uint8Array.from(bytes).buffer,
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function compareManifestEntries(
  left: ManagedBackupManifestEntry,
  right: ManagedBackupManifestEntry,
): number {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? -1 : 1;
  }
  return left.backupId.localeCompare(right.backupId);
}

function matchesContext(
  state: Awaited<ReturnType<AutomaticBackupStateRepository['load']>>,
  schedule: AutomaticBackupSchedule,
  leaseId: string,
): state is AutomaticBackupState {
  return (
    state !== undefined &&
    state.schedule?.scheduleId === schedule.scheduleId &&
    state.schedule.cadence === schedule.cadence &&
    state.lease?.leaseId === leaseId &&
    state.lease.backupSetId === state.backupSetId
  );
}

function validateReadback(
  created: CanonicalBackupV7,
  readback: Uint8Array,
  digest: string,
  expectedDigest: string,
  expectedFilename: string,
): boolean {
  if (
    readback.byteLength !== created.byteLength ||
    digest !== expectedDigest ||
    !MANAGED_FILENAME_PATTERN.test(expectedFilename)
  ) {
    return false;
  }
  try {
    const parsed = parseBackupFile(new TextDecoder().decode(readback));
    return (
      parsed.formatVersion === 7 &&
      parsed.backupId === created.backup.backupId &&
      parsed.creationMode === 'automatic' &&
      parsed.backupSetId === created.backup.backupSetId
    );
  } catch {
    return false;
  }
}

export class AutomaticBackupExecutionEngine {
  private running = false;

  constructor(
    private readonly stateRepository: AutomaticBackupStateRepository,
    private readonly directoryPort: AutomaticBackupDirectoryPort,
    private readonly backupCreator: {
      create(options: {
        readonly creationMode: 'automatic';
        readonly backupSetId: string;
      }): Promise<CanonicalBackupV7>;
    },
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async execute(): Promise<AutomaticBackupExecutionResult> {
    if (this.running) return { status: 'overlapping-run' };
    this.running = true;
    let ownedLeaseId: string | undefined;
    try {
      const initial = await this.stateRepository.load();
      const schedule = initial?.schedule;
      if (initial === undefined || schedule === undefined) {
        return { status: 'location-unavailable' };
      }
      if (
        (await this.directoryPort.queryPermission(initial.directoryHandle)) !==
        'granted'
      ) {
        return { status: 'location-unavailable' };
      }

      const acquiredAt = this.now();
      const leaseId = this.createId();
      const acquired = await this.stateRepository.updateAtomically(
        (current) => {
          if (
            current === undefined ||
            current.backupSetId !== initial.backupSetId ||
            current.schedule?.scheduleId !== schedule.scheduleId
          ) {
            return current;
          }
          const existingExpiry = current.lease
            ? Date.parse(current.lease.expiresAt)
            : Number.NEGATIVE_INFINITY;
          if (existingExpiry > acquiredAt.getTime()) return current;
          return {
            ...current,
            lease: {
              leaseId,
              backupSetId: current.backupSetId,
              scheduleId: schedule.scheduleId,
              acquiredAt: acquiredAt.toISOString(),
              expiresAt: new Date(
                acquiredAt.getTime() + AUTOMATIC_BACKUP_LEASE_MS,
              ).toISOString(),
            },
            lastAttemptAt: acquiredAt.toISOString(),
          };
        },
      );
      if (acquired?.lease?.leaseId !== leaseId) {
        return { status: 'lease-active' };
      }
      ownedLeaseId = leaseId;

      let created: CanonicalBackupV7;
      try {
        created = await this.backupCreator.create({
          creationMode: 'automatic',
          backupSetId: initial.backupSetId,
        });
      } catch {
        await this.recordFailure(schedule, leaseId, 'backup-creation-failed');
        return { status: 'backup-creation-failed' };
      }

      const filename = createManagedBackupFilename(
        initial.backupSetId,
        created.backup.exportedAt,
        created.backup.backupId,
      );
      const expectedBytes = new TextEncoder().encode(created.serialized);
      const expectedDigest = await sha256Hex(expectedBytes);
      let readback: Uint8Array;
      try {
        await this.directoryPort.writeNewFile(
          initial.directoryHandle,
          filename,
          created.serialized,
        );
        readback = await this.directoryPort.readFile(
          initial.directoryHandle,
          filename,
        );
      } catch (error) {
        const code =
          error instanceof AutomaticBackupFileCollisionError
            ? 'file-collision'
            : 'write-or-verification-failed';
        await this.recordFailure(schedule, leaseId, code);
        return { status: code };
      }
      const readbackDigest = await sha256Hex(readback);
      if (
        !validateReadback(
          created,
          readback,
          readbackDigest,
          expectedDigest,
          filename,
        )
      ) {
        await this.recordFailure(
          schedule,
          leaseId,
          'write-or-verification-failed',
        );
        return { status: 'write-or-verification-failed' };
      }

      const entry: ManagedBackupManifestEntry = {
        backupId: created.backup.backupId,
        backupSetId: initial.backupSetId,
        filename,
        createdAt: created.backup.exportedAt,
        formatVersion: 7,
        creationMode: 'automatic',
        byteLength: created.byteLength,
        sha256: expectedDigest,
      };
      const committed = await this.stateRepository.updateAtomically(
        (current) => {
          if (!matchesContext(current, schedule, leaseId)) return current;
          const managedBackups = [...current.managedBackups, entry]
            .sort(compareManifestEntries)
            .slice(-MAX_MANAGED_BACKUP_ENTRIES);
          return {
            ...current,
            managedBackups,
            lastSuccessAt: created.backup.exportedAt,
            lastFailure: undefined,
          };
        },
      );
      if (!matchesContext(committed, schedule, leaseId)) {
        return { status: 'active-context-changed' };
      }

      const retentionSucceeded = await this.pruneRetention(
        initial.directoryHandle,
        schedule,
        leaseId,
      );
      if (!retentionSucceeded) {
        await this.recordFailure(schedule, leaseId, 'retention-warning');
        return {
          status: 'success-with-retention-warning',
          backupId: created.backup.backupId,
        };
      }
      return { status: 'success', backupId: created.backup.backupId };
    } finally {
      if (ownedLeaseId !== undefined) {
        await this.stateRepository.updateAtomically((current) => {
          if (current === undefined) return undefined;
          return current.lease?.leaseId === ownedLeaseId
            ? { ...current, lease: undefined }
            : current;
        });
      }
      this.running = false;
    }
  }

  private async recordFailure(
    schedule: AutomaticBackupSchedule,
    leaseId: string,
    code: AutomaticBackupFailureCode,
  ): Promise<void> {
    const occurredAt = this.now().toISOString();
    await this.stateRepository.updateAtomically((current) =>
      matchesContext(current, schedule, leaseId)
        ? { ...current, lastFailure: { code, occurredAt } }
        : current,
    );
  }

  private async pruneRetention(
    capturedDirectory: import('../../domain/automatic-backup').AutomaticBackupDirectoryHandle,
    schedule: AutomaticBackupSchedule,
    leaseId: string,
  ): Promise<boolean> {
    const limit = AUTOMATIC_BACKUP_RETENTION_LIMIT[schedule.cadence];
    while (true) {
      const state = await this.stateRepository.load();
      if (!matchesContext(state, schedule, leaseId)) return false;
      const sorted = [...state.managedBackups].sort(compareManifestEntries);
      const candidate = sorted.length > limit ? sorted[0] : undefined;
      if (candidate === undefined) return true;
      if (
        (await this.directoryPort.compareIdentity(
          capturedDirectory,
          state.directoryHandle,
        )) !== 'same'
      ) {
        return false;
      }
      let bytes: Uint8Array;
      try {
        bytes = await this.directoryPort.readFile(
          capturedDirectory,
          candidate.filename,
        );
        const digest = await sha256Hex(bytes);
        const parsed = parseBackupFile(new TextDecoder().decode(bytes));
        if (
          bytes.byteLength !== candidate.byteLength ||
          digest !== candidate.sha256 ||
          parsed.formatVersion !== 7 ||
          parsed.backupId !== candidate.backupId ||
          parsed.creationMode !== 'automatic' ||
          parsed.backupSetId !== candidate.backupSetId ||
          createManagedBackupFilename(
            candidate.backupSetId,
            candidate.createdAt,
            candidate.backupId,
          ) !== candidate.filename
        ) {
          return false;
        }
        const latest = await this.stateRepository.load();
        if (!matchesContext(latest, schedule, leaseId)) return false;
        await this.directoryPort.deleteFile(
          capturedDirectory,
          candidate.filename,
        );
      } catch {
        return false;
      }
      const updated = await this.stateRepository.updateAtomically((current) =>
        matchesContext(current, schedule, leaseId)
          ? {
              ...current,
              managedBackups: current.managedBackups.filter(
                (entry) => entry.backupId !== candidate.backupId,
              ),
            }
          : current,
      );
      if (!matchesContext(updated, schedule, leaseId)) return false;
    }
  }
}
