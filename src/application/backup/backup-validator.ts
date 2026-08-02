import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  type BackupFileV1,
  type BackupKnowledgeRecordV1,
  type BackupSettingsV1,
  type BackupSnippetRecordV1,
} from '../../domain/backup-file';
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
    const child = (value as Record<string, unknown>)[key];
    if (containsDangerousKey(child)) return true;
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

function validateKnowledge(
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

function validateSnippet(value: unknown): BackupSnippetRecordV1 | undefined {
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

function validateSettings(value: unknown): BackupSettingsV1 | undefined {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['defaultModel']) ||
    (value.defaultModel !== null && typeof value.defaultModel !== 'string')
  ) {
    return undefined;
  }

  return { defaultModel: value.defaultModel };
}

function hasDuplicateIds(records: readonly { id: string }[]): boolean {
  return new Set(records.map(({ id }) => id)).size !== records.length;
}

export function parseBackupFileV1(serialized: string): BackupFileV1 {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new BackupImportError('invalid', error);
  }

  if (containsDangerousKey(parsed) || !isRecord(parsed)) {
    throw new BackupImportError('invalid');
  }

  if (
    parsed.format === BACKUP_FORMAT &&
    typeof parsed.formatVersion === 'number' &&
    Number.isInteger(parsed.formatVersion) &&
    parsed.formatVersion !== BACKUP_FORMAT_VERSION
  ) {
    throw new BackupImportError('unsupported-version');
  }

  if (
    !hasExactKeys(parsed, ['format', 'formatVersion', 'exportedAt', 'data']) ||
    parsed.format !== BACKUP_FORMAT ||
    parsed.formatVersion !== BACKUP_FORMAT_VERSION ||
    !isUtcIsoTimestamp(parsed.exportedAt) ||
    !isRecord(parsed.data) ||
    !hasExactKeys(parsed.data, ['knowledge', 'snippets', 'settings']) ||
    !Array.isArray(parsed.data.knowledge) ||
    !Array.isArray(parsed.data.snippets)
  ) {
    throw new BackupImportError('invalid');
  }

  const knowledge = parsed.data.knowledge.map(validateKnowledge);
  const snippets = parsed.data.snippets.map(validateSnippet);
  const settings = validateSettings(parsed.data.settings);

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
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: parsed.exportedAt,
    data: {
      knowledge: trustedKnowledge,
      snippets: trustedSnippets,
      settings,
    },
  };
}
