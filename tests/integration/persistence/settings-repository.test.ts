import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PersistenceError } from '../../../src/application/persistence/errors';
import {
  DATABASE_NAME,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieSettingsRepository } from '../../../src/infrastructure/persistence/dexie-settings-repository';
import { GLOBAL_SETTINGS_ID } from '../../../src/infrastructure/persistence/settings-record';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from './test-database';

describe('DexieSettingsRepository', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;
  let repository: DexieSettingsRepository;

  beforeEach(() => {
    databaseName = `${DATABASE_NAME}-settings-test-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
    repository = new DexieSettingsRepository(database);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  it('treats the absent singleton as normal without creating a record', async () => {
    await expect(repository.load()).resolves.toBeUndefined();
    await expect(database.settings.count()).resolves.toBe(0);
  });

  it('saves and reloads the global singleton across database reopen', async () => {
    await expect(
      repository.save({
        defaultModel: 'qwen2.5:7b',
        snippetPasteMode: 'automatic',
        automaticBackupCadence: 'daily',
      }),
    ).resolves.toEqual({
      defaultModel: 'qwen2.5:7b',
      snippetPasteMode: 'automatic',
      automaticBackupCadence: 'daily',
    });
    expect(await database.settings.toArray()).toEqual([
      {
        id: GLOBAL_SETTINGS_ID,
        defaultModel: 'qwen2.5:7b',
        snippetPasteMode: 'automatic',
        automaticBackupCadence: 'daily',
      },
    ]);

    database.close({ disableAutoOpen: true });
    database = createIsolatedDatabase(databaseName);
    repository = new DexieSettingsRepository(database);

    await expect(repository.load()).resolves.toEqual({
      defaultModel: 'qwen2.5:7b',
      snippetPasteMode: 'automatic',
      automaticBackupCadence: 'daily',
    });
  });

  it('stores null and replaces the singleton rather than deleting it', async () => {
    await repository.save({
      defaultModel: 'first-model',
      snippetPasteMode: 'automatic',
      automaticBackupCadence: 'daily',
    });
    await repository.save({
      defaultModel: null,
      snippetPasteMode: 'clipboard-only',
      automaticBackupCadence: 'weekly',
    });

    await expect(repository.load()).resolves.toEqual({
      defaultModel: null,
      snippetPasteMode: 'clipboard-only',
      automaticBackupCadence: 'weekly',
    });
    expect(await database.settings.toArray()).toEqual([
      {
        id: GLOBAL_SETTINGS_ID,
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence: 'weekly',
      },
    ]);
  });

  it.each(['off', 'daily', 'weekly'] as const)(
    'persists the %s automatic-backup cadence as an explicit preference',
    async (automaticBackupCadence) => {
      await repository.save({
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence,
      });

      await expect(repository.load()).resolves.toMatchObject({
        automaticBackupCadence,
      });
    },
  );

  it('defaults an upgraded record without a paste mode to clipboard-only', async () => {
    await database.settings.put({
      id: GLOBAL_SETTINGS_ID,
      defaultModel: null,
    });

    await expect(repository.load()).resolves.toEqual({
      defaultModel: null,
      snippetPasteMode: 'clipboard-only',
      automaticBackupCadence: 'weekly',
    });
  });

  it('rejects an invalid persisted paste mode through the repository boundary', async () => {
    await database.settings.put({
      id: GLOBAL_SETTINGS_ID,
      defaultModel: null,
      snippetPasteMode: 'unexpected',
    });

    await expect(repository.load()).rejects.toBeInstanceOf(PersistenceError);
  });

  it('wraps underlying persistence failures without exposing Dexie types', async () => {
    database.close({ disableAutoOpen: true });

    const operation = repository.load();

    await expect(operation).rejects.toBeInstanceOf(PersistenceError);
    await expect(operation).rejects.toMatchObject({
      name: 'PersistenceError',
      cause: expect.any(Error),
    });
  });
});
