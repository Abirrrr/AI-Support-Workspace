import { RecordNotFoundError } from '../../application/persistence/errors';
import type {
  SnippetEntryInput,
  SnippetEntryRepository,
} from '../../application/persistence/snippet-entry-repository';
import type { SnippetEntry } from '../../domain/snippet-entry';
import type { AiSupportWorkspaceDatabase } from './database';
import {
  compareByCreatedAtAndId,
  createTimestamp,
  createUpdatedTimestamp,
  runPersistenceOperation,
} from './repository-helpers';

export class DexieSnippetEntryRepository implements SnippetEntryRepository {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  async create(input: SnippetEntryInput): Promise<SnippetEntry> {
    return runPersistenceOperation('create snippet entry', async () => {
      const timestamp = createTimestamp();
      const record: SnippetEntry = {
        id: crypto.randomUUID(),
        title: input.title,
        content: input.content,
        tags: [...input.tags],
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await this.database.snippetEntries.add(record);
      return record;
    });
  }

  async get(id: string): Promise<SnippetEntry | undefined> {
    return runPersistenceOperation('get snippet entry', () =>
      this.database.snippetEntries.get(id),
    );
  }

  async list(): Promise<readonly SnippetEntry[]> {
    return runPersistenceOperation('list snippet entries', async () => {
      const records = await this.database.snippetEntries
        .orderBy('createdAt')
        .toArray();

      return records.sort(compareByCreatedAtAndId);
    });
  }

  async update(id: string, input: SnippetEntryInput): Promise<SnippetEntry> {
    return runPersistenceOperation('update snippet entry', () =>
      this.database.transaction(
        'rw',
        this.database.snippetEntries,
        async () => {
          const existing = await this.database.snippetEntries.get(id);

          if (!existing) {
            throw new RecordNotFoundError('snippetEntry', id);
          }

          const updated: SnippetEntry = {
            id: existing.id,
            title: input.title,
            content: input.content,
            tags: [...input.tags],
            createdAt: existing.createdAt,
            updatedAt: createUpdatedTimestamp(existing.updatedAt),
          };

          await this.database.snippetEntries.put(updated);
          return updated;
        },
      ),
    );
  }

  async delete(id: string): Promise<boolean> {
    return runPersistenceOperation('delete snippet entry', async () => {
      const deletedCount = await this.database.snippetEntries
        .where(':id')
        .equals(id)
        .delete();

      return deletedCount > 0;
    });
  }
}
