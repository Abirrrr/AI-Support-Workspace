import type { BackupReminderStateRepository } from '../../application/backup/backup-reminder';
import type { AiSupportWorkspaceDatabase } from './database';
import { runPersistenceOperation } from './repository-helpers';
import { GLOBAL_SETTINGS_ID } from './settings-record';

export class DexieBackupReminderStateRepository implements BackupReminderStateRepository {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  loadLastSuccessfulBackupAt(): Promise<unknown> {
    return runPersistenceOperation('load backup reminder state', async () => {
      const settings = await this.database.settings.get(GLOBAL_SETTINGS_ID);
      return settings?.lastSuccessfulBackupAt;
    });
  }

  recordSuccessfulBackupAt(timestamp: string): Promise<void> {
    return runPersistenceOperation('record successful backup', () =>
      this.database.transaction('rw', this.database.settings, async () => {
        const settings = await this.database.settings.get(GLOBAL_SETTINGS_ID);
        await this.database.settings.put({
          id: GLOBAL_SETTINGS_ID,
          defaultModel: settings?.defaultModel ?? null,
          snippetPasteMode: settings?.snippetPasteMode ?? 'clipboard-only',
          automaticBackupCadence: settings?.automaticBackupCadence ?? 'weekly',
          lastSuccessfulBackupAt: timestamp,
        });
      }),
    );
  }
}
