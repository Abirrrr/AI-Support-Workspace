import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PersistenceError } from '../../../src/application/persistence/errors';
import {
  DATABASE_NAME,
  DATABASE_VERSION,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../../src/infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSnippetEntryRepository } from '../../../src/infrastructure/persistence/dexie-snippet-entry-repository';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from './test-database';

describe('local database foundation', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;

  beforeEach(() => {
    databaseName = `${DATABASE_NAME}-test-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  it('opens version 1 with only the approved tables and indexes', async () => {
    await database.open();

    expect(database.verno).toBe(DATABASE_VERSION);
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      'knowledgeEntries',
      'snippetEntries',
    ]);

    for (const table of database.tables) {
      expect(table.schema.primKey).toMatchObject({
        name: 'id',
        keyPath: 'id',
        auto: false,
        compound: false,
        multi: false,
      });
      expect(table.schema.indexes).toHaveLength(1);
      expect(table.schema.indexes[0]).toMatchObject({
        name: 'createdAt',
        keyPath: 'createdAt',
        compound: false,
        multi: false,
        unique: false,
      });
    }
  });

  it('keeps Knowledge and Snippet records in separate tables', async () => {
    const knowledgeRepository = new DexieKnowledgeEntryRepository(database);
    const snippetRepository = new DexieSnippetEntryRepository(database);

    const knowledge = await knowledgeRepository.create({
      title: 'Knowledge title',
      body: 'Knowledge body',
      tags: ['knowledge'],
      source: 'local',
    });
    const snippet = await snippetRepository.create({
      title: 'Snippet title',
      content: 'Snippet content',
      tags: ['snippet'],
    });

    expect(await database.knowledgeEntries.toArray()).toEqual([knowledge]);
    expect(await database.snippetEntries.toArray()).toEqual([snippet]);
    expect(await knowledgeRepository.get(snippet.id)).toBeUndefined();
    expect(await snippetRepository.get(knowledge.id)).toBeUndefined();
  });

  it('wraps underlying persistence failures and preserves their cause', async () => {
    const repository = new DexieKnowledgeEntryRepository(database);
    database.close({ disableAutoOpen: true });

    const operation = repository.get('missing-id');

    await expect(operation).rejects.toBeInstanceOf(PersistenceError);
    await expect(operation).rejects.toMatchObject({
      name: 'PersistenceError',
      cause: expect.any(Error),
    });
  });
});
