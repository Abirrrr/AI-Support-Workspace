import type { SettingsRepository } from '../../application/persistence/settings-repository';
import type { Settings } from '../../domain/settings';
import type { AiSupportWorkspaceDatabase } from './database';
import { runPersistenceOperation } from './repository-helpers';
import { GLOBAL_SETTINGS_ID, type SettingsRecord } from './settings-record';
import { isAutomaticBackupCadence } from '../../domain/automatic-backup';

function toSettings(record: SettingsRecord): Settings {
  const snippetPasteMode = record.snippetPasteMode ?? 'clipboard-only';
  if (
    snippetPasteMode !== 'clipboard-only' &&
    snippetPasteMode !== 'automatic'
  ) {
    throw new TypeError('Persisted Snippet paste mode is invalid.');
  }
  const automaticBackupCadence = record.automaticBackupCadence ?? 'weekly';
  if (!isAutomaticBackupCadence(automaticBackupCadence)) {
    throw new TypeError('Persisted automatic-backup cadence is invalid.');
  }
  return {
    defaultModel: record.defaultModel,
    snippetPasteMode,
    automaticBackupCadence,
  };
}

export class DexieSettingsRepository implements SettingsRepository {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  async load(): Promise<Settings | undefined> {
    return runPersistenceOperation('load settings', async () => {
      const record = await this.database.settings.get(GLOBAL_SETTINGS_ID);
      return record === undefined ? undefined : toSettings(record);
    });
  }

  async save(settings: Settings): Promise<Settings> {
    return runPersistenceOperation('save settings', async () => {
      const existing = await this.database.settings.get(GLOBAL_SETTINGS_ID);
      const record: SettingsRecord = {
        id: GLOBAL_SETTINGS_ID,
        defaultModel: settings.defaultModel,
        snippetPasteMode: settings.snippetPasteMode,
        automaticBackupCadence: settings.automaticBackupCadence,
        ...(existing !== undefined && 'lastSuccessfulBackupAt' in existing
          ? { lastSuccessfulBackupAt: existing.lastSuccessfulBackupAt }
          : {}),
      };

      await this.database.settings.put(record);
      return toSettings(record);
    });
  }
}
