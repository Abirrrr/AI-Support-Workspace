import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { BackupRestoreData } from '../../../src/application/backup/backup-ports';
import { BackupRestoreService } from '../../../src/application/backup/backup-service';
import { SettingsService } from '../../../src/application/settings/settings-service';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION_1,
  BACKUP_FORMAT_VERSION_2,
  BACKUP_FORMAT_VERSION_3,
  BACKUP_FORMAT_VERSION_4,
  BACKUP_FORMAT_VERSION_5,
  BACKUP_FORMAT_VERSION_6,
  BACKUP_FORMAT_VERSION_7,
  type BackupFile,
  type BackupFileV3,
  type BackupFileV7,
} from '../../../src/domain/backup-file';
import type { AutomaticBackupCadence } from '../../../src/domain/automatic-backup';
import { createPlainSnippetContent } from '../../../src/domain/snippet-content';
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
  content: createPlainSnippetContent('Original content'),
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
      content: createPlainSnippetContent('Restored content'),
      tags: ['z', 'a'],
      createdAt: '2026-08-02T08:00:02.000Z',
      updatedAt: '2026-08-02T08:00:03.000Z',
      trigger: ';restored',
    },
  ],
  snippetAssets: [],
  settings: {
    defaultModel: 'qwen2.5:7b',
    snippetPasteMode: 'automatic',
    automaticBackupCadence: 'weekly',
  },
  snippetUsageStats: [
    {
      snippetId: '423e4567-e89b-42d3-a456-426614174000',
      usageCount: 5,
      lastUsedAt: '2026-08-02T09:00:00.000Z',
    },
  ],
  snippetGeneratedMetadata: [
    {
      snippetId: '423e4567-e89b-42d3-a456-426614174000',
      generatedTags: ['restored'],
      sourceFingerprint: '0'.repeat(64),
      generatedAt: '2026-08-02T09:00:00.000Z',
    },
  ],
};

function requireValue<T>(value: T | undefined, description: string): T {
  if (value === undefined) throw new Error(`Missing ${description} fixture.`);
  return value;
}

const localAutomaticBackupState = {
  id: 'global' as const,
  directoryHandle: { kind: 'directory' as const, name: 'Local only' },
  backupSetId: '123e4567-e89b-42d3-a456-426614174000',
  managedBackups: [],
};

function createHistoricalEmptyBackup(
  formatVersion: 1 | 2 | 3 | 4 | 5 | 6,
): BackupFile {
  const envelope = {
    format: BACKUP_FORMAT,
    formatVersion,
    exportedAt: '2026-08-09T00:00:00.000Z',
  };
  if (formatVersion <= BACKUP_FORMAT_VERSION_3) {
    return {
      ...envelope,
      data: {
        knowledge: [],
        snippets: [],
        settings: { defaultModel: null },
      },
    } as BackupFile;
  }
  if (
    formatVersion === BACKUP_FORMAT_VERSION_4 ||
    formatVersion === BACKUP_FORMAT_VERSION_5
  ) {
    return {
      ...envelope,
      data: {
        knowledge: [],
        snippets: [],
        snippetAssets: [],
        settings: { defaultModel: null },
      },
    } as BackupFile;
  }
  return {
    ...envelope,
    data: {
      knowledge: [],
      snippets: [],
      snippetAssets: [],
      settings: {
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
      },
    },
  } as BackupFile;
}

function createEmptyV7Backup(
  automaticBackupCadence: AutomaticBackupCadence,
): BackupFileV7 {
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_7,
    exportedAt: '2026-08-09T00:00:00.000Z',
    backupId: '223e4567-e89b-42d3-a456-426614174000',
    creationMode: 'manual',
    data: {
      knowledge: [],
      snippets: [],
      snippetAssets: [],
      snippetUsageStats: [],
      snippetGeneratedMetadata: [],
      settings: {
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence,
      },
    },
  };
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
      snippetAssets: [],
      snippetUsageStats: [],
      snippetGeneratedMetadata: [],
      settings: {
        defaultModel: 'original-model',
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence: 'weekly',
      },
    });

    await database.settings.clear();
    expect((await reader.readSnapshot()).settings).toEqual({
      defaultModel: null,
      snippetPasteMode: 'clipboard-only',
      automaticBackupCadence: 'weekly',
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
    expect(Object.keys(snapshot.settings).sort()).toEqual(
      ['defaultModel', 'snippetPasteMode', 'automaticBackupCadence'].sort(),
    );
    expect(JSON.stringify(snapshot)).not.toContain('futureKnowledgeField');
    expect(JSON.stringify(snapshot)).not.toContain('usageCount');
    expect(snapshot.snippets[0]?.trigger).toBe(';future');
    expect(JSON.stringify(snapshot)).not.toContain('richContent');
    expect(JSON.stringify(snapshot)).not.toContain('futureSettingsField');
  });

  it('replaces all four stores, preserves exact metadata, and survives reopen', async () => {
    await new DexieTransactionalBackupRestorePort(database).replaceAll(
      restoredData,
    );

    expect(
      await new DexieBackupSnapshotReader(database).readSnapshot(),
    ).toEqual(restoredData);
    expect(await database.settings.toArray()).toEqual([
      {
        id: GLOBAL_SETTINGS_ID,
        defaultModel: 'qwen2.5:7b',
        snippetPasteMode: 'automatic',
        automaticBackupCadence: 'weekly',
      },
    ]);
    expect(database.verno).toBe(DATABASE_VERSION);
    expect(database.tables.map(({ name }) => name).sort()).toEqual([
      'automaticBackupState',
      'knowledgeEntries',
      'settings',
      'snippetAssets',
      'snippetEntries',
      'snippetGeneratedMetadata',
      'snippetUsageStats',
    ]);

    database.close();
    database = createIsolatedDatabase(databaseName);
    expect(
      await new DexieBackupSnapshotReader(database).readSnapshot(),
    ).toEqual(restoredData);
  });

  it('round-trips exact asset Blob bytes through restore, reopen, and snapshot', async () => {
    const snippetId = '523e4567-e89b-42d3-a456-426614174000';
    const assetId = '623e4567-e89b-42d3-a456-426614174000';
    const bytes = Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0xff,
    ]);
    const data: BackupRestoreData = {
      knowledge: [],
      snippets: [
        {
          id: snippetId,
          title: 'WebP',
          content: {
            kind: 'rich',
            blocks: [{ type: 'image', assetId, altText: 'Preview' }],
          },
          tags: [],
          createdAt: '2026-08-09T00:00:00.000Z',
          updatedAt: '2026-08-09T00:00:00.000Z',
          trigger: null,
        },
      ],
      snippetAssets: [
        {
          id: assetId,
          snippetId,
          mimeType: 'image/webp',
          blob: new Blob([bytes], { type: 'image/webp' }),
          byteSize: bytes.byteLength,
          originalFilename: null,
          createdAt: '2026-08-09T00:00:01.000Z',
        },
      ],
      settings: {
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence: 'weekly',
      },
      snippetUsageStats: [],
      snippetGeneratedMetadata: [],
    };

    await new DexieTransactionalBackupRestorePort(database).replaceAll(data);
    database.close();
    database = createIsolatedDatabase(databaseName);
    const snapshot = await new DexieBackupSnapshotReader(
      database,
    ).readSnapshot();

    expect(snapshot.snippets).toEqual(data.snippets);
    expect(snapshot.snippetAssets[0]).toMatchObject({
      id: assetId,
      snippetId,
      mimeType: 'image/webp',
      byteSize: bytes.byteLength,
      originalFilename: null,
    });
    const restoredAsset = snapshot.snippetAssets[0];
    if (restoredAsset === undefined) throw new Error('Missing restored asset.');
    expect(new Uint8Array(await restoredAsset.blob.arrayBuffer())).toEqual(
      bytes,
    );
  });

  it.each([
    BACKUP_FORMAT_VERSION_1,
    BACKUP_FORMAT_VERSION_2,
    BACKUP_FORMAT_VERSION_3,
  ] as const)(
    'restores Backup v%i into Dexie v5 without synthetic assets',
    async (formatVersion) => {
      const common = {
        id: '923e4567-e89b-42d3-a456-426614174000',
        title: 'Historical',
        tags: [],
        createdAt: '2026-08-09T00:00:00.000Z',
        updatedAt: '2026-08-09T00:00:00.000Z',
      };
      const backup = {
        format: BACKUP_FORMAT,
        formatVersion,
        exportedAt: '2026-08-09T00:00:00.000Z',
        data: {
          knowledge: [],
          snippets: [
            formatVersion === BACKUP_FORMAT_VERSION_1
              ? { ...common, content: 'Historical plain' }
              : formatVersion === BACKUP_FORMAT_VERSION_2
                ? { ...common, content: 'Historical plain', trigger: ';old' }
                : {
                    ...common,
                    content: createPlainSnippetContent('Historical plain'),
                    trigger: ';old',
                  },
          ],
          settings: { defaultModel: null },
        },
      } as BackupFile;

      await new BackupRestoreService(
        new DexieTransactionalBackupRestorePort(database),
      ).restoreBackup(backup);

      expect(await database.snippetAssets.count()).toBe(0);
      expect(await database.snippetEntries.count()).toBe(1);
    },
  );

  it.each(['off', 'daily', 'weekly'] as const)(
    'restores v7 cadence %s while preserving existing local authorization',
    async (cadence) => {
      await database.automaticBackupState.add(localAutomaticBackupState);
      await new BackupRestoreService(
        new DexieTransactionalBackupRestorePort(database),
      ).restoreBackup(createEmptyV7Backup(cadence));

      expect(await database.knowledgeEntries.count()).toBe(0);
      expect(await database.snippetEntries.count()).toBe(0);
      expect(await database.automaticBackupState.toArray()).toEqual([
        localAutomaticBackupState,
      ]);
      expect(await database.settings.toArray()).toEqual([
        {
          id: GLOBAL_SETTINGS_ID,
          defaultModel: null,
          snippetPasteMode: 'clipboard-only',
          automaticBackupCadence: cadence,
        },
      ]);
    },
  );

  it.each([
    BACKUP_FORMAT_VERSION_1,
    BACKUP_FORMAT_VERSION_2,
    BACKUP_FORMAT_VERSION_3,
    BACKUP_FORMAT_VERSION_4,
    BACKUP_FORMAT_VERSION_5,
    BACKUP_FORMAT_VERSION_6,
  ] as const)(
    'preserves local authorization and defaults cadence to weekly for Backup v%i',
    async (formatVersion) => {
      await database.automaticBackupState.add(localAutomaticBackupState);
      await new BackupRestoreService(
        new DexieTransactionalBackupRestorePort(database),
      ).restoreBackup(createHistoricalEmptyBackup(formatVersion));

      expect(await database.automaticBackupState.toArray()).toEqual([
        localAutomaticBackupState,
      ]);
      expect(await database.settings.get(GLOBAL_SETTINGS_ID)).toEqual({
        id: GLOBAL_SETTINGS_ID,
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence: 'weekly',
      });
    },
  );

  it.each(['daily', 'weekly'] as const)(
    'restores v7 cadence %s without fabricating local authorization',
    async (cadence) => {
      await new BackupRestoreService(
        new DexieTransactionalBackupRestorePort(database),
      ).restoreBackup(createEmptyV7Backup(cadence));

      expect(await database.automaticBackupState.count()).toBe(0);
      expect(
        (await database.settings.get(GLOBAL_SETTINGS_ID))
          ?.automaticBackupCadence,
      ).toBe(cadence);
    },
  );

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
      formatVersion: BACKUP_FORMAT_VERSION_3,
      exportedAt: '2026-08-02T09:00:00.000Z',
      data: { knowledge: [knowledge], snippets: [snippet], settings },
    } as BackupFileV3;

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
      [
        'id',
        'defaultModel',
        'snippetPasteMode',
        'automaticBackupCadence',
      ].sort(),
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
    'snippets-cleared',
    'snippet-assets-cleared',
    'settings-cleared',
    'snippet-usage-stats-cleared',
    'snippet-generated-metadata-cleared',
    'knowledge-written',
    'snippets-written',
    'snippet-assets-written',
    'settings-written',
    'snippet-usage-stats-written',
    'snippet-generated-metadata-written',
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

  it('preserves portable profile data and local authorization when restore fails', async () => {
    await database.automaticBackupState.add(localAutomaticBackupState);
    const restore = new DexieTransactionalBackupRestorePort(database, {
      afterStage: (stage) => {
        if (stage === 'settings-written') {
          throw new Error('forced portable restore failure');
        }
      },
    });

    await expect(restore.replaceAll(restoredData)).rejects.toThrow(
      'Failed to restore backup.',
    );
    await expectOriginalState();
    expect(await database.automaticBackupState.toArray()).toEqual([
      localAutomaticBackupState,
    ]);
  });

  it('rolls back all four stores when a non-empty asset restore fails', async () => {
    const snippetId = '723e4567-e89b-42d3-a456-426614174000';
    const assetId = '823e4567-e89b-42d3-a456-426614174000';
    const bytes = Uint8Array.from([0xff, 0xd8, 0xff]);
    const restore = new DexieTransactionalBackupRestorePort(database, {
      afterStage: (stage) => {
        if (stage === 'snippet-assets-written') {
          throw new Error('forced asset restore failure');
        }
      },
    });
    await expect(
      restore.replaceAll({
        knowledge: [],
        snippets: [
          {
            id: snippetId,
            title: 'New',
            content: {
              kind: 'rich',
              blocks: [{ type: 'image', assetId, altText: '' }],
            },
            tags: [],
            createdAt: '2026-08-09T00:00:00.000Z',
            updatedAt: '2026-08-09T00:00:00.000Z',
            trigger: null,
          },
        ],
        snippetAssets: [
          {
            id: assetId,
            snippetId,
            mimeType: 'image/jpeg',
            blob: new Blob([bytes], { type: 'image/jpeg' }),
            byteSize: bytes.byteLength,
            originalFilename: 'new.jpg',
            createdAt: '2026-08-09T00:00:00.000Z',
          },
        ],
        settings: {
          defaultModel: null,
          snippetPasteMode: 'clipboard-only',
          automaticBackupCadence: 'weekly',
        },
        snippetUsageStats: [],
        snippetGeneratedMetadata: [],
      }),
    ).rejects.toThrow('Failed to restore backup.');
    await expectOriginalState();
    expect(await database.snippetAssets.count()).toBe(0);
  });

  it('round-trips an exported logical snapshot independent of table iteration', async () => {
    const reader = new DexieBackupSnapshotReader(database);
    const exported = await reader.readSnapshot();
    await new DexieTransactionalBackupRestorePort(database).replaceAll({
      knowledge: [],
      snippets: [],
      snippetAssets: [],
      settings: {
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence: 'weekly',
      },
      snippetUsageStats: [],
      snippetGeneratedMetadata: [],
    });
    await new DexieTransactionalBackupRestorePort(database).replaceAll(
      exported,
    );

    expect(await reader.readSnapshot()).toEqual(exported);
  });
});
