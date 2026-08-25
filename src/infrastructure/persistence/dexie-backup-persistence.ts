import type {
  BackupRestoreData,
  BackupSnapshot,
  BackupSnapshotReader,
  TransactionalBackupRestorePort,
} from '../../application/backup/backup-ports';
import type { AiSupportWorkspaceDatabase } from './database';
import { runPersistenceOperation } from './repository-helpers';
import { GLOBAL_SETTINGS_ID } from './settings-record';
import { toSnippetEntry, toSnippetEntryRecord } from './snippet-entry-record';
import { toSnippetAsset, toSnippetAssetRecord } from './snippet-asset-record';
import {
  toSnippetUsageStats,
  toSnippetUsageStatsRecord,
} from './snippet-usage-stats-record';
import {
  toSnippetGeneratedMetadata,
  toSnippetGeneratedMetadataRecord,
} from './snippet-generated-metadata-record';
import { isAutomaticBackupCadence } from '../../domain/automatic-backup';

export type BackupRestoreStage =
  | 'knowledge-cleared'
  | 'snippets-cleared'
  | 'snippet-assets-cleared'
  | 'settings-cleared'
  | 'snippet-usage-stats-cleared'
  | 'snippet-generated-metadata-cleared'
  | 'knowledge-written'
  | 'snippets-written'
  | 'snippet-assets-written'
  | 'settings-written'
  | 'snippet-usage-stats-written'
  | 'snippet-generated-metadata-written';

export interface BackupRestoreTestHooks {
  afterStage?(stage: BackupRestoreStage): void | Promise<void>;
}

async function runHook(
  hooks: BackupRestoreTestHooks,
  stage: BackupRestoreStage,
) {
  await hooks.afterStage?.(stage);
}

function resolveAutomaticBackupCadence(value: unknown) {
  const cadence = value ?? 'weekly';
  if (!isAutomaticBackupCadence(cadence)) {
    throw new TypeError('Persisted automatic-backup cadence is invalid.');
  }
  return cadence;
}

export class DexieBackupSnapshotReader implements BackupSnapshotReader {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  readSnapshot(): Promise<BackupSnapshot> {
    return runPersistenceOperation('read backup snapshot', () =>
      this.database.transaction(
        'r',
        [
          this.database.knowledgeEntries,
          this.database.snippetEntries,
          this.database.snippetAssets,
          this.database.settings,
          this.database.snippetUsageStats,
          this.database.snippetGeneratedMetadata,
        ],
        async () => {
          const [
            knowledge,
            snippets,
            snippetAssets,
            settingsRecord,
            snippetUsageStats,
            snippetGeneratedMetadata,
          ] = await Promise.all([
            this.database.knowledgeEntries.toArray(),
            this.database.snippetEntries.toArray(),
            this.database.snippetAssets.toArray(),
            this.database.settings.get(GLOBAL_SETTINGS_ID),
            this.database.snippetUsageStats.toArray(),
            this.database.snippetGeneratedMetadata.toArray(),
          ]);

          return {
            knowledge: knowledge.map((entry) => ({
              id: entry.id,
              title: entry.title,
              body: entry.body,
              tags: [...entry.tags],
              createdAt: entry.createdAt,
              updatedAt: entry.updatedAt,
              source: entry.source,
            })),
            snippets: snippets.map(toSnippetEntry),
            snippetAssets: snippetAssets.map(toSnippetAsset),
            settings: {
              defaultModel: settingsRecord?.defaultModel ?? null,
              snippetPasteMode:
                settingsRecord?.snippetPasteMode === 'automatic'
                  ? 'automatic'
                  : 'clipboard-only',
              automaticBackupCadence: resolveAutomaticBackupCadence(
                settingsRecord?.automaticBackupCadence,
              ),
            },
            snippetUsageStats: snippetUsageStats.map(toSnippetUsageStats),
            snippetGeneratedMetadata: snippetGeneratedMetadata.map(
              toSnippetGeneratedMetadata,
            ),
          };
        },
      ),
    );
  }
}

export class DexieTransactionalBackupRestorePort implements TransactionalBackupRestorePort {
  constructor(
    private readonly database: AiSupportWorkspaceDatabase,
    private readonly testHooks: BackupRestoreTestHooks = {},
  ) {}

  replaceAll(data: BackupRestoreData): Promise<void> {
    return runPersistenceOperation('restore backup', () =>
      this.database.transaction(
        'rw',
        [
          this.database.knowledgeEntries,
          this.database.snippetEntries,
          this.database.snippetAssets,
          this.database.settings,
          this.database.snippetUsageStats,
          this.database.snippetGeneratedMetadata,
        ],
        async () => {
          await this.database.knowledgeEntries.clear();
          await runHook(this.testHooks, 'knowledge-cleared');
          await this.database.snippetEntries.clear();
          await runHook(this.testHooks, 'snippets-cleared');
          await this.database.snippetAssets.clear();
          await runHook(this.testHooks, 'snippet-assets-cleared');
          await this.database.settings.clear();
          await runHook(this.testHooks, 'settings-cleared');
          await this.database.snippetUsageStats.clear();
          await runHook(this.testHooks, 'snippet-usage-stats-cleared');
          await this.database.snippetGeneratedMetadata.clear();
          await runHook(this.testHooks, 'snippet-generated-metadata-cleared');

          if (data.knowledge.length > 0) {
            await this.database.knowledgeEntries.bulkAdd(
              data.knowledge.map((entry) => ({
                id: entry.id,
                title: entry.title,
                body: entry.body,
                tags: [...entry.tags],
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
                source: entry.source,
              })),
            );
          }
          await runHook(this.testHooks, 'knowledge-written');

          if (data.snippets.length > 0) {
            await this.database.snippetEntries.bulkAdd(
              data.snippets.map(toSnippetEntryRecord),
            );
          }
          await runHook(this.testHooks, 'snippets-written');

          if (data.snippetAssets.length > 0) {
            await this.database.snippetAssets.bulkAdd(
              data.snippetAssets.map(toSnippetAssetRecord),
            );
          }
          await runHook(this.testHooks, 'snippet-assets-written');

          await this.database.settings.put({
            id: GLOBAL_SETTINGS_ID,
            defaultModel: data.settings.defaultModel,
            snippetPasteMode: data.settings.snippetPasteMode,
            automaticBackupCadence: data.settings.automaticBackupCadence,
          });
          await runHook(this.testHooks, 'settings-written');

          if (data.snippetUsageStats.length > 0) {
            await this.database.snippetUsageStats.bulkAdd(
              data.snippetUsageStats.map(toSnippetUsageStatsRecord),
            );
          }
          await runHook(this.testHooks, 'snippet-usage-stats-written');

          if (data.snippetGeneratedMetadata.length > 0) {
            await this.database.snippetGeneratedMetadata.bulkAdd(
              data.snippetGeneratedMetadata.map(
                toSnippetGeneratedMetadataRecord,
              ),
            );
          }
          await runHook(this.testHooks, 'snippet-generated-metadata-written');
        },
      ),
    );
  }
}
