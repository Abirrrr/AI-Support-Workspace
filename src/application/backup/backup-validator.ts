import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION_1,
  BACKUP_FORMAT_VERSION_2,
  BACKUP_FORMAT_VERSION_3,
  BACKUP_FORMAT_VERSION_4,
  BACKUP_FORMAT_VERSION_5,
  BACKUP_FORMAT_VERSION_6,
  type BackupFile,
  type BackupFileV1,
  type BackupFileV2,
  type BackupFileV3,
  type BackupFileV4,
  type BackupFileV5,
  type BackupFileV6,
  type BackupKnowledgeRecordV1,
  type BackupKnowledgeRecordV2,
  type BackupKnowledgeRecordV3,
  type BackupKnowledgeRecordV4,
  type BackupKnowledgeRecordV5,
  type BackupRichSnippetBlockV3,
  type BackupRichSnippetInlineV3,
  type BackupRichSnippetBlockV4,
  type BackupRichSnippetBlockV5,
  type BackupRichSnippetInlineV5,
  type BackupSettingsV1,
  type BackupSettingsV2,
  type BackupSettingsV3,
  type BackupSettingsV4,
  type BackupSettingsV5,
  type BackupSettingsV6,
  type BackupSnippetContentV3,
  type BackupSnippetContentV4,
  type BackupSnippetContentV5,
  type BackupSnippetAssetRecordV4,
  type BackupSnippetAssetRecordV5,
  type BackupSnippetRecordV1,
  type BackupSnippetRecordV2,
  type BackupSnippetRecordV3,
  type BackupSnippetRecordV4,
  type BackupSnippetRecordV5,
} from '../../domain/backup-file';
import {
  isSafeSnippetImageUrl,
  isSafeSnippetLinkUrl,
} from '../../domain/snippet-content';
import {
  hasSnippetAssetSignature,
  isSnippetAssetMimeType,
  MAX_SNIPPET_ASSET_BYTES,
} from '../../domain/snippet-asset';
import {
  SnippetAssetGraphError,
  validateSnippetAssetGraph,
} from '../../domain/snippet-asset-graph';
import { isCanonicalSnippetTrigger } from '../snippet/snippet-trigger';
import { BackupImportError } from './backup-errors';
import { decodeCanonicalBase64 } from './base64';

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(record: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(record).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function containsDangerousKey(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) return true;
    if (containsDangerousKey((value as Record<string, unknown>)[key])) {
      return true;
    }
  }
  return false;
}

function isCanonicalUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value);
}

function isUtcIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function validateKnowledgeV1(
  value: unknown,
): BackupKnowledgeRecordV1 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'id',
      'title',
      'body',
      'tags',
      'createdAt',
      'updatedAt',
      'source',
    ]) ||
    !isCanonicalUuid(value.id) ||
    typeof value.title !== 'string' ||
    typeof value.body !== 'string' ||
    !isStringArray(value.tags) ||
    !isUtcIsoTimestamp(value.createdAt) ||
    !isUtcIsoTimestamp(value.updatedAt) ||
    typeof value.source !== 'string'
  ) {
    return undefined;
  }
  return {
    id: value.id,
    title: value.title,
    body: value.body,
    tags: [...value.tags],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    source: value.source,
  };
}

function validateKnowledgeV2(
  value: unknown,
): BackupKnowledgeRecordV2 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'id',
      'title',
      'body',
      'tags',
      'createdAt',
      'updatedAt',
      'source',
    ]) ||
    !isCanonicalUuid(value.id) ||
    typeof value.title !== 'string' ||
    typeof value.body !== 'string' ||
    !isStringArray(value.tags) ||
    !isUtcIsoTimestamp(value.createdAt) ||
    !isUtcIsoTimestamp(value.updatedAt) ||
    typeof value.source !== 'string'
  ) {
    return undefined;
  }
  return {
    id: value.id,
    title: value.title,
    body: value.body,
    tags: [...value.tags],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    source: value.source,
  };
}

function validateKnowledgeV3(
  value: unknown,
): BackupKnowledgeRecordV3 | undefined {
  const validated = validateKnowledgeV2(value);
  return validated === undefined
    ? undefined
    : {
        id: validated.id,
        title: validated.title,
        body: validated.body,
        tags: [...validated.tags],
        createdAt: validated.createdAt,
        updatedAt: validated.updatedAt,
        source: validated.source,
      };
}

function validateKnowledgeV4(
  value: unknown,
): BackupKnowledgeRecordV4 | undefined {
  const validated = validateKnowledgeV3(value);
  return validated === undefined
    ? undefined
    : {
        id: validated.id,
        title: validated.title,
        body: validated.body,
        tags: [...validated.tags],
        createdAt: validated.createdAt,
        updatedAt: validated.updatedAt,
        source: validated.source,
      };
}

function validateKnowledgeV5(
  value: unknown,
): BackupKnowledgeRecordV5 | undefined {
  const validated = validateKnowledgeV4(value);
  return validated === undefined
    ? undefined
    : {
        id: validated.id,
        title: validated.title,
        body: validated.body,
        tags: [...validated.tags],
        createdAt: validated.createdAt,
        updatedAt: validated.updatedAt,
        source: validated.source,
      };
}

function validateSnippetV1(value: unknown): BackupSnippetRecordV1 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'id',
      'title',
      'content',
      'tags',
      'createdAt',
      'updatedAt',
    ]) ||
    !isCanonicalUuid(value.id) ||
    typeof value.title !== 'string' ||
    typeof value.content !== 'string' ||
    !isStringArray(value.tags) ||
    !isUtcIsoTimestamp(value.createdAt) ||
    !isUtcIsoTimestamp(value.updatedAt)
  ) {
    return undefined;
  }
  return {
    id: value.id,
    title: value.title,
    content: value.content,
    tags: [...value.tags],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function validateSnippetV2(value: unknown): BackupSnippetRecordV2 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'id',
      'title',
      'content',
      'tags',
      'createdAt',
      'updatedAt',
      'trigger',
    ]) ||
    !isCanonicalUuid(value.id) ||
    typeof value.title !== 'string' ||
    typeof value.content !== 'string' ||
    !isStringArray(value.tags) ||
    !isUtcIsoTimestamp(value.createdAt) ||
    !isUtcIsoTimestamp(value.updatedAt) ||
    (value.trigger !== null && !isCanonicalSnippetTrigger(value.trigger))
  ) {
    return undefined;
  }
  return {
    id: value.id,
    title: value.title,
    content: value.content,
    tags: [...value.tags],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    trigger: value.trigger,
  };
}

function validateRichInlineV3(
  value: unknown,
): BackupRichSnippetInlineV3 | undefined {
  if (!isRecord(value) || typeof value.type !== 'string') return undefined;
  if (
    value.type === 'text' &&
    hasExactKeys(value, ['type', 'text', 'bold', 'italic']) &&
    typeof value.text === 'string' &&
    typeof value.bold === 'boolean' &&
    typeof value.italic === 'boolean'
  ) {
    return {
      type: 'text',
      text: value.text,
      bold: value.bold,
      italic: value.italic,
    };
  }
  if (
    value.type === 'link' &&
    hasExactKeys(value, ['type', 'text', 'url', 'bold', 'italic']) &&
    typeof value.text === 'string' &&
    typeof value.url === 'string' &&
    typeof value.bold === 'boolean' &&
    typeof value.italic === 'boolean' &&
    isSafeSnippetLinkUrl(value.url)
  ) {
    return {
      type: 'link',
      text: value.text,
      url: value.url,
      bold: value.bold,
      italic: value.italic,
    };
  }
  return undefined;
}

function validateRichBlockV3(
  value: unknown,
): BackupRichSnippetBlockV3 | undefined {
  if (!isRecord(value) || typeof value.type !== 'string') return undefined;
  if (
    value.type === 'paragraph' &&
    hasExactKeys(value, ['type', 'children']) &&
    Array.isArray(value.children)
  ) {
    const children = value.children.map(validateRichInlineV3);
    if (children.some((child) => child === undefined)) return undefined;
    return {
      type: 'paragraph',
      children: children as BackupRichSnippetInlineV3[],
    };
  }
  if (
    value.type === 'reference' &&
    hasExactKeys(value, ['type', 'referenceType', 'label', 'url']) &&
    value.referenceType === 'image' &&
    typeof value.label === 'string' &&
    typeof value.url === 'string' &&
    isSafeSnippetImageUrl(value.url)
  ) {
    return {
      type: 'reference',
      referenceType: 'image',
      label: value.label,
      url: value.url,
    };
  }
  return undefined;
}

function validateSnippetContentV3(
  value: unknown,
): BackupSnippetContentV3 | undefined {
  if (!isRecord(value) || typeof value.kind !== 'string') return undefined;
  if (
    value.kind === 'plain' &&
    hasExactKeys(value, ['kind', 'text']) &&
    typeof value.text === 'string'
  ) {
    return { kind: 'plain', text: value.text };
  }
  if (
    value.kind === 'rich' &&
    hasExactKeys(value, ['kind', 'blocks']) &&
    Array.isArray(value.blocks)
  ) {
    const blocks = value.blocks.map(validateRichBlockV3);
    if (blocks.some((block) => block === undefined)) return undefined;
    return {
      kind: 'rich',
      blocks: blocks as BackupRichSnippetBlockV3[],
    };
  }
  return undefined;
}

function validateSnippetV3(value: unknown): BackupSnippetRecordV3 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'id',
      'title',
      'content',
      'tags',
      'createdAt',
      'updatedAt',
      'trigger',
    ]) ||
    !isCanonicalUuid(value.id) ||
    typeof value.title !== 'string' ||
    !isStringArray(value.tags) ||
    !isUtcIsoTimestamp(value.createdAt) ||
    !isUtcIsoTimestamp(value.updatedAt) ||
    (value.trigger !== null && !isCanonicalSnippetTrigger(value.trigger))
  ) {
    return undefined;
  }
  const content = validateSnippetContentV3(value.content);
  if (content === undefined) return undefined;
  return {
    id: value.id,
    title: value.title,
    content,
    tags: [...value.tags],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    trigger: value.trigger,
  };
}

function validateRichBlockV4(
  value: unknown,
): BackupRichSnippetBlockV4 | undefined {
  if (!isRecord(value) || typeof value.type !== 'string') return undefined;
  if (
    value.type === 'image' &&
    hasExactKeys(value, ['type', 'assetId', 'altText']) &&
    isCanonicalUuid(value.assetId) &&
    typeof value.altText === 'string'
  ) {
    return { type: 'image', assetId: value.assetId, altText: value.altText };
  }
  const validated = validateRichBlockV3(value);
  if (validated === undefined) return undefined;
  return validated.type === 'paragraph'
    ? {
        type: 'paragraph',
        children: validated.children.map((inline) =>
          inline.type === 'text'
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
              },
        ),
      }
    : {
        type: 'reference',
        referenceType: 'image',
        label: validated.label,
        url: validated.url,
      };
}

function validateSnippetContentV4(
  value: unknown,
): BackupSnippetContentV4 | undefined {
  if (!isRecord(value) || typeof value.kind !== 'string') return undefined;
  if (
    value.kind === 'plain' &&
    hasExactKeys(value, ['kind', 'text']) &&
    typeof value.text === 'string'
  ) {
    return { kind: 'plain', text: value.text };
  }
  if (
    value.kind === 'rich' &&
    hasExactKeys(value, ['kind', 'blocks']) &&
    Array.isArray(value.blocks)
  ) {
    const blocks = value.blocks.map(validateRichBlockV4);
    if (blocks.some((block) => block === undefined)) return undefined;
    return {
      kind: 'rich',
      blocks: blocks as BackupRichSnippetBlockV4[],
    };
  }
  return undefined;
}

function validateSnippetV4(value: unknown): BackupSnippetRecordV4 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'id',
      'title',
      'content',
      'tags',
      'createdAt',
      'updatedAt',
      'trigger',
    ]) ||
    !isCanonicalUuid(value.id) ||
    typeof value.title !== 'string' ||
    !isStringArray(value.tags) ||
    !isUtcIsoTimestamp(value.createdAt) ||
    !isUtcIsoTimestamp(value.updatedAt) ||
    (value.trigger !== null && !isCanonicalSnippetTrigger(value.trigger))
  ) {
    return undefined;
  }
  const content = validateSnippetContentV4(value.content);
  if (content === undefined) return undefined;
  return {
    id: value.id,
    title: value.title,
    content,
    tags: [...value.tags],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    trigger: value.trigger,
  };
}

function validateRichInlineV5(
  value: unknown,
): BackupRichSnippetInlineV5 | undefined {
  const validated = validateRichInlineV3(value);
  if (validated === undefined) return undefined;
  return validated.type === 'text'
    ? {
        type: 'text',
        text: validated.text,
        bold: validated.bold,
        italic: validated.italic,
      }
    : {
        type: 'link',
        text: validated.text,
        url: validated.url,
        bold: validated.bold,
        italic: validated.italic,
      };
}

function validateRichBlockV5(
  value: unknown,
): BackupRichSnippetBlockV5 | undefined {
  if (!isRecord(value) || typeof value.type !== 'string') return undefined;
  if (
    value.type === 'list' &&
    hasExactKeys(value, ['type', 'listType', 'items']) &&
    (value.listType === 'unordered' || value.listType === 'ordered') &&
    Array.isArray(value.items)
  ) {
    const items = value.items.map((item) => {
      if (
        !isRecord(item) ||
        !hasExactKeys(item, ['children']) ||
        !Array.isArray(item.children)
      ) {
        return undefined;
      }
      const children = item.children.map(validateRichInlineV5);
      return children.some((child) => child === undefined)
        ? undefined
        : { children: children as BackupRichSnippetInlineV5[] };
    });
    if (items.some((item) => item === undefined)) return undefined;
    return {
      type: 'list',
      listType: value.listType,
      items: items as { children: BackupRichSnippetInlineV5[] }[],
    };
  }
  if (
    value.type === 'paragraph' &&
    hasExactKeys(value, ['type', 'children']) &&
    Array.isArray(value.children)
  ) {
    const children = value.children.map(validateRichInlineV5);
    if (children.some((child) => child === undefined)) return undefined;
    return {
      type: 'paragraph',
      children: children as BackupRichSnippetInlineV5[],
    };
  }
  if (
    value.type === 'image' &&
    hasExactKeys(value, ['type', 'assetId', 'altText']) &&
    isCanonicalUuid(value.assetId) &&
    typeof value.altText === 'string'
  ) {
    return {
      type: 'image',
      assetId: value.assetId,
      altText: value.altText,
    };
  }
  if (
    value.type === 'reference' &&
    hasExactKeys(value, ['type', 'referenceType', 'label', 'url']) &&
    value.referenceType === 'image' &&
    typeof value.label === 'string' &&
    typeof value.url === 'string' &&
    isSafeSnippetImageUrl(value.url)
  ) {
    return {
      type: 'reference',
      referenceType: 'image',
      label: value.label,
      url: value.url,
    };
  }
  return undefined;
}

function validateSnippetContentV5(
  value: unknown,
): BackupSnippetContentV5 | undefined {
  if (!isRecord(value) || typeof value.kind !== 'string') return undefined;
  if (
    value.kind === 'plain' &&
    hasExactKeys(value, ['kind', 'text']) &&
    typeof value.text === 'string'
  ) {
    return { kind: 'plain', text: value.text };
  }
  if (
    value.kind === 'image' &&
    hasExactKeys(value, ['kind', 'assetId']) &&
    isCanonicalUuid(value.assetId)
  ) {
    return { kind: 'image', assetId: value.assetId };
  }
  if (
    value.kind === 'rich' &&
    hasExactKeys(value, ['kind', 'blocks']) &&
    Array.isArray(value.blocks)
  ) {
    const blocks = value.blocks.map(validateRichBlockV5);
    if (blocks.some((block) => block === undefined)) return undefined;
    return {
      kind: 'rich',
      blocks: blocks as BackupRichSnippetBlockV5[],
    };
  }
  return undefined;
}

function validateSnippetV5(value: unknown): BackupSnippetRecordV5 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'id',
      'title',
      'content',
      'tags',
      'createdAt',
      'updatedAt',
      'trigger',
    ]) ||
    !isCanonicalUuid(value.id) ||
    typeof value.title !== 'string' ||
    !isStringArray(value.tags) ||
    !isUtcIsoTimestamp(value.createdAt) ||
    !isUtcIsoTimestamp(value.updatedAt) ||
    (value.trigger !== null && !isCanonicalSnippetTrigger(value.trigger))
  ) {
    return undefined;
  }
  const content = validateSnippetContentV5(value.content);
  if (content === undefined) return undefined;
  return {
    id: value.id,
    title: value.title,
    content,
    tags: [...value.tags],
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    trigger: value.trigger,
  };
}

function validateSnippetAssetV4(
  value: unknown,
): BackupSnippetAssetRecordV4 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'id',
      'snippetId',
      'mimeType',
      'byteSize',
      'originalFilename',
      'createdAt',
      'encoding',
      'data',
    ]) ||
    !isCanonicalUuid(value.id) ||
    !isCanonicalUuid(value.snippetId) ||
    !isSnippetAssetMimeType(value.mimeType) ||
    !Number.isSafeInteger(value.byteSize) ||
    (value.byteSize as number) < 0 ||
    (value.byteSize as number) > MAX_SNIPPET_ASSET_BYTES ||
    (value.originalFilename !== null &&
      typeof value.originalFilename !== 'string') ||
    !isUtcIsoTimestamp(value.createdAt) ||
    value.encoding !== 'base64' ||
    typeof value.data !== 'string'
  ) {
    return undefined;
  }
  try {
    const bytes = decodeCanonicalBase64(value.data);
    if (
      bytes.byteLength !== value.byteSize ||
      !hasSnippetAssetSignature(value.mimeType, bytes)
    ) {
      return undefined;
    }
  } catch {
    return undefined;
  }
  return {
    id: value.id,
    snippetId: value.snippetId,
    mimeType: value.mimeType,
    byteSize: value.byteSize,
    originalFilename: value.originalFilename,
    createdAt: value.createdAt,
    encoding: 'base64',
    data: value.data,
  };
}

function validateSnippetAssetV5(
  value: unknown,
): BackupSnippetAssetRecordV5 | undefined {
  const validated = validateSnippetAssetV4(value);
  return validated === undefined
    ? undefined
    : {
        id: validated.id,
        snippetId: validated.snippetId,
        mimeType: validated.mimeType,
        byteSize: validated.byteSize,
        originalFilename: validated.originalFilename,
        createdAt: validated.createdAt,
        encoding: 'base64',
        data: validated.data,
      };
}

function validateSettingsV1(value: unknown): BackupSettingsV1 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['defaultModel']) ||
    (value.defaultModel !== null && typeof value.defaultModel !== 'string')
  ) {
    return undefined;
  }
  return { defaultModel: value.defaultModel };
}

function validateSettingsV2(value: unknown): BackupSettingsV2 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['defaultModel']) ||
    (value.defaultModel !== null && typeof value.defaultModel !== 'string')
  ) {
    return undefined;
  }
  return { defaultModel: value.defaultModel };
}

function validateSettingsV3(value: unknown): BackupSettingsV3 | undefined {
  const validated = validateSettingsV2(value);
  return validated === undefined
    ? undefined
    : { defaultModel: validated.defaultModel };
}

function validateSettingsV4(value: unknown): BackupSettingsV4 | undefined {
  const validated = validateSettingsV3(value);
  return validated === undefined
    ? undefined
    : { defaultModel: validated.defaultModel };
}

function validateSettingsV5(value: unknown): BackupSettingsV5 | undefined {
  const validated = validateSettingsV4(value);
  return validated === undefined
    ? undefined
    : { defaultModel: validated.defaultModel };
}

function validateSettingsV6(value: unknown): BackupSettingsV6 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['defaultModel', 'snippetPasteMode']) ||
    (value.defaultModel !== null && typeof value.defaultModel !== 'string') ||
    (value.snippetPasteMode !== 'clipboard-only' &&
      value.snippetPasteMode !== 'automatic')
  ) {
    return undefined;
  }
  return {
    defaultModel: value.defaultModel,
    snippetPasteMode: value.snippetPasteMode,
  };
}

function hasDuplicateIds(records: readonly { id: string }[]): boolean {
  return new Set(records.map(({ id }) => id)).size !== records.length;
}

function hasDuplicateTriggers(
  records: readonly { readonly trigger: string | null }[],
): boolean {
  const triggers = records.flatMap(({ trigger }) =>
    trigger === null ? [] : [trigger],
  );
  return new Set(triggers).size !== triggers.length;
}

function parseVersion3(parsed: Record<string, unknown>): BackupFileV3 {
  validateEnvelope(parsed);
  const data = parsed.data as Record<string, unknown>;
  const knowledge = (data.knowledge as unknown[]).map(validateKnowledgeV3);
  const snippets = (data.snippets as unknown[]).map(validateSnippetV3);
  const settings = validateSettingsV3(data.settings);
  if (
    knowledge.some((entry) => entry === undefined) ||
    snippets.some((entry) => entry === undefined) ||
    settings === undefined
  ) {
    throw new BackupImportError('invalid');
  }
  const trustedKnowledge = knowledge as BackupKnowledgeRecordV3[];
  const trustedSnippets = snippets as BackupSnippetRecordV3[];
  if (
    hasDuplicateIds(trustedKnowledge) ||
    hasDuplicateIds(trustedSnippets) ||
    hasDuplicateTriggers(trustedSnippets)
  ) {
    throw new BackupImportError('invalid');
  }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_3,
    exportedAt: parsed.exportedAt as string,
    data: { knowledge: trustedKnowledge, snippets: trustedSnippets, settings },
  };
}

function parseVersion4(parsed: Record<string, unknown>): BackupFileV4 {
  validateEnvelope(parsed, [
    'knowledge',
    'snippets',
    'snippetAssets',
    'settings',
  ]);
  const data = parsed.data as Record<string, unknown>;
  if (!Array.isArray(data.snippetAssets)) {
    throw new BackupImportError('invalid');
  }
  const knowledge = (data.knowledge as unknown[]).map(validateKnowledgeV4);
  const snippets = (data.snippets as unknown[]).map(validateSnippetV4);
  const snippetAssets = data.snippetAssets.map(validateSnippetAssetV4);
  const settings = validateSettingsV4(data.settings);
  if (
    knowledge.some((entry) => entry === undefined) ||
    snippets.some((entry) => entry === undefined) ||
    snippetAssets.some((entry) => entry === undefined) ||
    settings === undefined
  ) {
    throw new BackupImportError('invalid');
  }
  const trustedKnowledge = knowledge as BackupKnowledgeRecordV4[];
  const trustedSnippets = snippets as BackupSnippetRecordV4[];
  const trustedAssets = snippetAssets as BackupSnippetAssetRecordV4[];
  if (
    hasDuplicateIds(trustedKnowledge) ||
    hasDuplicateIds(trustedSnippets) ||
    hasDuplicateTriggers(trustedSnippets)
  ) {
    throw new BackupImportError('invalid');
  }
  try {
    validateSnippetAssetGraph(trustedSnippets, trustedAssets);
  } catch (error) {
    if (error instanceof SnippetAssetGraphError) {
      throw new BackupImportError('invalid', error);
    }
    throw error;
  }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_4,
    exportedAt: parsed.exportedAt as string,
    data: {
      knowledge: trustedKnowledge,
      snippets: trustedSnippets,
      snippetAssets: trustedAssets,
      settings,
    },
  };
}

function parseVersion5(parsed: Record<string, unknown>): BackupFileV5 {
  validateEnvelope(parsed, [
    'knowledge',
    'snippets',
    'snippetAssets',
    'settings',
  ]);
  const data = parsed.data as Record<string, unknown>;
  if (!Array.isArray(data.snippetAssets)) {
    throw new BackupImportError('invalid');
  }
  const knowledge = (data.knowledge as unknown[]).map(validateKnowledgeV5);
  const snippets = (data.snippets as unknown[]).map(validateSnippetV5);
  const snippetAssets = data.snippetAssets.map(validateSnippetAssetV5);
  const settings = validateSettingsV5(data.settings);
  if (
    knowledge.some((entry) => entry === undefined) ||
    snippets.some((entry) => entry === undefined) ||
    snippetAssets.some((entry) => entry === undefined) ||
    settings === undefined
  ) {
    throw new BackupImportError('invalid');
  }
  const trustedKnowledge = knowledge as BackupKnowledgeRecordV5[];
  const trustedSnippets = snippets as BackupSnippetRecordV5[];
  const trustedAssets = snippetAssets as BackupSnippetAssetRecordV5[];
  if (
    hasDuplicateIds(trustedKnowledge) ||
    hasDuplicateIds(trustedSnippets) ||
    hasDuplicateTriggers(trustedSnippets)
  ) {
    throw new BackupImportError('invalid');
  }
  try {
    validateSnippetAssetGraph(trustedSnippets, trustedAssets);
  } catch (error) {
    if (error instanceof SnippetAssetGraphError) {
      throw new BackupImportError('invalid', error);
    }
    throw error;
  }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_5,
    exportedAt: parsed.exportedAt as string,
    data: {
      knowledge: trustedKnowledge,
      snippets: trustedSnippets,
      snippetAssets: trustedAssets,
      settings,
    },
  };
}

function parseVersion6(parsed: Record<string, unknown>): BackupFileV6 {
  validateEnvelope(parsed, [
    'knowledge',
    'snippets',
    'snippetAssets',
    'settings',
  ]);
  const data = parsed.data as Record<string, unknown>;
  if (!Array.isArray(data.snippetAssets)) {
    throw new BackupImportError('invalid');
  }
  const knowledge = (data.knowledge as unknown[]).map(validateKnowledgeV5);
  const snippets = (data.snippets as unknown[]).map(validateSnippetV5);
  const snippetAssets = data.snippetAssets.map(validateSnippetAssetV5);
  const settings = validateSettingsV6(data.settings);
  if (
    knowledge.some((entry) => entry === undefined) ||
    snippets.some((entry) => entry === undefined) ||
    snippetAssets.some((entry) => entry === undefined) ||
    settings === undefined
  ) {
    throw new BackupImportError('invalid');
  }
  const trustedKnowledge = knowledge as BackupKnowledgeRecordV5[];
  const trustedSnippets = snippets as BackupSnippetRecordV5[];
  const trustedAssets = snippetAssets as BackupSnippetAssetRecordV5[];
  if (
    hasDuplicateIds(trustedKnowledge) ||
    hasDuplicateIds(trustedSnippets) ||
    hasDuplicateTriggers(trustedSnippets)
  ) {
    throw new BackupImportError('invalid');
  }
  try {
    validateSnippetAssetGraph(trustedSnippets, trustedAssets);
  } catch (error) {
    if (error instanceof SnippetAssetGraphError) {
      throw new BackupImportError('invalid', error);
    }
    throw error;
  }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_6,
    exportedAt: parsed.exportedAt as string,
    data: {
      knowledge: trustedKnowledge,
      snippets: trustedSnippets,
      snippetAssets: trustedAssets,
      settings,
    },
  };
}

function parseJson(serialized: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new BackupImportError('invalid', error);
  }
  if (containsDangerousKey(parsed) || !isRecord(parsed)) {
    throw new BackupImportError('invalid');
  }
  return parsed;
}

function validateEnvelope(
  parsed: Record<string, unknown>,
  dataKeys: readonly string[] = ['knowledge', 'snippets', 'settings'],
) {
  if (
    !hasExactKeys(parsed, ['format', 'formatVersion', 'exportedAt', 'data']) ||
    parsed.format !== BACKUP_FORMAT ||
    !isUtcIsoTimestamp(parsed.exportedAt) ||
    !isRecord(parsed.data) ||
    !hasExactKeys(parsed.data, [...dataKeys]) ||
    !Array.isArray(parsed.data.knowledge) ||
    !Array.isArray(parsed.data.snippets)
  ) {
    throw new BackupImportError('invalid');
  }
}

function parseVersion1(parsed: Record<string, unknown>): BackupFileV1 {
  validateEnvelope(parsed);
  const data = parsed.data as Record<string, unknown>;
  const knowledge = (data.knowledge as unknown[]).map(validateKnowledgeV1);
  const snippets = (data.snippets as unknown[]).map(validateSnippetV1);
  const settings = validateSettingsV1(data.settings);
  if (
    knowledge.some((entry) => entry === undefined) ||
    snippets.some((entry) => entry === undefined) ||
    settings === undefined
  ) {
    throw new BackupImportError('invalid');
  }
  const trustedKnowledge = knowledge as BackupKnowledgeRecordV1[];
  const trustedSnippets = snippets as BackupSnippetRecordV1[];
  if (hasDuplicateIds(trustedKnowledge) || hasDuplicateIds(trustedSnippets)) {
    throw new BackupImportError('invalid');
  }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_1,
    exportedAt: parsed.exportedAt as string,
    data: { knowledge: trustedKnowledge, snippets: trustedSnippets, settings },
  };
}

function parseVersion2(parsed: Record<string, unknown>): BackupFileV2 {
  validateEnvelope(parsed);
  const data = parsed.data as Record<string, unknown>;
  const knowledge = (data.knowledge as unknown[]).map(validateKnowledgeV2);
  const snippets = (data.snippets as unknown[]).map(validateSnippetV2);
  const settings = validateSettingsV2(data.settings);
  if (
    knowledge.some((entry) => entry === undefined) ||
    snippets.some((entry) => entry === undefined) ||
    settings === undefined
  ) {
    throw new BackupImportError('invalid');
  }
  const trustedKnowledge = knowledge as BackupKnowledgeRecordV2[];
  const trustedSnippets = snippets as BackupSnippetRecordV2[];
  if (
    hasDuplicateIds(trustedKnowledge) ||
    hasDuplicateIds(trustedSnippets) ||
    hasDuplicateTriggers(trustedSnippets)
  ) {
    throw new BackupImportError('invalid');
  }
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_2,
    exportedAt: parsed.exportedAt as string,
    data: { knowledge: trustedKnowledge, snippets: trustedSnippets, settings },
  };
}

export function parseBackupFile(serialized: string): BackupFile {
  const parsed = parseJson(serialized);
  if (
    parsed.format === BACKUP_FORMAT &&
    typeof parsed.formatVersion === 'number' &&
    Number.isInteger(parsed.formatVersion) &&
    parsed.formatVersion !== BACKUP_FORMAT_VERSION_1 &&
    parsed.formatVersion !== BACKUP_FORMAT_VERSION_2 &&
    parsed.formatVersion !== BACKUP_FORMAT_VERSION_3 &&
    parsed.formatVersion !== BACKUP_FORMAT_VERSION_4 &&
    parsed.formatVersion !== BACKUP_FORMAT_VERSION_5 &&
    parsed.formatVersion !== BACKUP_FORMAT_VERSION_6
  ) {
    throw new BackupImportError('unsupported-version');
  }
  if (parsed.formatVersion === BACKUP_FORMAT_VERSION_1) {
    return parseVersion1(parsed);
  }
  if (parsed.formatVersion === BACKUP_FORMAT_VERSION_2) {
    return parseVersion2(parsed);
  }
  if (parsed.formatVersion === BACKUP_FORMAT_VERSION_3) {
    return parseVersion3(parsed);
  }
  if (parsed.formatVersion === BACKUP_FORMAT_VERSION_4) {
    return parseVersion4(parsed);
  }
  if (parsed.formatVersion === BACKUP_FORMAT_VERSION_5) {
    return parseVersion5(parsed);
  }
  if (parsed.formatVersion === BACKUP_FORMAT_VERSION_6) {
    return parseVersion6(parsed);
  }
  throw new BackupImportError('invalid');
}

export function parseBackupFileV1(serialized: string): BackupFileV1 {
  const parsed = parseJson(serialized);
  if (
    parsed.format === BACKUP_FORMAT &&
    typeof parsed.formatVersion === 'number' &&
    Number.isInteger(parsed.formatVersion) &&
    parsed.formatVersion !== BACKUP_FORMAT_VERSION_1
  ) {
    throw new BackupImportError('unsupported-version');
  }
  if (parsed.formatVersion !== BACKUP_FORMAT_VERSION_1) {
    throw new BackupImportError('invalid');
  }
  return parseVersion1(parsed);
}
