import { describe, expect, it, vi } from 'vitest';

import type { AutomaticBackupStateRepository } from '../../src/application/persistence/automatic-backup-state-repository';
import type { SettingsRepository } from '../../src/application/persistence/settings-repository';
import {
  AutomaticBackupExecutionEngine,
  createManagedBackupFilename,
  type AutomaticBackupExecutionResult,
} from '../../src/application/automatic-backup/automatic-backup-engine';
import {
  AUTOMATIC_BACKUP_ALARM_NAME,
  AutomaticBackupRuntimeCore,
  nextAnchorAlignedDue,
} from '../../src/application/automatic-backup/automatic-backup-runtime';
import {
  AutomaticBackupFileCollisionError,
  type AutomaticBackupAlarm,
  type AutomaticBackupAlarmPort,
  type AutomaticBackupDirectoryPort,
  type AutomaticBackupPermissionState,
  type DirectoryIdentityResult,
} from '../../src/application/automatic-backup/ports';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION_7,
  type BackupFileV7,
} from '../../src/domain/backup-file';
import type {
  AutomaticBackupCadence,
  AutomaticBackupDirectoryHandle,
  AutomaticBackupState,
} from '../../src/domain/automatic-backup';

const SET_ID = '10000000-0000-4000-8000-000000000001';
const OTHER_SET_ID = '10000000-0000-4000-8000-000000000002';
const SCHEDULE_ID = '20000000-0000-4000-8000-000000000001';
const DIRECTORY = { kind: 'directory' as const, name: 'Selected' };
const START = new Date('2026-08-01T12:00:00.000Z');

function required<T>(value: T | undefined, description: string): T {
  if (value === undefined) throw new Error(`Missing ${description}.`);
  return value;
}

let uuidSequence = 10;
function nextUuid(): string {
  const suffix = String(uuidSequence).padStart(12, '0');
  uuidSequence += 1;
  return `30000000-0000-4000-8000-${suffix}`;
}

class MemoryStateRepository implements AutomaticBackupStateRepository {
  constructor(public state: AutomaticBackupState | undefined) {}
  async load() {
    return this.state;
  }
  async save(state: AutomaticBackupState) {
    this.state = state;
    return state;
  }
  async updateAtomically(
    update: (
      current: AutomaticBackupState | undefined,
    ) => AutomaticBackupState | undefined,
  ) {
    this.state = update(this.state);
    return this.state;
  }
  async clear() {
    this.state = undefined;
  }
}

class MemoryDirectoryPort implements AutomaticBackupDirectoryPort {
  permission: AutomaticBackupPermissionState = 'granted';
  identity: DirectoryIdentityResult = 'same';
  readonly files = new Map<string, Uint8Array>();
  readonly deleted: string[] = [];
  readonly writeAttempts: string[] = [];
  transformRead?: (bytes: Uint8Array, filename: string) => Uint8Array;

  async queryPermission() {
    return this.permission;
  }
  async compareIdentity() {
    return this.identity;
  }
  async writeNewFile(
    _handle: AutomaticBackupDirectoryHandle,
    filename: string,
    contents: string,
  ) {
    this.writeAttempts.push(filename);
    if (this.files.has(filename)) throw new AutomaticBackupFileCollisionError();
    this.files.set(filename, new TextEncoder().encode(contents));
  }
  async readFile(_handle: AutomaticBackupDirectoryHandle, filename: string) {
    const bytes = this.files.get(filename);
    if (bytes === undefined) throw new DOMException('missing', 'NotFoundError');
    return this.transformRead?.(Uint8Array.from(bytes), filename) ?? bytes;
  }
  async deleteFile(_handle: AutomaticBackupDirectoryHandle, filename: string) {
    if (!this.files.delete(filename)) {
      throw new DOMException('missing', 'NotFoundError');
    }
    this.deleted.push(filename);
  }
}

class MemoryAlarmPort implements AutomaticBackupAlarmPort {
  alarm: AutomaticBackupAlarm | undefined;
  readonly created: AutomaticBackupAlarm[] = [];
  clearCount = 0;
  async get() {
    return this.alarm;
  }
  async create(name: string, when: number) {
    this.alarm = { name, scheduledTime: when };
    this.created.push(this.alarm);
  }
  async clear() {
    this.alarm = undefined;
    this.clearCount += 1;
  }
}

function settingsRepository(
  cadence: AutomaticBackupCadence,
): SettingsRepository {
  const settings = {
    defaultModel: null,
    snippetPasteMode: 'clipboard-only' as const,
    automaticBackupCadence: cadence,
  };
  return {
    load: async () => settings,
    save: async () => settings,
  };
}

function state(
  cadence: 'daily' | 'weekly' = 'daily',
  nextDueAt = START.toISOString(),
): AutomaticBackupState {
  return {
    directoryHandle: DIRECTORY,
    backupSetId: SET_ID,
    schedule: {
      scheduleId: SCHEDULE_ID,
      cadence,
      anchorAt: '2026-07-31T12:00:00.000Z',
      nextDueAt,
    },
    managedBackups: [],
  };
}

function canonicalAutomaticBackup(
  backupSetId: string,
  backupId: string,
  exportedAt: string,
) {
  const backup: BackupFileV7 = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_7,
    exportedAt,
    backupId,
    creationMode: 'automatic',
    backupSetId,
    data: {
      knowledge: [],
      snippets: [],
      snippetAssets: [],
      snippetUsageStats: [],
      snippetGeneratedMetadata: [],
      settings: {
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence: 'daily',
      },
    },
  };
  const serialized = JSON.stringify(backup);
  return {
    backup,
    serialized,
    byteLength: new TextEncoder().encode(serialized).byteLength,
  };
}

function runtimeFixture(
  cadence: AutomaticBackupCadence,
  initial: AutomaticBackupState | undefined,
  now = START,
) {
  let currentTime = now;
  const repository = new MemoryStateRepository(initial);
  const directory = new MemoryDirectoryPort();
  const alarms = new MemoryAlarmPort();
  const execute = vi.fn<() => Promise<AutomaticBackupExecutionResult>>(
    async () => ({ status: 'success' }),
  );
  const runtime = new AutomaticBackupRuntimeCore(
    settingsRepository(cadence),
    repository,
    directory,
    alarms,
    { execute },
    () => currentTime,
    nextUuid,
  );
  return {
    runtime,
    repository,
    directory,
    alarms,
    execute,
    setNow(next: Date) {
      currentTime = next;
    },
  };
}

describe('automatic backup scheduling', () => {
  it('keeps Off inactive without writing and clears the one named alarm', async () => {
    const fixture = runtimeFixture('off', state());
    fixture.alarms.alarm = {
      name: AUTOMATIC_BACKUP_ALARM_NAME,
      scheduledTime: START.getTime(),
    };
    await fixture.runtime.reconcileStartup();
    expect(fixture.execute).not.toHaveBeenCalled();
    expect(fixture.repository.state?.schedule).toBeUndefined();
    expect(fixture.repository.state?.directoryHandle).toBe(DIRECTORY);
    expect(fixture.alarms.alarm).toBeUndefined();
  });

  it.each([
    ['daily', 24],
    ['weekly', 168],
  ] as const)(
    'activates %s one full interval later without an immediate run',
    async (cadence, hours) => {
      const fixture = runtimeFixture(cadence, {
        directoryHandle: DIRECTORY,
        backupSetId: SET_ID,
        managedBackups: [],
      });
      await fixture.runtime.reconcileStartup();
      expect(fixture.execute).not.toHaveBeenCalled();
      expect(fixture.repository.state?.schedule?.anchorAt).toBe(
        START.toISOString(),
      );
      expect(fixture.alarms.alarm?.scheduledTime).toBe(
        START.getTime() + hours * 60 * 60 * 1000,
      );
      expect(fixture.alarms.alarm?.periodInMinutes).toBeUndefined();
    },
  );

  it('resets the anchor on a cadence change', async () => {
    const fixture = runtimeFixture('weekly', state('daily'));
    await fixture.runtime.reconcileCadenceChange(START);
    expect(fixture.repository.state?.schedule?.cadence).toBe('weekly');
    expect(fixture.repository.state?.schedule?.anchorAt).toBe(
      START.toISOString(),
    );
    expect(fixture.alarms.alarm?.scheduledTime).toBe(
      START.getTime() + 168 * 60 * 60 * 1000,
    );
    expect(fixture.execute).not.toHaveBeenCalled();
  });

  it('recreates a missing future one-shot alarm from persisted schedule state', async () => {
    const due = new Date(START.getTime() + 60_000).toISOString();
    const fixture = runtimeFixture('daily', state('daily', due));
    await fixture.runtime.reconcileStartup();
    expect(fixture.alarms.alarm).toEqual({
      name: AUTOMATIC_BACKUP_ALARM_NAME,
      scheduledTime: Date.parse(due),
    });
    expect(fixture.execute).not.toHaveBeenCalled();
  });

  it('coalesces many missed intervals to one catch-up and stays anchor aligned', async () => {
    const now = new Date('2026-08-22T12:00:00.000Z');
    const fixture = runtimeFixture(
      'weekly',
      state('weekly', '2026-08-01T12:00:00.000Z'),
      now,
    );
    await fixture.runtime.reconcileStartup();
    expect(fixture.execute).toHaveBeenCalledTimes(1);
    expect(fixture.repository.state?.schedule?.nextDueAt).toBe(
      '2026-08-28T12:00:00.000Z',
    );
    expect(fixture.alarms.created).toHaveLength(1);
  });

  it('calculates the next future anchor boundary without drift', () => {
    expect(
      nextAnchorAlignedDue(
        '2026-08-01T12:00:00.000Z',
        'weekly',
        new Date('2026-08-22T18:00:00.000Z'),
      ),
    ).toBe('2026-08-29T12:00:00.000Z');
  });

  it('does not retry a collision immediately and allows the next normal cadence', async () => {
    const fixture = runtimeFixture('daily', state('daily'));
    fixture.execute.mockResolvedValueOnce({ status: 'file-collision' });
    await fixture.runtime.reconcileStartup();
    expect(fixture.execute).toHaveBeenCalledTimes(1);
    expect(fixture.repository.state?.schedule?.nextDueAt).toBe(
      '2026-08-02T12:00:00.000Z',
    );
    expect(fixture.alarms.alarm?.scheduledTime).toBe(
      Date.parse('2026-08-02T12:00:00.000Z'),
    );

    await fixture.runtime.reconcileStartup();
    expect(fixture.execute).toHaveBeenCalledTimes(1);

    fixture.setNow(new Date('2026-08-02T12:00:00.000Z'));
    await fixture.runtime.reconcileStartup();
    expect(fixture.execute).toHaveBeenCalledTimes(2);
  });

  it.each(['prompt', 'denied', 'unavailable'] as const)(
    'deactivates scheduling for %s permission without executing or prompting',
    async (permission) => {
      const fixture = runtimeFixture('daily', state());
      fixture.directory.permission = permission;
      await fixture.runtime.reconcileStartup();
      expect(fixture.execute).not.toHaveBeenCalled();
      expect(fixture.repository.state?.schedule).toBeUndefined();
      expect(fixture.alarms.alarm).toBeUndefined();
    },
  );

  it('preserves same-folder set, manifest, and future schedule', async () => {
    const existing = state('daily', '2026-08-02T12:00:00.000Z');
    const fixture = runtimeFixture('daily', existing);
    const selected = { kind: 'directory' as const, name: 'Selected again' };
    await expect(fixture.runtime.adoptDirectory(selected)).resolves.toBe(
      'same',
    );
    expect(fixture.repository.state?.backupSetId).toBe(SET_ID);
    expect(fixture.repository.state?.schedule?.scheduleId).toBe(SCHEDULE_ID);
    expect(fixture.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['different', 'different'],
    ['uncertain', 'uncertain-new-set'],
  ] as const)(
    'rotates ownership safely for %s identity',
    async (identity, result) => {
      const fixture = runtimeFixture('daily', state());
      fixture.directory.identity = identity;
      await expect(
        fixture.runtime.adoptDirectory({ kind: 'directory', name: 'Other' }),
      ).resolves.toBe(result);
      expect(fixture.repository.state?.backupSetId).not.toBe(SET_ID);
      expect(fixture.repository.state?.managedBackups).toEqual([]);
      expect(fixture.repository.state?.schedule?.anchorAt).toBe(
        START.toISOString(),
      );
      expect(fixture.execute).not.toHaveBeenCalled();
    },
  );
});

describe('automatic backup execution and retention', () => {
  function engineFixture(cadence: 'daily' | 'weekly' = 'daily') {
    let currentTime = START;
    let backupSequence = 100;
    const repository = new MemoryStateRepository(state(cadence));
    const directory = new MemoryDirectoryPort();
    const creator = {
      create: vi.fn(async ({ backupSetId }: { backupSetId?: string }) => {
        const backupId = `40000000-0000-4000-8000-${String(backupSequence).padStart(12, '0')}`;
        backupSequence += 1;
        return canonicalAutomaticBackup(
          backupSetId ?? SET_ID,
          backupId,
          currentTime.toISOString(),
        );
      }),
    };
    const engine = new AutomaticBackupExecutionEngine(
      repository,
      directory,
      creator,
      () => currentTime,
      nextUuid,
    );
    return {
      repository,
      directory,
      creator,
      engine,
      advanceDays(days: number) {
        currentTime = new Date(currentTime.getTime() + days * 86_400_000);
      },
    };
  }

  it('writes, reopens, verifies, and records a canonical automatic Backup v7', async () => {
    const fixture = engineFixture();
    const result = await fixture.engine.execute();
    expect(result.status).toBe('success');
    expect(fixture.repository.state?.managedBackups).toHaveLength(1);
    const entry = required(
      fixture.repository.state?.managedBackups[0],
      'managed entry',
    );
    expect(entry.filename).toBe(
      createManagedBackupFilename(SET_ID, START.toISOString(), entry.backupId),
    );
    const bytes = required(
      fixture.directory.files.get(entry.filename),
      'managed file',
    );
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as BackupFileV7;
    expect(parsed.formatVersion).toBe(7);
    expect(parsed.creationMode).toBe('automatic');
    expect(parsed.backupSetId).toBe(SET_ID);
    expect(entry.byteLength).toBe(bytes.byteLength);
    expect(entry.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(fixture.creator.create).toHaveBeenCalledTimes(1);
    expect(fixture.directory.writeAttempts).toEqual([entry.filename]);
    expect(fixture.repository.state?.lease).toBeUndefined();
  });

  it('fails a filename collision without overwriting or pruning', async () => {
    const fixture = engineFixture();
    const original = new TextEncoder().encode('unrelated');
    const filename = createManagedBackupFilename(
      SET_ID,
      START.toISOString(),
      '40000000-0000-4000-8000-000000000100',
    );
    fixture.directory.files.set(filename, original);
    await expect(fixture.engine.execute()).resolves.toMatchObject({
      status: 'file-collision',
    });
    expect(fixture.directory.files.get(filename)).toEqual(original);
    expect(fixture.creator.create).toHaveBeenCalledTimes(1);
    expect(fixture.directory.writeAttempts).toEqual([filename]);
    expect(fixture.repository.state?.managedBackups).toEqual([]);
    expect(fixture.directory.deleted).toEqual([]);

    fixture.directory.files.delete(filename);
    await expect(fixture.engine.execute()).resolves.toMatchObject({
      status: 'success',
    });
    expect(fixture.creator.create).toHaveBeenCalledTimes(2);
    expect(fixture.repository.state?.managedBackups).toHaveLength(1);
  });

  it('rejects truncated or digest-mismatched readback before manifest success', async () => {
    const fixture = engineFixture();
    fixture.directory.transformRead = (bytes) => bytes.slice(0, -1);
    await expect(fixture.engine.execute()).resolves.toMatchObject({
      status: 'write-or-verification-failed',
    });
    expect(fixture.repository.state?.managedBackups).toEqual([]);
    expect(fixture.directory.deleted).toEqual([]);
  });

  it('declines an unexpired persisted lease and replaces an expired lease', async () => {
    const fixture = engineFixture();
    const initialState = required(fixture.repository.state, 'initial state');
    fixture.repository.state = {
      ...initialState,
      lease: {
        leaseId: OTHER_SET_ID,
        backupSetId: SET_ID,
        scheduleId: SCHEDULE_ID,
        acquiredAt: START.toISOString(),
        expiresAt: new Date(START.getTime() + 60_000).toISOString(),
      },
    };
    await expect(fixture.engine.execute()).resolves.toMatchObject({
      status: 'lease-active',
    });
    const leasedState = required(fixture.repository.state, 'leased state');
    const activeLease = required(leasedState.lease, 'active lease');
    fixture.repository.state = {
      ...leasedState,
      lease: {
        ...activeLease,
        acquiredAt: new Date(START.getTime() - 120_000).toISOString(),
        expiresAt: new Date(START.getTime() - 60_000).toISOString(),
      },
    };
    await expect(fixture.engine.execute()).resolves.toMatchObject({
      status: 'success',
    });
  });

  it('declines an in-memory overlap without queueing or replaying it', async () => {
    const fixture = engineFixture();
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    fixture.creator.create.mockImplementationOnce(async ({ backupSetId }) => {
      await blocked;
      return canonicalAutomaticBackup(
        backupSetId ?? SET_ID,
        '40000000-0000-4000-8000-000000000999',
        START.toISOString(),
      );
    });
    const first = fixture.engine.execute();
    await Promise.resolve();
    await expect(fixture.engine.execute()).resolves.toEqual({
      status: 'overlapping-run',
    });
    release();
    await expect(first).resolves.toMatchObject({ status: 'success' });
    expect(fixture.creator.create).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['daily', 7, 8],
    ['weekly', 4, 5],
  ] as const)(
    'keeps the latest retention limit for %s and prunes only the oldest owned file',
    async (cadence, limit, runs) => {
      const fixture = engineFixture(cadence);
      for (let index = 0; index < runs; index += 1) {
        await expect(fixture.engine.execute()).resolves.toMatchObject({
          status: 'success',
        });
        fixture.advanceDays(1);
      }
      expect(fixture.repository.state?.managedBackups).toHaveLength(limit);
      expect(fixture.directory.deleted).toHaveLength(1);
      expect(fixture.directory.files.size).toBe(limit);
    },
  );

  it('leaves safe overflow when deletion proof is tampered and keeps unmanifested lookalikes', async () => {
    const fixture = engineFixture('weekly');
    for (let index = 0; index < 4; index += 1) {
      await fixture.engine.execute();
      fixture.advanceDays(1);
    }
    const oldest = required(
      required(fixture.repository.state, 'retention state').managedBackups[0],
      'oldest managed backup',
    );
    fixture.directory.files.set(
      oldest.filename,
      new TextEncoder().encode('tampered'),
    );
    const lookalike = 'ai-support-workspace-managed-lookalike.json';
    fixture.directory.files.set(lookalike, new TextEncoder().encode('user'));
    await expect(fixture.engine.execute()).resolves.toMatchObject({
      status: 'success-with-retention-warning',
    });
    expect(fixture.repository.state?.managedBackups).toHaveLength(5);
    expect(fixture.directory.files.has(lookalike)).toBe(true);
    expect(fixture.directory.deleted).toEqual([]);
  });

  it('cannot commit or prune against a newly adopted location during a run', async () => {
    const fixture = engineFixture('weekly');
    let release!: () => void;
    let signalStarted!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = new Promise<void>((resolve) => {
      signalStarted = resolve;
    });
    fixture.creator.create.mockImplementationOnce(async ({ backupSetId }) => {
      signalStarted();
      await blocked;
      return canonicalAutomaticBackup(
        backupSetId ?? SET_ID,
        '40000000-0000-4000-8000-000000000998',
        START.toISOString(),
      );
    });
    const execution = fixture.engine.execute();
    await started;
    fixture.repository.state = {
      directoryHandle: { kind: 'directory', name: 'New location' },
      backupSetId: OTHER_SET_ID,
      managedBackups: [],
      schedule: {
        scheduleId: nextUuid(),
        cadence: 'weekly',
        anchorAt: START.toISOString(),
        nextDueAt: new Date(START.getTime() + 604_800_000).toISOString(),
      },
    };
    release();
    await expect(execution).resolves.toMatchObject({
      status: 'active-context-changed',
    });
    expect(fixture.repository.state.backupSetId).toBe(OTHER_SET_ID);
    expect(fixture.repository.state.managedBackups).toEqual([]);
    expect(fixture.directory.deleted).toEqual([]);
  });
});
