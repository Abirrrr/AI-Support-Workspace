import type { Settings } from '../../domain/settings';

export interface SettingsRepository {
  load(): Promise<Settings | undefined>;
  save(settings: Settings): Promise<Settings>;
}
