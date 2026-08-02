import { describe, expect, it, vi } from 'vitest';

import type { SettingsRepository } from '../../src/application/persistence/settings-repository';
import {
  SettingsLoadError,
  SettingsSaveError,
  SettingsService,
  normalizeDefaultModel,
} from '../../src/application/settings/settings-service';

function createRepository(
  overrides: Partial<SettingsRepository> = {},
): SettingsRepository {
  return {
    load: vi.fn(async () => undefined),
    save: vi.fn(async (settings) => settings),
    ...overrides,
  };
}

describe('SettingsService', () => {
  it('resolves a missing record to the null application default', async () => {
    const service = new SettingsService(createRepository());

    await expect(service.load()).resolves.toEqual({ defaultModel: null });
  });

  it('loads a saved non-null model unchanged', async () => {
    const service = new SettingsService(
      createRepository({
        load: vi.fn(async () => ({ defaultModel: 'qwen2.5:7b' })),
      }),
    );

    await expect(service.load()).resolves.toEqual({
      defaultModel: 'qwen2.5:7b',
    });
  });

  it('trims only outer whitespace before saving an opaque model identifier', async () => {
    const repository = createRepository();
    const service = new SettingsService(repository);

    await expect(
      service.save('  registry/model:tag@sha256:value  '),
    ).resolves.toEqual({ defaultModel: 'registry/model:tag@sha256:value' });
    expect(repository.save).toHaveBeenCalledWith({
      defaultModel: 'registry/model:tag@sha256:value',
    });
  });

  it('normalizes empty and whitespace-only input to null', async () => {
    expect(normalizeDefaultModel('')).toBeNull();
    expect(normalizeDefaultModel(' \t\n ')).toBeNull();

    const repository = createRepository();
    const service = new SettingsService(repository);
    await service.save(' \t\n ');

    expect(repository.save).toHaveBeenCalledWith({ defaultModel: null });
  });

  it('maps repository load failures to a focused safe error', async () => {
    const cause = new Error('raw Dexie load failure');
    const service = new SettingsService(
      createRepository({
        load: vi.fn(async () => {
          throw cause;
        }),
      }),
    );

    await expect(service.load()).rejects.toMatchObject({
      name: 'SettingsLoadError',
      message: 'Failed to load settings.',
      cause,
    });
    await expect(service.load()).rejects.toBeInstanceOf(SettingsLoadError);
  });

  it('maps repository save failures to a focused safe error', async () => {
    const cause = new Error('raw Dexie save failure');
    const service = new SettingsService(
      createRepository({
        save: vi.fn(async () => {
          throw cause;
        }),
      }),
    );

    await expect(service.save('model')).rejects.toMatchObject({
      name: 'SettingsSaveError',
      message: 'Failed to save settings.',
      cause,
    });
    await expect(service.save('model')).rejects.toBeInstanceOf(
      SettingsSaveError,
    );
  });
});
