import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  BACKUP_FORMAT_VERSION_1,
  BACKUP_FORMAT_VERSION_2,
  MAX_BACKUP_BYTES,
  type BackupFile,
  type BackupFileV3,
  type BackupImportPreview,
  type BackupKnowledgeRecordV3,
  type BackupRichSnippetBlockV3,
  type BackupRichSnippetInlineV3,
  type BackupSnippetContentV3,
  type BackupSnippetRecordV1,
  type BackupSnippetRecordV2,
  type BackupSnippetRecordV3,
} from '../../domain/backup-file';
import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { SnippetEntry } from '../../domain/snippet-entry';
import {
  createPlainSnippetContent,
  type RichSnippetBlock,
  type RichSnippetInline,
  type SnippetContent,
} from '../../domain/snippet-content';
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
import { parseBackupFile } from './backup-validator';
import {
  CatalogUnavailableAfterMutationError,
  runCatalogCoordinatedMutation,
  type CatalogMutationPort,
} from '../snippet/catalog-mutation';

export const VERSION_1_TRIGGER_WARNING =
  'This version 1 backup does not contain Snippet triggers. Restored Snippets will have no triggers.';

export interface PreparedBackupImport {
  readonly backup: BackupFile;
  readonly preview: BackupImportPreview;
}

export interface BackupExportApplication {
  exportBackup(): Promise<void>;
}

export interface BackupImportApplication {
  prepareImport(source: BackupFileSource): Promise<PreparedBackupImport>;
}

export interface BackupRestoreApplication {
  restoreBackup(backup: BackupFile): Promise<void>;
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

function toBackupKnowledgeRecordV3(
  entry: KnowledgeEntry,
): BackupKnowledgeRecordV3 {
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

function toBackupRichInlineV3(
  inline: RichSnippetInline,
): BackupRichSnippetInlineV3 {
  return inline.type === 'text'
    ? {
        type: 'text',
        text: inline.text,
        bold: inline.bold,
        italic: inline.italic,
      }
    : {
        type: 'link',
        text: inline.text,
        url: inline.url,
        bold: inline.bold,
        italic: inline.italic,
      };
}

function toBackupRichBlockV3(
  block: RichSnippetBlock,
): BackupRichSnippetBlockV3 {
  return block.type === 'paragraph'
    ? {
        type: 'paragraph',
        children: block.children.map(toBackupRichInlineV3),
      }
    : {
        type: 'reference',
        referenceType: 'image',
        label: block.label,
        url: block.url,
      };
}

function toBackupSnippetContentV3(
  content: SnippetContent,
): BackupSnippetContentV3 {
  return content.kind === 'plain'
    ? { kind: 'plain', text: content.text }
    : { kind: 'rich', blocks: content.blocks.map(toBackupRichBlockV3) };
}

function toBackupSnippetRecordV3(entry: SnippetEntry): BackupSnippetRecordV3 {
  return {
    id: entry.id,
    title: entry.title,
    content: toBackupSnippetContentV3(entry.content),
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    trigger: entry.trigger,
  };
}

function toRestoreKnowledgeEntry(
  entry: BackupKnowledgeRecordV3,
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
    content: createPlainSnippetContent(entry.content),
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    trigger: null,
  };
}

function toRestoreSnippetEntryV2(entry: BackupSnippetRecordV2): SnippetEntry {
  return {
    id: entry.id,
    title: entry.title,
    content: createPlainSnippetContent(entry.content),
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    trigger: entry.trigger,
  };
}

function toRestoreRichInlineV3(
  inline: BackupRichSnippetInlineV3,
): RichSnippetInline {
  return inline.type === 'text'
    ? {
        type: 'text',
        text: inline.text,
        bold: inline.bold,
        italic: inline.italic,
      }
    : {
        type: 'link',
        text: inline.text,
        url: inline.url,
        bold: inline.bold,
        italic: inline.italic,
      };
}

function toRestoreRichBlockV3(
  block: BackupRichSnippetBlockV3,
): RichSnippetBlock {
  return block.type === 'paragraph'
    ? {
        type: 'paragraph',
        children: block.children.map(toRestoreRichInlineV3),
      }
    : {
        type: 'reference',
        referenceType: 'image',
        label: block.label,
        url: block.url,
      };
}

function toRestoreSnippetContentV3(
  content: BackupSnippetContentV3,
): SnippetContent {
  return content.kind === 'plain'
    ? createPlainSnippetContent(content.text)
    : { kind: 'rich', blocks: content.blocks.map(toRestoreRichBlockV3) };
}

function toRestoreSnippetEntryV3(entry: BackupSnippetRecordV3): SnippetEntry {
  return {
    id: entry.id,
    title: entry.title,
    content: toRestoreSnippetContentV3(entry.content),
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    trigger: entry.trigger,
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
      const backup: BackupFileV3 = {
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        exportedAt,
        data: {
          knowledge: [...snapshot.knowledge]
            .sort(compareByCreatedAtAndId)
            .map(toBackupKnowledgeRecordV3),
          snippets: [...snapshot.snippets]
            .sort(compareByCreatedAtAndId)
            .map(toBackupSnippetRecordV3),
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

    const backup = parseBackupFile(serialized);
    return {
      backup,
      preview: {
        filename: source.name,
        exportedAt: backup.exportedAt,
        knowledgeCount: backup.data.knowledge.length,
        snippetCount: backup.data.snippets.length,
        defaultModel: backup.data.settings.defaultModel,
        triggerWarning:
          backup.formatVersion === BACKUP_FORMAT_VERSION_1
            ? VERSION_1_TRIGGER_WARNING
            : null,
      },
    };
  }
}

export class BackupRestoreService implements BackupRestoreApplication {
  constructor(
    private readonly restorePort: TransactionalBackupRestorePort,
    private readonly catalogMutationPort?: CatalogMutationPort,
  ) {}

  async restoreBackup(backup: BackupFile): Promise<void> {
    try {
      const restoreData: BackupRestoreData = {
        knowledge: backup.data.knowledge.map(toRestoreKnowledgeEntry),
        snippets:
          backup.formatVersion === BACKUP_FORMAT_VERSION_1
            ? backup.data.snippets.map(toRestoreSnippetEntry)
            : backup.formatVersion === BACKUP_FORMAT_VERSION_2
              ? backup.data.snippets.map(toRestoreSnippetEntryV2)
              : backup.data.snippets.map(toRestoreSnippetEntryV3),
        settings: { defaultModel: backup.data.settings.defaultModel },
      };

      await runCatalogCoordinatedMutation(this.catalogMutationPort, () =>
        this.restorePort.replaceAll(restoreData),
      );
    } catch (error) {
      if (error instanceof CatalogUnavailableAfterMutationError) throw error;
      throw new BackupRestoreError(error);
    }
  }
}
