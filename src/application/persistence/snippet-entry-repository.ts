import type { SnippetEntry } from '../../domain/snippet-entry';

export type SnippetEntryInput = Pick<
  SnippetEntry,
  'title' | 'content' | 'tags'
>;

export interface SnippetEntryRepository {
  create(input: SnippetEntryInput): Promise<SnippetEntry>;
  get(id: string): Promise<SnippetEntry | undefined>;
  list(): Promise<readonly SnippetEntry[]>;
  update(id: string, input: SnippetEntryInput): Promise<SnippetEntry>;
  delete(id: string): Promise<boolean>;
}
