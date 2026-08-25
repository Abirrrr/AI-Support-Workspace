import type { SettingsRepository } from '../persistence/settings-repository';
import type { AutomaticBackupStateRepository } from '../persistence/automatic-backup-state-repository';
import {
  AUTOMATIC_BACKUP_INTERVAL_MS,
  isActiveAutomaticBackupCadence,
  type ActiveAutomaticBackupCadence,
  type AutomaticBackupDirectoryHandle,
  type AutomaticBackupSchedule,
  type AutomaticBackupState,
} from '../../domain/automatic-backup';
import type { AutomaticBackupExecutionEngine } from './automatic-backup-engine';
import type {
  AutomaticBackupAlarmPort,
  AutomaticBackupDirectoryPort,
  DirectoryIdentityResult,
} from './ports';

export const AUTOMATIC_BACKUP_ALARM_NAME =
  'ai-support-workspace-automatic-backup';

export type DirectoryAdoptionResult =
  'first' | 'same' | 'different' | 'uncertain-new-set' | 'stale';

function createSchedule(
  cadence: ActiveAutomaticBackupCadence,
  anchor: Date,
  scheduleId: string,
): AutomaticBackupSchedule {
  return {
    scheduleId,
    cadence,
    anchorAt: anchor.toISOString(),
    nextDueAt: new Date(
      anchor.getTime() + AUTOMATIC_BACKUP_INTERVAL_MS[cadence],
    ).toISOString(),
  };
}

export function nextAnchorAlignedDue(
  anchorAt: string,
  cadence: ActiveAutomaticBackupCadence,
  now: Date,
): string {
  const anchor = Date.parse(anchorAt);
  const interval = AUTOMATIC_BACKUP_INTERVAL_MS[cadence];
  const elapsed = Math.max(0, now.getTime() - anchor);
  const intervals = Math.floor(elapsed / interval) + 1;
  return new Date(anchor + intervals * interval).toISOString();
}

export class AutomaticBackupRuntimeCore {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly stateRepository: AutomaticBackupStateRepository,
    private readonly directoryPort: AutomaticBackupDirectoryPort,
    private readonly alarmPort: AutomaticBackupAlarmPort,
    private readonly executionEngine: Pick<
      AutomaticBackupExecutionEngine,
      'execute'
    >,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async reconcileStartup(): Promise<void> {
    const cadence =
      (await this.settingsRepository.load())?.automaticBackupCadence ??
      'weekly';
    const state = await this.stateRepository.load();
    if (cadence === 'off') {
      if (state !== undefined) {
        await this.stateRepository.updateAtomically((current) =>
          current === undefined
            ? undefined
            : { ...current, schedule: undefined, lease: undefined },
        );
      }
      await this.alarmPort.clear(AUTOMATIC_BACKUP_ALARM_NAME);
      return;
    }
    if (
      state === undefined ||
      (await this.directoryPort.queryPermission(state.directoryHandle)) !==
        'granted'
    ) {
      if (state !== undefined) {
        await this.stateRepository.updateAtomically((current) =>
          current === undefined
            ? undefined
            : {
                ...current,
                schedule: undefined,
                lease: undefined,
                lastFailure: {
                  code: 'location-unavailable',
                  occurredAt: this.now().toISOString(),
                },
              },
        );
      }
      await this.alarmPort.clear(AUTOMATIC_BACKUP_ALARM_NAME);
      return;
    }

    const currentTime = this.now();
    let schedule = state.schedule;
    if (schedule === undefined || schedule.cadence !== cadence) {
      schedule = createSchedule(cadence, currentTime, this.createId());
      const backupSetId = state.backupSetId;
      await this.stateRepository.updateAtomically((current) =>
        current?.backupSetId === backupSetId
          ? { ...current, schedule, lease: undefined }
          : current,
      );
      await this.ensureAlarm(schedule);
      return;
    }

    if (Date.parse(schedule.nextDueAt) > currentTime.getTime()) {
      await this.ensureAlarm(schedule);
      return;
    }

    const scheduleId = schedule.scheduleId;
    const result = await this.executionEngine.execute();
    if (result.status === 'location-unavailable') {
      await this.stateRepository.updateAtomically((current) =>
        current?.schedule?.scheduleId === scheduleId
          ? { ...current, schedule: undefined, lease: undefined }
          : current,
      );
      await this.alarmPort.clear(AUTOMATIC_BACKUP_ALARM_NAME);
      return;
    }

    const afterAttempt = this.now();
    const updated = await this.stateRepository.updateAtomically((current) => {
      if (current?.schedule?.scheduleId !== scheduleId) return current;
      return {
        ...current,
        schedule: {
          ...current.schedule,
          nextDueAt: nextAnchorAlignedDue(
            current.schedule.anchorAt,
            current.schedule.cadence,
            afterAttempt,
          ),
        },
      };
    });
    if (updated?.schedule?.scheduleId === scheduleId) {
      await this.ensureAlarm(updated.schedule);
    }
  }

  async reconcileCadenceChange(acceptedAt: Date = this.now()): Promise<void> {
    const cadence =
      (await this.settingsRepository.load())?.automaticBackupCadence ??
      'weekly';
    const state = await this.stateRepository.load();
    if (cadence === 'off' || state === undefined) {
      if (state !== undefined) {
        await this.stateRepository.updateAtomically((current) =>
          current === undefined
            ? undefined
            : { ...current, schedule: undefined, lease: undefined },
        );
      }
      await this.alarmPort.clear(AUTOMATIC_BACKUP_ALARM_NAME);
      return;
    }
    if (
      (await this.directoryPort.queryPermission(state.directoryHandle)) !==
      'granted'
    ) {
      await this.stateRepository.updateAtomically((current) =>
        current === undefined
          ? undefined
          : { ...current, schedule: undefined, lease: undefined },
      );
      await this.alarmPort.clear(AUTOMATIC_BACKUP_ALARM_NAME);
      return;
    }
    const schedule = createSchedule(cadence, acceptedAt, this.createId());
    const backupSetId = state.backupSetId;
    await this.stateRepository.updateAtomically((current) =>
      current?.backupSetId === backupSetId
        ? { ...current, schedule, lease: undefined }
        : current,
    );
    await this.ensureAlarm(schedule);
  }

  async adoptDirectory(
    directoryHandle: AutomaticBackupDirectoryHandle,
    acceptedAt: Date = this.now(),
  ): Promise<DirectoryAdoptionResult> {
    const cadence =
      (await this.settingsRepository.load())?.automaticBackupCadence ??
      'weekly';
    const existing = await this.stateRepository.load();
    let identity: DirectoryIdentityResult | 'first' = 'first';
    if (existing !== undefined) {
      identity = await this.directoryPort.compareIdentity(
        existing.directoryHandle,
        directoryHandle,
      );
    }
    const same = identity === 'same' && existing !== undefined;
    const backupSetId = same ? existing.backupSetId : this.createId();
    const permission =
      await this.directoryPort.queryPermission(directoryHandle);
    const active = isActiveAutomaticBackupCadence(cadence);
    const preserveSchedule =
      same &&
      existing.schedule?.cadence === cadence &&
      permission === 'granted';
    const schedule =
      active && permission === 'granted'
        ? preserveSchedule
          ? existing.schedule
          : createSchedule(cadence, acceptedAt, this.createId())
        : undefined;
    const nextState: AutomaticBackupState = same
      ? {
          ...existing,
          directoryHandle,
          schedule,
          lease: preserveSchedule ? existing.lease : undefined,
        }
      : {
          directoryHandle,
          backupSetId,
          managedBackups: [],
          schedule,
        };
    const expectedBackupSetId = existing?.backupSetId;
    const updated = await this.stateRepository.updateAtomically((current) =>
      current?.backupSetId === expectedBackupSetId ||
      (current === undefined && expectedBackupSetId === undefined)
        ? nextState
        : current,
    );
    if (updated?.backupSetId !== backupSetId) return 'stale';
    await this.reconcileStartup();
    if (identity === 'first') return 'first';
    if (identity === 'same') return 'same';
    if (identity === 'different') return 'different';
    return 'uncertain-new-set';
  }

  async handleAlarm(name: string): Promise<void> {
    if (name === AUTOMATIC_BACKUP_ALARM_NAME) {
      await this.reconcileStartup();
    }
  }

  private async ensureAlarm(schedule: AutomaticBackupSchedule): Promise<void> {
    const when = Date.parse(schedule.nextDueAt);
    const existing = await this.alarmPort.get(AUTOMATIC_BACKUP_ALARM_NAME);
    if (
      existing?.scheduledTime === when &&
      existing.periodInMinutes === undefined
    ) {
      return;
    }
    await this.alarmPort.create(AUTOMATIC_BACKUP_ALARM_NAME, when);
  }
}
