import { RecordNotFoundError } from '../../application/persistence/errors';
import type {
  SnippetEntryInput,
  SnippetEntryRepository,
} from '../../application/persistence/snippet-entry-repository';
import type { SnippetEntry } from '../../domain/snippet-entry';
import {
  cloneSnippetContent,
  getLocalImageAssetIds,
} from '../../domain/snippet-content';
import {
  validateSnippetAsset,
  type SnippetAsset,
  type SnippetAssetDraft,
} from '../../domain/snippet-asset';
import { validateSnippetAssetGraph } from '../../domain/snippet-asset-graph';
import { DuplicateSnippetTriggerError } from '../../application/snippet/snippet-trigger';
import type { AiSupportWorkspaceDatabase } from './database';
import {
  compareByCreatedAtAndId,
  createTimestamp,
  createUpdatedTimestamp,
  runPersistenceOperation,
} from './repository-helpers';
import { toSnippetEntry, toSnippetEntryRecord } from './snippet-entry-record';
import { toSnippetAsset, toSnippetAssetRecord } from './snippet-asset-record';

function isConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'ConstraintError' || error.name === 'Dexie.ConstraintError')
  );
}

async function prepareAssets(
  snippetId: string,
  drafts: readonly SnippetAssetDraft[],
): Promise<readonly SnippetAsset[]> {
  return Promise.all(
    drafts.map((draft) =>
      validateSnippetAsset({
        id: draft.id,
        snippetId,
        mimeType: draft.mimeType,
        blob: draft.blob,
        byteSize: draft.byteSize,
        originalFilename: draft.originalFilename,
        createdAt: draft.createdAt,
      }),
    ),
  );
}

export interface SnippetEntryRepositoryTestHooks {
  afterSnippetUpdateWrite?(): void | Promise<void>;
  afterSnippetDelete?(): void | Promise<void>;
}

export class DexieSnippetEntryRepository implements SnippetEntryRepository {
  constructor(
    private readonly database: AiSupportWorkspaceDatabase,
    private readonly testHooks: SnippetEntryRepositoryTestHooks = {},
  ) {}

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
      const assets = await prepareAssets(entry.id, input.newAssets ?? []);

      try {
        await this.database.transaction(
          'rw',
          this.database.snippetEntries,
          this.database.snippetAssets,
          async () => {
            const [snippetRecords, assetRecords] = await Promise.all([
              this.database.snippetEntries.toArray(),
              this.database.snippetAssets.toArray(),
            ]);
            validateSnippetAssetGraph(
              [...snippetRecords.map(toSnippetEntry), entry],
              [...assetRecords.map(toSnippetAsset), ...assets],
            );
            await this.database.snippetEntries.add(toSnippetEntryRecord(entry));
            if (assets.length > 0) {
              await this.database.snippetAssets.bulkAdd(
                assets.map(toSnippetAssetRecord),
              );
            }
          },
        );
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
    return runPersistenceOperation('update snippet entry', async () => {
      const newAssets = await prepareAssets(id, input.newAssets ?? []);
      return this.database.transaction(
        'rw',
        this.database.snippetEntries,
        this.database.snippetAssets,
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
          const [snippetRecords, allAssetRecords, ownedAssetRecords] =
            await Promise.all([
              this.database.snippetEntries.toArray(),
              this.database.snippetAssets.toArray(),
              this.database.snippetAssets
                .where('snippetId')
                .equals(id)
                .toArray(),
            ]);
          const referencedIds = new Set(getLocalImageAssetIds(updated.content));
          const retainedAssets = ownedAssetRecords
            .map(toSnippetAsset)
            .filter((asset) => referencedIds.has(asset.id));
          const finalOwnedAssets = [...retainedAssets, ...newAssets];
          const otherAssets = allAssetRecords
            .map(toSnippetAsset)
            .filter((asset) => asset.snippetId !== id);
          const finalSnippets = snippetRecords
            .map(toSnippetEntry)
            .map((snippet) => (snippet.id === id ? updated : snippet));

          validateSnippetAssetGraph(finalSnippets, [
            ...otherAssets,
            ...finalOwnedAssets,
          ]);

          try {
            await this.database.snippetEntries.put(
              toSnippetEntryRecord(updated),
            );
            await this.testHooks.afterSnippetUpdateWrite?.();
            await this.database.snippetAssets
              .where('snippetId')
              .equals(id)
              .delete();
            if (finalOwnedAssets.length > 0) {
              await this.database.snippetAssets.bulkAdd(
                finalOwnedAssets.map(toSnippetAssetRecord),
              );
            }
          } catch (error) {
            if (input.trigger !== null && isConstraintError(error)) {
              throw new DuplicateSnippetTriggerError(input.trigger);
            }
            throw error;
          }
          return updated;
        },
      );
    });
  }

  async delete(id: string): Promise<boolean> {
    return runPersistenceOperation('delete snippet entry', () =>
      this.database.transaction(
        'rw',
        this.database.snippetEntries,
        this.database.snippetAssets,
        async () => {
          const deletedCount = await this.database.snippetEntries
            .where(':id')
            .equals(id)
            .delete();
          if (deletedCount > 0) {
            await this.testHooks.afterSnippetDelete?.();
            await this.database.snippetAssets
              .where('snippetId')
              .equals(id)
              .delete();
          }
          return deletedCount > 0;
        },
      ),
    );
  }
}
