import { RecordNotFoundError } from '../../application/persistence/errors';
import type {
  KnowledgeEntryInput,
  KnowledgeEntryRepository,
} from '../../application/persistence/knowledge-entry-repository';
import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { AiSupportWorkspaceDatabase } from './database';
import {
  compareByCreatedAtAndId,
  createTimestamp,
  createUpdatedTimestamp,
  runPersistenceOperation,
} from './repository-helpers';

export class DexieKnowledgeEntryRepository implements KnowledgeEntryRepository {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  async create(input: KnowledgeEntryInput): Promise<KnowledgeEntry> {
    return runPersistenceOperation('create knowledge entry', async () => {
      const timestamp = createTimestamp();
      const record: KnowledgeEntry = {
        id: crypto.randomUUID(),
        title: input.title,
        body: input.body,
        tags: [...input.tags],
        createdAt: timestamp,
        updatedAt: timestamp,
        source: input.source,
      };

      await this.database.knowledgeEntries.add(record);
      return record;
    });
  }

  async get(id: string): Promise<KnowledgeEntry | undefined> {
    return runPersistenceOperation('get knowledge entry', () =>
      this.database.knowledgeEntries.get(id),
    );
  }

  async list(): Promise<readonly KnowledgeEntry[]> {
    return runPersistenceOperation('list knowledge entries', async () => {
      const records = await this.database.knowledgeEntries
        .orderBy('createdAt')
        .toArray();

      return records.sort(compareByCreatedAtAndId);
    });
  }

  async update(
    id: string,
    input: KnowledgeEntryInput,
  ): Promise<KnowledgeEntry> {
    return runPersistenceOperation('update knowledge entry', () =>
      this.database.transaction(
        'rw',
        this.database.knowledgeEntries,
        async () => {
          const existing = await this.database.knowledgeEntries.get(id);

          if (!existing) {
            throw new RecordNotFoundError('knowledgeEntry', id);
          }

          const updated: KnowledgeEntry = {
            id: existing.id,
            title: input.title,
            body: input.body,
            tags: [...input.tags],
            createdAt: existing.createdAt,
            updatedAt: createUpdatedTimestamp(existing.updatedAt),
            source: input.source,
          };

          await this.database.knowledgeEntries.put(updated);
          return updated;
        },
      ),
    );
  }

  async delete(id: string): Promise<boolean> {
    return runPersistenceOperation('delete knowledge entry', async () => {
      const deletedCount = await this.database.knowledgeEntries
        .where(':id')
        .equals(id)
        .delete();

      return deletedCount > 0;
    });
  }
}
