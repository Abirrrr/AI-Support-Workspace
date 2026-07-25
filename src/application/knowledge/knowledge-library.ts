import type {
  KnowledgeEntryInput,
  KnowledgeEntryRepository,
} from '../persistence/knowledge-entry-repository';
import type { KnowledgeEntry } from '../../domain/knowledge-entry';

export interface KnowledgeLibrary {
  load(): Promise<readonly KnowledgeEntry[]>;
  create(input: KnowledgeEntryInput): Promise<KnowledgeEntry>;
  update(id: string, input: KnowledgeEntryInput): Promise<KnowledgeEntry>;
  delete(id: string): Promise<boolean>;
}

export class KnowledgeLibraryService implements KnowledgeLibrary {
  constructor(private readonly repository: KnowledgeEntryRepository) {}

  load(): Promise<readonly KnowledgeEntry[]> {
    return this.repository.list();
  }

  create(input: KnowledgeEntryInput): Promise<KnowledgeEntry> {
    return this.repository.create(input);
  }

  update(id: string, input: KnowledgeEntryInput): Promise<KnowledgeEntry> {
    return this.repository.update(id, input);
  }

  delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}

export function orderKnowledgeEntries(
  entries: readonly KnowledgeEntry[],
): KnowledgeEntry[] {
  return [...entries].sort((left, right) => {
    if (left.createdAt < right.createdAt) return -1;
    if (left.createdAt > right.createdAt) return 1;
    if (left.id < right.id) return -1;
    if (left.id > right.id) return 1;
    return 0;
  });
}
