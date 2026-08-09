import type {
  SnippetEntryInput,
  SnippetEntryRepository,
} from '../persistence/snippet-entry-repository';
import type { SnippetEntry } from '../../domain/snippet-entry';
import { validateSnippetContent } from '../../domain/snippet-content';
import {
  DuplicateSnippetTriggerError,
  normalizeSnippetTrigger,
} from './snippet-trigger';
import {
  runCatalogCoordinatedMutation,
  type CatalogMutationPort,
} from './catalog-mutation';

export interface SnippetLibrary {
  load(): Promise<readonly SnippetEntry[]>;
  create(input: SnippetEntryInput): Promise<SnippetEntry>;
  update(id: string, input: SnippetEntryInput): Promise<SnippetEntry>;
  delete(id: string): Promise<boolean>;
}

export class SnippetLibraryService implements SnippetLibrary {
  constructor(
    private readonly repository: SnippetEntryRepository,
    private readonly catalogMutationPort?: CatalogMutationPort,
  ) {}

  load(): Promise<readonly SnippetEntry[]> {
    return this.repository.list();
  }

  async create(input: SnippetEntryInput): Promise<SnippetEntry> {
    const trigger = await this.normalizeAndCheckTrigger(input.trigger);
    const content = validateSnippetContent(input.content);
    return runCatalogCoordinatedMutation(this.catalogMutationPort, () =>
      this.repository.create({
        title: input.title,
        content,
        tags: [...input.tags],
        trigger,
        ...(input.newAssets === undefined
          ? {}
          : { newAssets: input.newAssets }),
      }),
    );
  }

  async update(id: string, input: SnippetEntryInput): Promise<SnippetEntry> {
    const trigger = await this.normalizeAndCheckTrigger(input.trigger, id);
    const content = validateSnippetContent(input.content);
    return runCatalogCoordinatedMutation(this.catalogMutationPort, () =>
      this.repository.update(id, {
        title: input.title,
        content,
        tags: [...input.tags],
        trigger,
        ...(input.newAssets === undefined
          ? {}
          : { newAssets: input.newAssets }),
      }),
    );
  }

  delete(id: string): Promise<boolean> {
    return runCatalogCoordinatedMutation(this.catalogMutationPort, () =>
      this.repository.delete(id),
    );
  }

  private async normalizeAndCheckTrigger(
    trigger: string | null,
    currentId?: string,
  ): Promise<string | null> {
    const normalized = normalizeSnippetTrigger(trigger);
    if (normalized === null) return null;

    const existing = await this.repository.findByTrigger(normalized);
    if (existing !== undefined && existing.id !== currentId) {
      throw new DuplicateSnippetTriggerError(normalized);
    }
    return normalized;
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
