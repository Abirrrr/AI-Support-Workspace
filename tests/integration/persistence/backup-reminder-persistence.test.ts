import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BackupReminderService } from '../../../src/application/backup/backup-reminder';
import { DexieBackupReminderStateRepository } from '../../../src/infrastructure/persistence/dexie-backup-reminder-state-repository';
import {
  DATABASE_VERSION,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieSettingsRepository } from '../../../src/infrastructure/persistence/dexie-settings-repository';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from './test-database';

describe('local backup reminder persistence', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;

  beforeEach(() => {
    databaseName = `backup-reminder-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  it('persists the latest successful backup across settings save and reopen without a schema bump', async () => {
    const first = new Date('2026-08-01T00:00:00.000Z');
    const reminder = new BackupReminderService(
      new DexieBackupReminderStateRepository(database),
      () => first,
    );
    await reminder.recordSuccessfulBackup();
    await new DexieSettingsRepository(database).save({
      defaultModel: 'model',
      snippetPasteMode: 'automatic',
      automaticBackupCadence: 'daily',
    });

    database.close();
    database = createIsolatedDatabase(databaseName);
    await expect(
      new BackupReminderService(
        new DexieBackupReminderStateRepository(database),
        () => new Date('2026-08-02T00:00:00.000Z'),
      ).load(),
    ).resolves.toEqual({
      lastSuccessfulBackupAt: first.toISOString(),
      status: 'current',
    });
    expect(database.verno).toBe(DATABASE_VERSION);
    expect(DATABASE_VERSION).toBe(6);
  });
});
