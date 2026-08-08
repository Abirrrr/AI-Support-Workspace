import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION_1,
  BACKUP_FORMAT_VERSION_2,
  BACKUP_FORMAT_VERSION_3,
  type BackupFile,
  type BackupFileV1,
  type BackupFileV2,
  type BackupFileV3,
  type BackupKnowledgeRecordV1,
  type BackupKnowledgeRecordV2,
  type BackupKnowledgeRecordV3,
  type BackupRichSnippetBlockV3,
  type BackupRichSnippetInlineV3,
  type BackupSettingsV1,
  type BackupSettingsV2,
  type BackupSettingsV3,
  type BackupSnippetContentV3,
  type BackupSnippetRecordV1,
  type BackupSnippetRecordV2,
  type BackupSnippetRecordV3,
} from '../../domain/backup-file';
import {
  isSafeSnippetImageUrl,
  isSafeSnippetLinkUrl,
} from '../../domain/snippet-content';
import { isCanonicalSnippetTrigger } from '../snippet/snippet-trigger';
import { BackupImportError } from './backup-errors';

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

function validateEnvelope(parsed: Record<string, unknown>) {
  if (
    !hasExactKeys(parsed, ['format', 'formatVersion', 'exportedAt', 'data']) ||
    parsed.format !== BACKUP_FORMAT ||
    !isUtcIsoTimestamp(parsed.exportedAt) ||
    !isRecord(parsed.data) ||
    !hasExactKeys(parsed.data, ['knowledge', 'snippets', 'settings']) ||
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
    parsed.formatVersion !== BACKUP_FORMAT_VERSION_3
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
