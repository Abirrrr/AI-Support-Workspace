import type { AutomaticBackupRuntimeCore } from '../../application/automatic-backup/automatic-backup-runtime';
import type { AutomaticBackupChromeAlarmsApi } from './chrome-alarm-port';

export function registerAutomaticBackupRuntime(
  alarms: AutomaticBackupChromeAlarmsApi,
  runtime: AutomaticBackupRuntimeCore,
): void {
  alarms.onAlarm.addListener((alarm) => {
    void runtime.handleAlarm(alarm.name).catch(() => undefined);
  });
  void runtime.reconcileStartup().catch(() => undefined);
}
