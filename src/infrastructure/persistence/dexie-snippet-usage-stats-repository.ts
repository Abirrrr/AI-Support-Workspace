import type { SnippetUsageStatsRepository } from '../../application/persistence/snippet-usage-stats-repository';
import type { SnippetUsageStats } from '../../domain/snippet-usage-stats';
import type { AiSupportWorkspaceDatabase } from './database';
import { runPersistenceOperation } from './repository-helpers';
import {
  toSnippetUsageStats,
  toSnippetUsageStatsRecord,
} from './snippet-usage-stats-record';

export class DexieSnippetUsageStatsRepository implements SnippetUsageStatsRepository {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  get(snippetId: string): Promise<SnippetUsageStats | undefined> {
    return runPersistenceOperation('get Snippet usage statistics', async () => {
      const record = await this.database.snippetUsageStats.get(snippetId);
      return record === undefined ? undefined : toSnippetUsageStats(record);
    });
  }

  list(): Promise<readonly SnippetUsageStats[]> {
    return runPersistenceOperation('list Snippet usage statistics', async () =>
      (await this.database.snippetUsageStats.toArray())
        .sort((left, right) => left.snippetId.localeCompare(right.snippetId))
        .map(toSnippetUsageStats),
    );
  }

  save(stats: SnippetUsageStats): Promise<SnippetUsageStats> {
    return runPersistenceOperation(
      'save Snippet usage statistics',
      async () => {
        const record = toSnippetUsageStatsRecord(stats);
        await this.database.transaction(
          'rw',
          this.database.snippetEntries,
          this.database.snippetUsageStats,
          async () => {
            const owner = await this.database.snippetEntries.get(
              stats.snippetId,
            );
            if (owner === undefined) {
              throw new TypeError(
                'Snippet usage statistics require a Snippet owner.',
              );
            }
            await this.database.snippetUsageStats.put(record);
          },
        );
        return toSnippetUsageStats(record);
      },
    );
  }

  recordUse(snippetId: string, usedAt: string): Promise<SnippetUsageStats> {
    return runPersistenceOperation('record Snippet usage', async () =>
      this.database.transaction(
        'rw',
        this.database.snippetEntries,
        this.database.snippetUsageStats,
        async () => {
          const owner = await this.database.snippetEntries.get(snippetId);
          if (owner === undefined) {
            throw new TypeError(
              'Snippet usage statistics require a Snippet owner.',
            );
          }
          const existingRecord =
            await this.database.snippetUsageStats.get(snippetId);
          const existing =
            existingRecord === undefined
              ? undefined
              : toSnippetUsageStats(existingRecord);
          const record = toSnippetUsageStatsRecord({
            snippetId,
            usageCount:
              existing === undefined
                ? 1
                : Math.min(Number.MAX_SAFE_INTEGER, existing.usageCount + 1),
            lastUsedAt: usedAt,
          });
          await this.database.snippetUsageStats.put(record);
          return toSnippetUsageStats(record);
        },
      ),
    );
  }

  delete(snippetId: string): Promise<boolean> {
    return runPersistenceOperation(
      'delete Snippet usage statistics',
      async () => {
        const existing = await this.database.snippetUsageStats.get(snippetId);
        if (existing === undefined) return false;
        await this.database.snippetUsageStats.delete(snippetId);
        return true;
      },
    );
  }
}
