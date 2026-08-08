import type { SnippetEntry } from '../../domain/snippet-entry';
import type { SnippetContent } from '../../domain/snippet-content';
import { cloneSnippetContent } from '../../domain/snippet-content';

export interface SnippetEntryRecordV3 {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  trigger?: string;
}

export interface SnippetEntryRecord {
  id: string;
  title: string;
  content: SnippetContent;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  trigger?: string;
}

export function toSnippetEntry(record: SnippetEntryRecord): SnippetEntry {
  return {
    id: record.id,
    title: record.title,
    content: cloneSnippetContent(record.content),
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
    content: cloneSnippetContent(entry.content),
    tags: [...entry.tags],
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
  if (entry.trigger !== null) record.trigger = entry.trigger;
  return record;
}
