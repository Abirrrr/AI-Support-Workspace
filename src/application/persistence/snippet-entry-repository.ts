import type { SnippetEntry } from '../../domain/snippet-entry';
import type { SnippetAssetDraft } from '../../domain/snippet-asset';

export type SnippetEntryInput = Pick<
  SnippetEntry,
  'title' | 'content' | 'tags' | 'trigger'
> & {
  readonly newAssets?: readonly SnippetAssetDraft[];
};

export interface SnippetEntryRepository {
  create(input: SnippetEntryInput): Promise<SnippetEntry>;
  get(id: string): Promise<SnippetEntry | undefined>;
  list(): Promise<readonly SnippetEntry[]>;
  findByTrigger(trigger: string): Promise<SnippetEntry | undefined>;
  update(id: string, input: SnippetEntryInput): Promise<SnippetEntry>;
  delete(id: string): Promise<boolean>;
}
