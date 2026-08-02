import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  MAX_BACKUP_BYTES,
  type BackupFileV1,
  type BackupImportPreview,
  type BackupKnowledgeRecordV1,
  type BackupSnippetRecordV1,
} from '../../domain/backup-file';
import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { SnippetEntry } from '../../domain/snippet-entry';
import {
  BackupExportError,
  BackupImportError,
  BackupRestoreError,
} from './backup-errors';
import type {
  BackupDownloadPort,
  BackupFileSource,
  BackupRestoreData,
  BackupSnapshotReader,
  TransactionalBackupRestorePort,
} from './backup-ports';
import { parseBackupFileV1 } from './backup-validator';

export interface PreparedBackupImport {
  readonly backup: BackupFileV1;
  readonly preview: BackupImportPreview;
}

export interface BackupExportApplication {
  exportBackup(): Promise<void>;
}

export interface BackupImportApplication {
  prepareImport(source: BackupFileSource): Promise<PreparedBackupImport>;
}

export interface BackupRestoreApplication {
  restoreBackup(backup: BackupFileV1): Promise<void>;
}

function compareByCreatedAtAndId(
  left: { createdAt: string; id: string },
  right: { createdAt: string; id: string },
): number {
  if (left.createdAt < right.createdAt) return -1;
  if (left.createdAt > right.createdAt) return 1;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

function toBackupKnowledgeRecordV1(
  entry: KnowledgeEntry,
): BackupKnowledgeRecordV1 {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body,
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    source: entry.source,
  };
}

function toBackupSnippetRecordV1(entry: SnippetEntry): BackupSnippetRecordV1 {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function toRestoreKnowledgeEntry(
  entry: BackupKnowledgeRecordV1,
): KnowledgeEntry {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body,
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    source: entry.source,
  };
}

function toRestoreSnippetEntry(entry: BackupSnippetRecordV1): SnippetEntry {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export function createBackupFilename(exportedAt: string): string {
  const withoutMilliseconds = exportedAt.replace(/\.\d{3}Z$/, 'Z');
  return `ai-support-workspace-backup-${withoutMilliseconds.replaceAll(':', '-')}.json`;
}

export function measureUtf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export class BackupExportService implements BackupExportApplication {
  constructor(
    private readonly snapshotReader: BackupSnapshotReader,
    private readonly downloadPort: BackupDownloadPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async exportBackup(): Promise<void> {
    try {
      const snapshot = await this.snapshotReader.readSnapshot();
      const exportedAt = this.now().toISOString();
      const backup: BackupFileV1 = {
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        exportedAt,
        data: {
          knowledge: [...snapshot.knowledge]
            .sort(compareByCreatedAtAndId)
            .map(toBackupKnowledgeRecordV1),
          snippets: [...snapshot.snippets]
            .sort(compareByCreatedAtAndId)
            .map(toBackupSnippetRecordV1),
          settings: { defaultModel: snapshot.settings.defaultModel },
        },
      };
      const serialized = JSON.stringify(backup);

      if (measureUtf8Bytes(serialized) > MAX_BACKUP_BYTES) {
        throw new BackupExportError('too-large');
      }

      await this.downloadPort.download(
        serialized,
        createBackupFilename(exportedAt),
      );
    } catch (error) {
      if (error instanceof BackupExportError) throw error;
      throw new BackupExportError('failure', error);
    }
  }
}

export class BackupImportService implements BackupImportApplication {
  async prepareImport(source: BackupFileSource): Promise<PreparedBackupImport> {
    if (source.size > MAX_BACKUP_BYTES) {
      throw new BackupImportError('too-large');
    }

    let serialized: string;
    try {
      serialized = await source.readText();
    } catch (error) {
      throw new BackupImportError('read-failure', error);
    }

    const backup = parseBackupFileV1(serialized);
    return {
      backup,
      preview: {
        filename: source.name,
        exportedAt: backup.exportedAt,
        knowledgeCount: backup.data.knowledge.length,
        snippetCount: backup.data.snippets.length,
        defaultModel: backup.data.settings.defaultModel,
      },
    };
  }
}

export class BackupRestoreService implements BackupRestoreApplication {
  constructor(private readonly restorePort: TransactionalBackupRestorePort) {}

  async restoreBackup(backup: BackupFileV1): Promise<void> {
    try {
      const restoreData: BackupRestoreData = {
        knowledge: backup.data.knowledge.map(toRestoreKnowledgeEntry),
        snippets: backup.data.snippets.map(toRestoreSnippetEntry),
        settings: { defaultModel: backup.data.settings.defaultModel },
      };

      await this.restorePort.replaceAll(restoreData);
    } catch (error) {
      throw new BackupRestoreError(error);
    }
  }
}
