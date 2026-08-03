import type { SnippetEntry } from '../../domain/snippet-entry';

export interface SnippetEntryRecord {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  trigger?: string;
}

export function toSnippetEntry(record: SnippetEntryRecord): SnippetEntry {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    tags: [...record.tags],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    trigger: record.trigger ?? null,
  };
}

export function toSnippetEntryRecord(entry: SnippetEntry): SnippetEntryRecord {
  const record: SnippetEntryRecord = {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
  if (entry.trigger !== null) record.trigger = entry.trigger;
  return record;
}
