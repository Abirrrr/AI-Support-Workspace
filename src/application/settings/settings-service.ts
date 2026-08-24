import type { SettingsRepository } from '../persistence/settings-repository';
import type { Settings, SnippetPasteMode } from '../../domain/settings';
import {
  runCatalogCoordinatedMutation,
  type CatalogMutationPort,
} from '../snippet/catalog-mutation';

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
  return { defaultModel: null, snippetPasteMode: 'clipboard-only' };
}

export function normalizeDefaultModel(value: string): string | null {
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

export interface SettingsApplication {
  load(): Promise<Settings>;
  save(
    defaultModelInput: string,
    snippetPasteMode: SnippetPasteMode,
  ): Promise<Settings>;
}

export class SettingsService implements SettingsApplication {
  constructor(
    private readonly repository: SettingsRepository,
    private readonly catalogMutationPort?: CatalogMutationPort,
  ) {}

  async load(): Promise<Settings> {
    try {
      return (await this.repository.load()) ?? createDefaultSettings();
    } catch (error) {
      throw new SettingsLoadError(error);
    }
  }

  async save(
    defaultModelInput: string,
    snippetPasteMode: SnippetPasteMode,
  ): Promise<Settings> {
    const settings: Settings = {
      defaultModel: normalizeDefaultModel(defaultModelInput),
      snippetPasteMode,
    };

    try {
      return await runCatalogCoordinatedMutation(this.catalogMutationPort, () =>
        this.repository.save(settings),
      );
    } catch (error) {
      throw new SettingsSaveError(error);
    }
  }
}
