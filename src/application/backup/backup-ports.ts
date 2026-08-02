import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { Settings } from '../../domain/settings';
import type { SnippetEntry } from '../../domain/snippet-entry';

export interface BackupSnapshot {
  readonly knowledge: readonly KnowledgeEntry[];
  readonly snippets: readonly SnippetEntry[];
  readonly settings: Settings;
}

export interface BackupRestoreData {
  readonly knowledge: readonly KnowledgeEntry[];
  readonly snippets: readonly SnippetEntry[];
  readonly settings: Settings;
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
