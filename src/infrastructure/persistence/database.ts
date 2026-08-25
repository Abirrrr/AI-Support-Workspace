import Dexie, { type DexieOptions, type Table } from 'dexie';

import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { SettingsRecord } from './settings-record';
import { createPlainSnippetContent } from '../../domain/snippet-content';
import type { SnippetEntryRecord } from './snippet-entry-record';
import type { SnippetAssetRecord } from './snippet-asset-record';
import type { SnippetUsageStatsRecord } from './snippet-usage-stats-record';
import type { SnippetGeneratedMetadataRecord } from './snippet-generated-metadata-record';
import type { AutomaticBackupStateRecord } from './automatic-backup-state-record';
import { GLOBAL_SETTINGS_ID } from './settings-record';

export const DATABASE_NAME = 'ai-support-workspace';
export const DATABASE_VERSION = 6;

export interface DatabaseConstructionOptions {
  databaseName?: string;
  indexedDB?: IDBFactory;
  IDBKeyRange?: typeof globalThis.IDBKeyRange;
}

interface MigratingSnippetEntryRecordV3 {
  content: unknown;
}

function getDexieOptions(
  options: DatabaseConstructionOptions,
): DexieOptions | undefined {
  const { indexedDB, IDBKeyRange } = options;

  if ((indexedDB === undefined) !== (IDBKeyRange === undefined)) {
    throw new TypeError(
      'indexedDB and IDBKeyRange overrides must be supplied together.',
    );
  }

  if (indexedDB === undefined || IDBKeyRange === undefined) {
    return undefined;
  }

  return { indexedDB, IDBKeyRange };
}

export class AiSupportWorkspaceDatabase extends Dexie {
  readonly knowledgeEntries!: Table<KnowledgeEntry, string>;
  readonly settings!: Table<SettingsRecord, string>;
  readonly snippetEntries!: Table<SnippetEntryRecord, string>;
  readonly snippetAssets!: Table<SnippetAssetRecord, string>;
  readonly snippetUsageStats!: Table<SnippetUsageStatsRecord, string>;
  readonly snippetGeneratedMetadata!: Table<
    SnippetGeneratedMetadataRecord,
    string
  >;
  readonly automaticBackupState!: Table<AutomaticBackupStateRecord, string>;

  constructor(options: DatabaseConstructionOptions = {}) {
    super(options.databaseName ?? DATABASE_NAME, getDexieOptions(options));

    this.version(1).stores({
      knowledgeEntries: 'id, createdAt',
      snippetEntries: 'id, createdAt',
    });
    this.version(2).stores({
      knowledgeEntries: 'id, createdAt',
      settings: 'id',
      snippetEntries: 'id, createdAt',
    });
    this.version(3).stores({
      knowledgeEntries: 'id, createdAt',
      settings: 'id',
      snippetEntries: 'id, createdAt, &trigger',
    });
    this.version(4)
      .stores({
        knowledgeEntries: 'id, createdAt',
        settings: 'id',
        snippetEntries: 'id, createdAt, &trigger',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table<MigratingSnippetEntryRecordV3, string>('snippetEntries')
          .toCollection()
          .modify((record) => {
            if (typeof record.content !== 'string') {
              throw new TypeError(
                'Database v4 migration expected legacy string Snippet content.',
              );
            }
            record.content = createPlainSnippetContent(record.content);
          });
      });
    this.version(5).stores({
      knowledgeEntries: 'id, createdAt',
      settings: 'id',
      snippetEntries: 'id, createdAt, &trigger',
      snippetAssets: 'id, snippetId, createdAt',
    });
    this.version(DATABASE_VERSION)
      .stores({
        knowledgeEntries: 'id, createdAt',
        settings: 'id',
        snippetEntries: 'id, createdAt, &trigger',
        snippetAssets: 'id, snippetId, createdAt',
        snippetUsageStats: 'snippetId, lastUsedAt',
        snippetGeneratedMetadata: 'snippetId, generatedAt',
        automaticBackupState: 'id',
      })
      .upgrade(async (transaction) => {
        const settings = transaction.table<SettingsRecord, string>('settings');
        const record = await settings.get(GLOBAL_SETTINGS_ID);
        if (
          record !== undefined &&
          record.automaticBackupCadence === undefined
        ) {
          await settings.put({
            ...record,
            automaticBackupCadence: 'weekly',
          });
        }
      });

    this.knowledgeEntries = this.table('knowledgeEntries');
    this.settings = this.table('settings');
    this.snippetEntries = this.table('snippetEntries');
    this.snippetAssets = this.table('snippetAssets');
    this.snippetUsageStats = this.table('snippetUsageStats');
    this.snippetGeneratedMetadata = this.table('snippetGeneratedMetadata');
    this.automaticBackupState = this.table('automaticBackupState');
  }
}

export function createDatabase(
  options: DatabaseConstructionOptions = {},
): AiSupportWorkspaceDatabase {
  return new AiSupportWorkspaceDatabase(options);
}
