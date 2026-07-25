import type { KnowledgeEntry } from '../../domain/knowledge-entry';

export type KnowledgeEntryInput = Pick<
  KnowledgeEntry,
  'title' | 'body' | 'tags' | 'source'
>;

export interface KnowledgeEntryRepository {
  create(input: KnowledgeEntryInput): Promise<KnowledgeEntry>;
  get(id: string): Promise<KnowledgeEntry | undefined>;
  list(): Promise<readonly KnowledgeEntry[]>;
  update(id: string, input: KnowledgeEntryInput): Promise<KnowledgeEntry>;
  delete(id: string): Promise<boolean>;
}
