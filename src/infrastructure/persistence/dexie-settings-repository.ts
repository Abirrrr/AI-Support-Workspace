import type { SettingsRepository } from '../../application/persistence/settings-repository';
import type { Settings } from '../../domain/settings';
import type { AiSupportWorkspaceDatabase } from './database';
import { runPersistenceOperation } from './repository-helpers';
import { GLOBAL_SETTINGS_ID, type SettingsRecord } from './settings-record';

function toSettings(record: SettingsRecord): Settings {
  return { defaultModel: record.defaultModel };
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
      const record: SettingsRecord = {
        id: GLOBAL_SETTINGS_ID,
        defaultModel: settings.defaultModel,
      };

      await this.database.settings.put(record);
      return toSettings(record);
    });
  }
}
