import { RecordNotFoundError } from '../../application/persistence/errors';
import type {
  SnippetEntryInput,
  SnippetEntryRepository,
} from '../../application/persistence/snippet-entry-repository';
import type { SnippetEntry } from '../../domain/snippet-entry';
import { cloneSnippetContent } from '../../domain/snippet-content';
import { DuplicateSnippetTriggerError } from '../../application/snippet/snippet-trigger';
import type { AiSupportWorkspaceDatabase } from './database';
import {
  compareByCreatedAtAndId,
  createTimestamp,
  createUpdatedTimestamp,
  runPersistenceOperation,
} from './repository-helpers';
import { toSnippetEntry, toSnippetEntryRecord } from './snippet-entry-record';

function isConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ConstraintError' || error.name === 'Dexie.ConstraintError')
  );
}

export class DexieSnippetEntryRepository implements SnippetEntryRepository {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  async create(input: SnippetEntryInput): Promise<SnippetEntry> {
    return runPersistenceOperation('create snippet entry', async () => {
      const timestamp = createTimestamp();
      const entry: SnippetEntry = {
        id: crypto.randomUUID(),
        title: input.title,
        content: cloneSnippetContent(input.content),
        tags: [...input.tags],
        createdAt: timestamp,
        updatedAt: timestamp,
        trigger: input.trigger,
      };

      try {
        await this.database.snippetEntries.add(toSnippetEntryRecord(entry));
      } catch (error) {
        if (input.trigger !== null && isConstraintError(error)) {
          throw new DuplicateSnippetTriggerError(input.trigger);
        }
        throw error;
      }
      return entry;
    });
  }

  async get(id: string): Promise<SnippetEntry | undefined> {
    return runPersistenceOperation('get snippet entry', async () => {
      const record = await this.database.snippetEntries.get(id);
      return record === undefined ? undefined : toSnippetEntry(record);
    });
  }

  async list(): Promise<readonly SnippetEntry[]> {
    return runPersistenceOperation('list snippet entries', async () => {
      const records = await this.database.snippetEntries
        .orderBy('createdAt')
        .toArray();

      return records.sort(compareByCreatedAtAndId).map(toSnippetEntry);
    });
  }

  async findByTrigger(trigger: string): Promise<SnippetEntry | undefined> {
    return runPersistenceOperation(
      'find snippet entry by trigger',
      async () => {
        const record = await this.database.snippetEntries
          .where('trigger')
          .equals(trigger)
          .first();
        return record === undefined ? undefined : toSnippetEntry(record);
      },
    );
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
            content: cloneSnippetContent(input.content),
            tags: [...input.tags],
            createdAt: existing.createdAt,
            updatedAt: createUpdatedTimestamp(existing.updatedAt),
            trigger: input.trigger,
          };

          try {
            await this.database.snippetEntries.put(
              toSnippetEntryRecord(updated),
            );
          } catch (error) {
            if (input.trigger !== null && isConstraintError(error)) {
              throw new DuplicateSnippetTriggerError(input.trigger);
            }
            throw error;
          }
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
