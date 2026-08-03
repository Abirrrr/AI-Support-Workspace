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

export type BackupRestoreStage =
  | 'knowledge-cleared'
  | 'snippets-cleared'
  | 'settings-cleared'
  | 'knowledge-written'
  | 'snippets-written'
  | 'settings-written';

export interface BackupRestoreTestHooks {
  afterStage?(stage: BackupRestoreStage): void | Promise<void>;
}

async function runHook(
  hooks: BackupRestoreTestHooks,
  stage: BackupRestoreStage,
) {
  await hooks.afterStage?.(stage);
}

export class DexieBackupSnapshotReader implements BackupSnapshotReader {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  readSnapshot(): Promise<BackupSnapshot> {
    return runPersistenceOperation('read backup snapshot', () =>
      this.database.transaction(
        'r',
        this.database.knowledgeEntries,
        this.database.snippetEntries,
        this.database.settings,
        async () => {
          const [knowledge, snippets, settingsRecord] = await Promise.all([
            this.database.knowledgeEntries.toArray(),
            this.database.snippetEntries.toArray(),
            this.database.settings.get(GLOBAL_SETTINGS_ID),
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
            settings: {
              defaultModel: settingsRecord?.defaultModel ?? null,
            },
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
        this.database.knowledgeEntries,
        this.database.snippetEntries,
        this.database.settings,
        async () => {
          await this.database.knowledgeEntries.clear();
          await runHook(this.testHooks, 'knowledge-cleared');
          await this.database.snippetEntries.clear();
          await runHook(this.testHooks, 'snippets-cleared');
          await this.database.settings.clear();
          await runHook(this.testHooks, 'settings-cleared');

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

          await this.database.settings.put({
            id: GLOBAL_SETTINGS_ID,
            defaultModel: data.settings.defaultModel,
          });
          await runHook(this.testHooks, 'settings-written');
        },
      ),
    );
  }
}
