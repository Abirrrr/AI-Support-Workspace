import type { SettingsRepository } from '../persistence/settings-repository';
import type { Settings } from '../../domain/settings';

export class SettingsLoadError extends Error {
  constructor(cause: unknown) {
    super('Failed to load settings.', { cause });
    this.name = 'SettingsLoadError';
  }
}

export class SettingsSaveError extends Error {
  constructor(cause: unknown) {
    super('Failed to save settings.', { cause });
    this.name = 'SettingsSaveError';
  }
}

export function createDefaultSettings(): Settings {
  return { defaultModel: null };
}

export function normalizeDefaultModel(value: string): string | null {
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

export interface SettingsApplication {
  load(): Promise<Settings>;
  save(defaultModelInput: string): Promise<Settings>;
}

export class SettingsService implements SettingsApplication {
  constructor(private readonly repository: SettingsRepository) {}

  async load(): Promise<Settings> {
    try {
      return (await this.repository.load()) ?? createDefaultSettings();
    } catch (error) {
      throw new SettingsLoadError(error);
    }
  }

  async save(defaultModelInput: string): Promise<Settings> {
    const settings: Settings = {
      defaultModel: normalizeDefaultModel(defaultModelInput),
    };

    try {
      return await this.repository.save(settings);
    } catch (error) {
      throw new SettingsSaveError(error);
    }
  }
}
