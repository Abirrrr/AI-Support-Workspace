import {
  validateSnippetUsageStats,
  type SnippetUsageStats,
} from '../../domain/snippet-usage-stats';

export interface SnippetUsageStatsRecord {
  readonly snippetId: string;
  readonly usageCount: number;
  readonly lastUsedAt: string;
}

export function toSnippetUsageStats(
  record: SnippetUsageStatsRecord,
): SnippetUsageStats {
  return validateSnippetUsageStats(record);
}

export function toSnippetUsageStatsRecord(
  stats: SnippetUsageStats,
): SnippetUsageStatsRecord {
  return validateSnippetUsageStats(stats);
}
