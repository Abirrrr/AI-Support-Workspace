import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { BackupRestoreData } from '../../../src/application/backup/backup-ports';
import { BackupRestoreService } from '../../../src/application/backup/backup-service';
import { SettingsService } from '../../../src/application/settings/settings-service';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  type BackupFileV2,
} from '../../../src/domain/backup-file';
import type { KnowledgeEntry } from '../../../src/domain/knowledge-entry';
import type { SnippetEntry } from '../../../src/domain/snippet-entry';
import { loadWorkspaceSettings } from '../../../src/extension/sidepanel/settings-bootstrap';
import {
  DATABASE_VERSION,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import {
  type BackupRestoreStage,
  DexieBackupSnapshotReader,
  DexieTransactionalBackupRestorePort,
} from '../../../src/infrastructure/persistence/dexie-backup-persistence';
import { DexieSettingsRepository } from '../../../src/infrastructure/persistence/dexie-settings-repository';
import { GLOBAL_SETTINGS_ID } from '../../../src/infrastructure/persistence/settings-record';
import { toSnippetEntryRecord } from '../../../src/infrastructure/persistence/snippet-entry-record';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from './test-database';

const originalKnowledge: KnowledgeEntry = {
  id: '123e4567-e89b-42d3-a456-426614174000',
  title: 'Original knowledge',
  body: 'Original body',
  tags: ['original'],
  createdAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:01.000Z',
  source: 'Original source',
};

const originalSnippet: SnippetEntry = {
  id: '223e4567-e89b-42d3-a456-426614174000',
  title: 'Original snippet',
  content: 'Original content',
  tags: ['original'],
  createdAt: '2026-08-01T08:00:02.000Z',
  updatedAt: '2026-08-01T08:00:03.000Z',
  trigger: null,
};

const restoredData: BackupRestoreData = {
  knowledge: [
    {
      id: '323e4567-e89b-42d3-a456-426614174000',
      title: 'Restored knowledge',
      body: 'Restored body\nwith line break',
      tags: ['second', 'first'],
      createdAt: '2026-08-02T08:00:00.000Z',
      updatedAt: '2026-08-02T08:00:01.000Z',
      source: 'Restored source',
    },
  ],
  snippets: [
    {
      id: '423e4567-e89b-42d3-a456-426614174000',
      title: 'Restored snippet',
      content: 'Restored content',
      tags: ['z', 'a'],
      createdAt: '2026-08-02T08:00:02.000Z',
      updatedAt: '2026-08-02T08:00:03.000Z',
      trigger: ';restored',
    },
  ],
  settings: { defaultModel: 'qwen2.5:7b' },
};

function requireValue<T>(value: T | undefined, description: string): T {
  if (value === undefined) throw new Error(`Missing ${description} fixture.`);
  return value;
}

describe('Dexie backup snapshot and atomic restore', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;

  beforeEach(async () => {
    databaseName = `backup-persistence-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
    await seedOriginalState();
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  async function seedOriginalState() {
    await database.transaction(
      'rw',
      database.knowledgeEntries,
      database.snippetEntries,
      database.settings,
      async () => {
        await database.knowledgeEntries.clear();
        await database.snippetEntries.clear();
        await database.settings.clear();
        await database.knowledgeEntries.add(originalKnowledge);
        await database.snippetEntries.add(
          toSnippetEntryRecord(originalSnippet),
        );
        await database.settings.add({
          id: GLOBAL_SETTINGS_ID,
          defaultModel: 'original-model',
        });
      },
    );
  }

  async function expectOriginalState() {
    expect(await database.knowledgeEntries.toArray()).toEqual([
      originalKnowledge,
    ]);
    expect(await database.snippetEntries.toArray()).toEqual([
      toSnippetEntryRecord(originalSnippet),
    ]);
    expect(await database.settings.toArray()).toEqual([
      { id: GLOBAL_SETTINGS_ID, defaultModel: 'original-model' },
    ]);
  }

  it('reads all logical domains and maps missing physical Settings to null', async () => {
    const reader = new DexieBackupSnapshotReader(database);
    expect(await reader.readSnapshot()).toEqual({
      knowledge: [originalKnowledge],
      snippets: [originalSnippet],
      settings: { defaultModel: 'original-model' },
    });

    await database.settings.clear();
    expect((await reader.readSnapshot()).settings).toEqual({
      defaultModel: null,
    });
  });

  it('excludes simulated future persistence fields from the snapshot', async () => {
    await database.knowledgeEntries.put(
      Object.assign({}, originalKnowledge, {
        futureKnowledgeField: 'not-snapshotted',
        usageCount: 3,
      }),
    );
    await database.snippetEntries.put(
      Object.assign({}, originalSnippet, {
        trigger: ';future',
        richContent: { blocks: [] },
      }),
    );
    const futureSettingsRecord = Object.assign(
      { id: GLOBAL_SETTINGS_ID, defaultModel: 'original-model' },
      { futureSettingsField: true },
    );
    await database.settings.put(futureSettingsRecord);

    const snapshot = await new DexieBackupSnapshotReader(
      database,
    ).readSnapshot();
    expect(Object.keys(snapshot.knowledge[0] ?? {}).sort()).toEqual(
      [
        'id',
        'title',
        'body',
        'tags',
        'createdAt',
        'updatedAt',
        'source',
      ].sort(),
    );
    expect(Object.keys(snapshot.snippets[0] ?? {}).sort()).toEqual(
      [
        'id',
        'title',
        'content',
        'tags',
        'createdAt',
        'updatedAt',
        'trigger',
      ].sort(),
    );
    expect(Object.keys(snapshot.settings)).toEqual(['defaultModel']);
    expect(JSON.stringify(snapshot)).not.toContain('futureKnowledgeField');
    expect(JSON.stringify(snapshot)).not.toContain('usageCount');
    expect(snapshot.snippets[0]?.trigger).toBe(';future');
    expect(JSON.stringify(snapshot)).not.toContain('richContent');
    expect(JSON.stringify(snapshot)).not.toContain('futureSettingsField');
  });

  it('replaces all three stores, preserves exact metadata, and survives reopen', async () => {
    await new DexieTransactionalBackupRestorePort(database).replaceAll(
      restoredData,
    );

    expect(
      await new DexieBackupSnapshotReader(database).readSnapshot(),
    ).toEqual(restoredData);
    expect(await database.settings.toArray()).toEqual([
      { id: GLOBAL_SETTINGS_ID, defaultModel: 'qwen2.5:7b' },
    ]);
    expect(database.verno).toBe(DATABASE_VERSION);
    expect(database.tables.map(({ name }) => name).sort()).toEqual([
      'knowledgeEntries',
      'settings',
      'snippetEntries',
    ]);

    database.close();
    database = createIsolatedDatabase(databaseName);
    expect(
      await new DexieBackupSnapshotReader(database).readSnapshot(),
    ).toEqual(restoredData);
  });

  it('restores a valid empty backup and persists the null Settings singleton', async () => {
    await new DexieTransactionalBackupRestorePort(database).replaceAll({
      knowledge: [],
      snippets: [],
      settings: { defaultModel: null },
    });

    expect(await database.knowledgeEntries.count()).toBe(0);
    expect(await database.snippetEntries.count()).toBe(0);
    expect(await database.settings.toArray()).toEqual([
      { id: GLOBAL_SETTINGS_ID, defaultModel: null },
    ]);
  });

  it('excludes simulated future DTO fields from persisted records', async () => {
    const knowledge = Object.assign(
      {},
      requireValue(restoredData.knowledge[0], 'restored Knowledge entry'),
      {
        futureKnowledgeField: 'not-persisted',
        usageCount: 9,
      },
    );
    const snippet = Object.assign(
      {},
      requireValue(restoredData.snippets[0], 'restored Snippet entry'),
      {
        futureSnippetField: '/future',
        richContent: { blocks: [] },
      },
    );
    const settings = Object.assign({}, restoredData.settings, {
      futureSettingsField: true,
    });
    const backup = {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      exportedAt: '2026-08-02T09:00:00.000Z',
      data: { knowledge: [knowledge], snippets: [snippet], settings },
    } as BackupFileV2;

    await new BackupRestoreService(
      new DexieTransactionalBackupRestorePort(database),
    ).restoreBackup(backup);

    const persistedKnowledge = await database.knowledgeEntries.toArray();
    const persistedSnippets = await database.snippetEntries.toArray();
    const persistedSettings = await database.settings.toArray();
    expect(Object.keys(persistedKnowledge[0] ?? {}).sort()).toEqual(
      [
        'id',
        'title',
        'body',
        'tags',
        'createdAt',
        'updatedAt',
        'source',
      ].sort(),
    );
    expect(Object.keys(persistedSnippets[0] ?? {}).sort()).toEqual(
      [
        'id',
        'title',
        'content',
        'tags',
        'createdAt',
        'updatedAt',
        'trigger',
      ].sort(),
    );
    expect(Object.keys(persistedSettings[0] ?? {}).sort()).toEqual(
      ['id', 'defaultModel'].sort(),
    );
    expect(JSON.stringify(persistedKnowledge)).not.toContain(
      'futureKnowledgeField',
    );
    expect(JSON.stringify(persistedKnowledge)).not.toContain('usageCount');
    expect(JSON.stringify(persistedSnippets)).not.toContain(
      'futureSnippetField',
    );
    expect(JSON.stringify(persistedSnippets)).not.toContain('richContent');
    expect(JSON.stringify(persistedSettings)).not.toContain(
      'futureSettingsField',
    );
  });

  it('makes the restored default available to a recreated Side Panel bootstrap', async () => {
    await new DexieTransactionalBackupRestorePort(database).replaceAll(
      restoredData,
    );
    const recreatedPanelSettings = new SettingsService(
      new DexieSettingsRepository(database),
    );

    await expect(
      loadWorkspaceSettings(recreatedPanelSettings),
    ).resolves.toEqual({
      initialModel: 'qwen2.5:7b',
      loadFailureMessage: null,
    });
  });

  it.each<BackupRestoreStage>([
    'knowledge-cleared',
    'knowledge-written',
    'snippets-written',
    'settings-written',
  ])('rolls back all stores when %s fails', async (failedStage) => {
    const restore = new DexieTransactionalBackupRestorePort(database, {
      afterStage: (stage) => {
        if (stage === failedStage) throw new Error(`forced ${stage} failure`);
      },
    });

    await expect(restore.replaceAll(restoredData)).rejects.toThrow(
      `Failed to restore backup.`,
    );
    await expectOriginalState();
  });

  it('round-trips an exported logical snapshot independent of table iteration', async () => {
    const reader = new DexieBackupSnapshotReader(database);
    const exported = await reader.readSnapshot();
    await new DexieTransactionalBackupRestorePort(database).replaceAll({
      knowledge: [],
      snippets: [],
      settings: { defaultModel: null },
    });
    await new DexieTransactionalBackupRestorePort(database).replaceAll(
      exported,
    );

    expect(await reader.readSnapshot()).toEqual(exported);
  });
});
