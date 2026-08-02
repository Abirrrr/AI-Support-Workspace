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
      repository.save({ defaultModel: 'qwen2.5:7b' }),
    ).resolves.toEqual({ defaultModel: 'qwen2.5:7b' });
    expect(await database.settings.toArray()).toEqual([
      { id: GLOBAL_SETTINGS_ID, defaultModel: 'qwen2.5:7b' },
    ]);

    database.close({ disableAutoOpen: true });
    database = createIsolatedDatabase(databaseName);
    repository = new DexieSettingsRepository(database);

    await expect(repository.load()).resolves.toEqual({
      defaultModel: 'qwen2.5:7b',
    });
  });

  it('stores null and replaces the singleton rather than deleting it', async () => {
    await repository.save({ defaultModel: 'first-model' });
    await repository.save({ defaultModel: null });

    await expect(repository.load()).resolves.toEqual({ defaultModel: null });
    expect(await database.settings.toArray()).toEqual([
      { id: GLOBAL_SETTINGS_ID, defaultModel: null },
    ]);
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
