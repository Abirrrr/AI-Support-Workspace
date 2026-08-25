import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  BACKUP_FORMAT_VERSION_1,
  BACKUP_FORMAT_VERSION_2,
  BACKUP_FORMAT_VERSION_3,
  BACKUP_FORMAT_VERSION_4,
  BACKUP_FORMAT_VERSION_5,
  BACKUP_FORMAT_VERSION_6,
  BACKUP_FORMAT_VERSION_7,
  MAX_BACKUP_V4_BYTES,
  MAX_BACKUP_V5_BYTES,
  MAX_BACKUP_V6_BYTES,
  MAX_BACKUP_V7_BYTES,
  MAX_LEGACY_BACKUP_BYTES,
  MAX_BACKUP_BYTES,
  type BackupFile,
  type BackupFileV7,
  type BackupImportPreview,
  type BackupKnowledgeRecordV3,
  type BackupKnowledgeRecordV5,
  type BackupRichSnippetBlockV3,
  type BackupRichSnippetInlineV3,
  type BackupRichSnippetBlockV4,
  type BackupRichSnippetInlineV4,
  type BackupRichSnippetBlockV5,
  type BackupRichSnippetInlineV5,
  type BackupSnippetContentV3,
  type BackupSnippetContentV5,
  type BackupSnippetAssetRecordV4,
  type BackupSnippetAssetRecordV5,
  type BackupSnippetRecordV1,
  type BackupSnippetRecordV2,
  type BackupSnippetRecordV3,
  type BackupSnippetRecordV4,
  type BackupSnippetRecordV5,
  type BackupSnippetUsageStatsRecordV7,
  type BackupSnippetGeneratedMetadataRecordV7,
} from '../../domain/backup-file';
import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { SnippetEntry } from '../../domain/snippet-entry';
import {
  validateSnippetAsset,
  type SnippetAsset,
} from '../../domain/snippet-asset';
import { validateSnippetAssetGraph } from '../../domain/snippet-asset-graph';
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
import { decodeCanonicalBase64, encodeBlobBase64 } from './base64';
import {
  CatalogUnavailableAfterMutationError,
  runCatalogCoordinatedMutation,
  type CatalogMutationPort,
} from '../snippet/catalog-mutation';
import {
  createSnippetSourceFingerprint,
  validateSnippetGeneratedMetadata,
  type SnippetGeneratedMetadata,
} from '../../domain/snippet-generated-metadata';
import {
  validateSnippetUsageStats,
  type SnippetUsageStats,
} from '../../domain/snippet-usage-stats';

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

function toBackupKnowledgeRecordV5(
  entry: KnowledgeEntry,
): BackupKnowledgeRecordV5 {
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

function toBackupRichInlineV5(
  inline: RichSnippetInline,
): BackupRichSnippetInlineV5 {
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

function toBackupRichBlockV5(
  block: RichSnippetBlock,
): BackupRichSnippetBlockV5 {
  if (block.type === 'paragraph') {
    return {
      type: 'paragraph',
      children: block.children.map(toBackupRichInlineV5),
    };
  }
  if (block.type === 'image') {
    return { type: 'image', assetId: block.assetId, altText: block.altText };
  }
  if (block.type === 'list') {
    return {
      type: 'list',
      listType: block.listType,
      items: block.items.map((item) => ({
        children: item.children.map(toBackupRichInlineV5),
      })),
    };
  }
  return {
    type: 'reference',
    referenceType: 'image',
    label: block.label,
    url: block.url,
  };
}

function toBackupSnippetContentV5(
  content: SnippetContent,
): BackupSnippetContentV5 {
  if (content.kind === 'plain') return { kind: 'plain', text: content.text };
  if (content.kind === 'image') {
    return { kind: 'image', assetId: content.assetId };
  }
  return { kind: 'rich', blocks: content.blocks.map(toBackupRichBlockV5) };
}

function toBackupSnippetRecordV5(entry: SnippetEntry): BackupSnippetRecordV5 {
  return {
    id: entry.id,
    title: entry.title,
    content: toBackupSnippetContentV5(entry.content),
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    trigger: entry.trigger,
  };
}

async function toBackupSnippetAssetRecordV5(
  asset: SnippetAsset,
): Promise<BackupSnippetAssetRecordV5> {
  return {
    id: asset.id,
    snippetId: asset.snippetId,
    mimeType: asset.mimeType,
    byteSize: asset.byteSize,
    originalFilename: asset.originalFilename,
    createdAt: asset.createdAt,
    encoding: 'base64',
    data: await encodeBlobBase64(asset.blob),
  };
}

function toBackupSnippetUsageStatsRecordV7(
  stats: SnippetUsageStats,
): BackupSnippetUsageStatsRecordV7 {
  return validateSnippetUsageStats(stats);
}

function toBackupSnippetGeneratedMetadataRecordV7(
  metadata: SnippetGeneratedMetadata,
): BackupSnippetGeneratedMetadataRecordV7 {
  return validateSnippetGeneratedMetadata(metadata);
}

async function validateGeneratedMetadataFingerprints(
  snippets: readonly SnippetEntry[],
  metadata: readonly SnippetGeneratedMetadata[],
): Promise<void> {
  const snippetById = new Map(snippets.map((snippet) => [snippet.id, snippet]));
  if (
    new Set(metadata.map(({ snippetId }) => snippetId)).size !== metadata.length
  ) {
    throw new TypeError('Generated Snippet metadata ownership is invalid.');
  }
  for (const record of metadata) {
    validateSnippetGeneratedMetadata(record);
    const snippet = snippetById.get(record.snippetId);
    if (
      snippet === undefined ||
      snippet.content.kind === 'image' ||
      (await createSnippetSourceFingerprint(snippet)) !==
        record.sourceFingerprint
    ) {
      throw new TypeError('Generated Snippet metadata fingerprint is invalid.');
    }
  }
}

function validateUsageOwnership(
  snippets: readonly SnippetEntry[],
  usage: readonly SnippetUsageStats[],
): void {
  const snippetIds = new Set(snippets.map(({ id }) => id));
  const usageIds = usage.map(({ snippetId }) => snippetId);
  if (
    new Set(usageIds).size !== usageIds.length ||
    usageIds.some((snippetId) => !snippetIds.has(snippetId))
  ) {
    throw new TypeError('Snippet usage ownership is invalid.');
  }
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

function toRestoreRichInlineV4(
  inline: BackupRichSnippetInlineV4,
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

function toRestoreRichBlockV4(
  block: BackupRichSnippetBlockV4,
): RichSnippetBlock {
  if (block.type === 'paragraph') {
    return {
      type: 'paragraph',
      children: block.children.map(toRestoreRichInlineV4),
    };
  }
  if (block.type === 'image') {
    return { type: 'image', assetId: block.assetId, altText: block.altText };
  }
  return {
    type: 'reference',
    referenceType: 'image',
    label: block.label,
    url: block.url,
  };
}

function toRestoreSnippetEntryV4(entry: BackupSnippetRecordV4): SnippetEntry {
  return {
    id: entry.id,
    title: entry.title,
    content:
      entry.content.kind === 'plain'
        ? createPlainSnippetContent(entry.content.text)
        : {
            kind: 'rich',
            blocks: entry.content.blocks.map(toRestoreRichBlockV4),
          },
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    trigger: entry.trigger,
  };
}

function toRestoreSnippetAssetV4(
  entry: BackupSnippetAssetRecordV4,
): SnippetAsset {
  const bytes = decodeCanonicalBase64(entry.data);
  return {
    id: entry.id,
    snippetId: entry.snippetId,
    mimeType: entry.mimeType,
    blob: new Blob([Uint8Array.from(bytes).buffer], { type: entry.mimeType }),
    byteSize: entry.byteSize,
    originalFilename: entry.originalFilename,
    createdAt: entry.createdAt,
  };
}

function toRestoreRichInlineV5(
  inline: BackupRichSnippetInlineV5,
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

function toRestoreRichBlockV5(
  block: BackupRichSnippetBlockV5,
): RichSnippetBlock {
  if (block.type === 'paragraph') {
    return {
      type: 'paragraph',
      children: block.children.map(toRestoreRichInlineV5),
    };
  }
  if (block.type === 'image') {
    return { type: 'image', assetId: block.assetId, altText: block.altText };
  }
  if (block.type === 'list') {
    return {
      type: 'list',
      listType: block.listType,
      items: block.items.map((item) => ({
        children: item.children.map(toRestoreRichInlineV5),
      })),
    };
  }
  return {
    type: 'reference',
    referenceType: 'image',
    label: block.label,
    url: block.url,
  };
}

function toRestoreSnippetEntryV5(entry: BackupSnippetRecordV5): SnippetEntry {
  let content: SnippetContent;
  if (entry.content.kind === 'plain') {
    content = createPlainSnippetContent(entry.content.text);
  } else if (entry.content.kind === 'image') {
    content = { kind: 'image', assetId: entry.content.assetId };
  } else {
    content = {
      kind: 'rich',
      blocks: entry.content.blocks.map(toRestoreRichBlockV5),
    };
  }
  return {
    id: entry.id,
    title: entry.title,
    content,
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    trigger: entry.trigger,
  };
}

function toRestoreSnippetAssetV5(
  entry: BackupSnippetAssetRecordV5,
): SnippetAsset {
  const bytes = decodeCanonicalBase64(entry.data);
  return {
    id: entry.id,
    snippetId: entry.snippetId,
    mimeType: entry.mimeType,
    blob: new Blob([Uint8Array.from(bytes).buffer], { type: entry.mimeType }),
    byteSize: entry.byteSize,
    originalFilename: entry.originalFilename,
    createdAt: entry.createdAt,
  };
}

export function createBackupFilename(exportedAt: string): string {
  const withoutMilliseconds = exportedAt.replace(/\.\d{3}Z$/, 'Z');
  return `ai-support-workspace-backup-${withoutMilliseconds.replaceAll(':', '-')}.json`;
}

export function measureUtf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function assertBackupFitsByteLimit(
  serialized: string,
  maxBytes: number = MAX_BACKUP_V7_BYTES,
): void {
  if (measureUtf8Bytes(serialized) > maxBytes) {
    throw new BackupExportError('too-large');
  }
}

export interface CanonicalBackupV7 {
  readonly backup: BackupFileV7;
  readonly serialized: string;
  readonly byteLength: number;
}

export type BackupV7CreationOptions =
  | {
      readonly creationMode: 'manual';
    }
  | {
      readonly creationMode: 'automatic';
      readonly backupSetId: string;
    };

export class BackupV7CreationService {
  constructor(
    private readonly snapshotReader: BackupSnapshotReader,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async create(options: BackupV7CreationOptions): Promise<CanonicalBackupV7> {
    const snapshot = await this.snapshotReader.readSnapshot();
    const exportedAt = this.now().toISOString();
    const snapshotAssets = snapshot.snippetAssets;
    await Promise.all(snapshotAssets.map(validateSnippetAsset));
    validateSnippetAssetGraph(snapshot.snippets, snapshotAssets);
    validateUsageOwnership(snapshot.snippets, snapshot.snippetUsageStats);
    const sortedAssets = [...snapshotAssets].sort(compareByCreatedAtAndId);
    await validateGeneratedMetadataFingerprints(
      snapshot.snippets,
      snapshot.snippetGeneratedMetadata,
    );
    const backup: BackupFileV7 = {
      format: BACKUP_FORMAT,
      formatVersion: BACKUP_FORMAT_VERSION,
      exportedAt,
      backupId: this.createId(),
      creationMode: options.creationMode,
      ...(options.creationMode === 'automatic'
        ? { backupSetId: options.backupSetId }
        : {}),
      data: {
        knowledge: [...snapshot.knowledge]
          .sort(compareByCreatedAtAndId)
          .map(toBackupKnowledgeRecordV5),
        snippets: [...snapshot.snippets]
          .sort(compareByCreatedAtAndId)
          .map(toBackupSnippetRecordV5),
        snippetAssets: await Promise.all(
          sortedAssets.map(toBackupSnippetAssetRecordV5),
        ),
        snippetUsageStats: [...snapshot.snippetUsageStats]
          .sort((left, right) => left.snippetId.localeCompare(right.snippetId))
          .map(toBackupSnippetUsageStatsRecordV7),
        snippetGeneratedMetadata: [...snapshot.snippetGeneratedMetadata]
          .sort((left, right) => left.snippetId.localeCompare(right.snippetId))
          .map(toBackupSnippetGeneratedMetadataRecordV7),
        settings: {
          defaultModel: snapshot.settings.defaultModel,
          snippetPasteMode: snapshot.settings.snippetPasteMode,
          automaticBackupCadence: snapshot.settings.automaticBackupCadence,
        },
      },
    };
    const serialized = JSON.stringify(backup);
    assertBackupFitsByteLimit(serialized);
    const validated = parseBackupFile(serialized);
    if (validated.formatVersion !== BACKUP_FORMAT_VERSION_7) {
      throw new BackupExportError('failure');
    }
    return {
      backup: validated,
      serialized,
      byteLength: measureUtf8Bytes(serialized),
    };
  }
}

export class BackupExportService implements BackupExportApplication {
  constructor(
    private readonly snapshotReader: BackupSnapshotReader,
    private readonly downloadPort: BackupDownloadPort,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async exportBackup(): Promise<void> {
    try {
      const created = await new BackupV7CreationService(
        this.snapshotReader,
        this.now,
        this.createId,
      ).create({ creationMode: 'manual' });
      await this.downloadPort.download(
        created.serialized,
        createBackupFilename(created.backup.exportedAt),
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
    const versionLimit =
      backup.formatVersion === BACKUP_FORMAT_VERSION_4 ||
      backup.formatVersion === BACKUP_FORMAT_VERSION_5 ||
      backup.formatVersion === BACKUP_FORMAT_VERSION_6 ||
      backup.formatVersion === BACKUP_FORMAT_VERSION_7
        ? backup.formatVersion === BACKUP_FORMAT_VERSION_7
          ? MAX_BACKUP_V7_BYTES
          : backup.formatVersion === BACKUP_FORMAT_VERSION_6
            ? MAX_BACKUP_V6_BYTES
            : backup.formatVersion === BACKUP_FORMAT_VERSION_5
              ? MAX_BACKUP_V5_BYTES
              : MAX_BACKUP_V4_BYTES
        : MAX_LEGACY_BACKUP_BYTES;
    if (measureUtf8Bytes(serialized) > versionLimit) {
      throw new BackupImportError('too-large');
    }
    if (backup.formatVersion === BACKUP_FORMAT_VERSION_7) {
      const snippets = backup.data.snippets.map(toRestoreSnippetEntryV5);
      try {
        await validateGeneratedMetadataFingerprints(
          snippets,
          backup.data.snippetGeneratedMetadata,
        );
      } catch (error) {
        throw new BackupImportError('invalid', error);
      }
    }
    return {
      backup,
      preview: {
        filename: source.name,
        formatVersion: backup.formatVersion,
        exportedAt: backup.exportedAt,
        knowledgeCount: backup.data.knowledge.length,
        snippetCount: backup.data.snippets.length,
        assetCount:
          backup.formatVersion === BACKUP_FORMAT_VERSION_4 ||
          backup.formatVersion === BACKUP_FORMAT_VERSION_5 ||
          backup.formatVersion === BACKUP_FORMAT_VERSION_6 ||
          backup.formatVersion === BACKUP_FORMAT_VERSION_7
            ? backup.data.snippetAssets.length
            : 0,
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
      if (backup.formatVersion === BACKUP_FORMAT_VERSION_7) {
        const snippets = backup.data.snippets.map(toRestoreSnippetEntryV5);
        const usage = backup.data.snippetUsageStats.map(
          validateSnippetUsageStats,
        );
        validateUsageOwnership(snippets, usage);
        await validateGeneratedMetadataFingerprints(
          snippets,
          backup.data.snippetGeneratedMetadata,
        );
      }
      const restoreData: BackupRestoreData = {
        knowledge: backup.data.knowledge.map(toRestoreKnowledgeEntry),
        snippets:
          backup.formatVersion === BACKUP_FORMAT_VERSION_1
            ? backup.data.snippets.map(toRestoreSnippetEntry)
            : backup.formatVersion === BACKUP_FORMAT_VERSION_2
              ? backup.data.snippets.map(toRestoreSnippetEntryV2)
              : backup.formatVersion === BACKUP_FORMAT_VERSION_3
                ? backup.data.snippets.map(toRestoreSnippetEntryV3)
                : backup.formatVersion === BACKUP_FORMAT_VERSION_4
                  ? backup.data.snippets.map(toRestoreSnippetEntryV4)
                  : backup.data.snippets.map(toRestoreSnippetEntryV5),
        snippetAssets:
          backup.formatVersion === BACKUP_FORMAT_VERSION_4
            ? backup.data.snippetAssets.map(toRestoreSnippetAssetV4)
            : backup.formatVersion === BACKUP_FORMAT_VERSION_5
              ? backup.data.snippetAssets.map(toRestoreSnippetAssetV5)
              : backup.formatVersion === BACKUP_FORMAT_VERSION_6
                ? backup.data.snippetAssets.map(toRestoreSnippetAssetV5)
                : backup.formatVersion === BACKUP_FORMAT_VERSION_7
                  ? backup.data.snippetAssets.map(toRestoreSnippetAssetV5)
                  : [],
        settings: {
          defaultModel: backup.data.settings.defaultModel,
          snippetPasteMode:
            backup.formatVersion === BACKUP_FORMAT_VERSION_6
              ? backup.data.settings.snippetPasteMode
              : backup.formatVersion === BACKUP_FORMAT_VERSION_7
                ? backup.data.settings.snippetPasteMode
                : 'clipboard-only',
          automaticBackupCadence:
            backup.formatVersion === BACKUP_FORMAT_VERSION_7
              ? backup.data.settings.automaticBackupCadence
              : 'weekly',
        },
        snippetUsageStats:
          backup.formatVersion === BACKUP_FORMAT_VERSION_7
            ? backup.data.snippetUsageStats.map(validateSnippetUsageStats)
            : [],
        snippetGeneratedMetadata:
          backup.formatVersion === BACKUP_FORMAT_VERSION_7
            ? backup.data.snippetGeneratedMetadata.map(
                validateSnippetGeneratedMetadata,
              )
            : [],
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
