import type {
  SnippetEntryInput,
  SnippetEntryRepository,
} from '../persistence/snippet-entry-repository';
import type { SnippetEntry } from '../../domain/snippet-entry';

export interface SnippetLibrary {
  load(): Promise<readonly SnippetEntry[]>;
  create(input: SnippetEntryInput): Promise<SnippetEntry>;
  update(id: string, input: SnippetEntryInput): Promise<SnippetEntry>;
  delete(id: string): Promise<boolean>;
}

export class SnippetLibraryService implements SnippetLibrary {
  constructor(private readonly repository: SnippetEntryRepository) {}

  load(): Promise<readonly SnippetEntry[]> {
    return this.repository.list();
  }

  create(input: SnippetEntryInput): Promise<SnippetEntry> {
    return this.repository.create(input);
  }

  update(id: string, input: SnippetEntryInput): Promise<SnippetEntry> {
    return this.repository.update(id, input);
  }

  delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}

export function orderSnippetEntries(
  entries: readonly SnippetEntry[],
): SnippetEntry[] {
  return [...entries].sort((left, right) => {
    if (left.createdAt < right.createdAt) return -1;
    if (left.createdAt > right.createdAt) return 1;
    if (left.id < right.id) return -1;
    if (left.id > right.id) return 1;
    return 0;
  });
}
