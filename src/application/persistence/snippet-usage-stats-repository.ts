import type { SnippetUsageStats } from '../../domain/snippet-usage-stats';

export interface SnippetUsageStatsRepository {
  get(snippetId: string): Promise<SnippetUsageStats | undefined>;
  list(): Promise<readonly SnippetUsageStats[]>;
  save(stats: SnippetUsageStats): Promise<SnippetUsageStats>;
  delete(snippetId: string): Promise<boolean>;
}
