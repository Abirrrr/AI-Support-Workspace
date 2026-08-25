import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { Settings } from '../../domain/settings';
import type { SnippetEntry } from '../../domain/snippet-entry';
import type { SnippetAsset } from '../../domain/snippet-asset';
import type { SnippetUsageStats } from '../../domain/snippet-usage-stats';
import type { SnippetGeneratedMetadata } from '../../domain/snippet-generated-metadata';

export interface BackupSnapshot {
  readonly knowledge: readonly KnowledgeEntry[];
  readonly snippets: readonly SnippetEntry[];
  readonly snippetAssets: readonly SnippetAsset[];
  readonly settings: Settings;
  readonly snippetUsageStats: readonly SnippetUsageStats[];
  readonly snippetGeneratedMetadata: readonly SnippetGeneratedMetadata[];
}

export interface BackupRestoreData {
  readonly knowledge: readonly KnowledgeEntry[];
  readonly snippets: readonly SnippetEntry[];
  readonly snippetAssets: readonly SnippetAsset[];
  readonly settings: Settings;
  readonly snippetUsageStats: readonly SnippetUsageStats[];
  readonly snippetGeneratedMetadata: readonly SnippetGeneratedMetadata[];
}

export interface BackupSnapshotReader {
  readSnapshot(): Promise<BackupSnapshot>;
}

export interface BackupDownloadPort {
  download(serializedBackup: string, filename: string): Promise<void>;
}

export interface BackupFileSource {
  readonly name: string;
  readonly size: number;
  readText(): Promise<string>;
}

export interface TransactionalBackupRestorePort {
  replaceAll(data: BackupRestoreData): Promise<void>;
}
