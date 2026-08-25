import type {
  AutomaticBackupAlarm,
  AutomaticBackupAlarmPort,
} from '../../application/automatic-backup/ports';

export interface AutomaticBackupChromeAlarmsApi {
  readonly get: (
    name: string,
    callback: (alarm?: AutomaticBackupAlarm) => void,
  ) => void;
  readonly create: (name: string, alarmInfo: { readonly when: number }) => void;
  readonly clear: (
    name: string,
    callback: (wasCleared: boolean) => void,
  ) => void;
  readonly onAlarm: {
    addListener(listener: (alarm: AutomaticBackupAlarm) => void): void;
  };
}

export class ChromeAutomaticBackupAlarmPort implements AutomaticBackupAlarmPort {
  constructor(private readonly alarms: AutomaticBackupChromeAlarmsApi) {}

  get(name: string): Promise<AutomaticBackupAlarm | undefined> {
    return new Promise((resolve) => this.alarms.get(name, resolve));
  }

  async create(name: string, when: number): Promise<void> {
    this.alarms.create(name, { when });
  }

  clear(name: string): Promise<void> {
    return new Promise((resolve) => this.alarms.clear(name, () => resolve()));
  }
}
