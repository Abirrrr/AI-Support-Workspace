import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PersistenceError } from '../../../src/application/persistence/errors';
import type { KnowledgeEntry } from '../../../src/domain/knowledge-entry';
import type { SnippetEntry } from '../../../src/domain/snippet-entry';
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

  it('opens version 2 with only the approved tables and indexes', async () => {
    await database.open();

    expect(database.verno).toBe(DATABASE_VERSION);
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      'knowledgeEntries',
      'settings',
      'snippetEntries',
    ]);

    for (const table of [database.knowledgeEntries, database.snippetEntries]) {
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

    expect(database.settings.schema.primKey).toMatchObject({
      name: 'id',
      keyPath: 'id',
      auto: false,
      compound: false,
      multi: false,
    });
    expect(database.settings.schema.indexes).toHaveLength(0);
    expect(await database.settings.count()).toBe(0);
  });

  it('upgrades version 1 without transforming Knowledge or Snippet data', async () => {
    const knowledge: KnowledgeEntry = {
      id: 'knowledge-v1',
      title: 'Version 1 knowledge',
      body: 'Preserve this body.',
      tags: ['migration'],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
      source: 'migration fixture',
    };
    const snippet: SnippetEntry = {
      id: 'snippet-v1',
      title: 'Version 1 snippet',
      content: 'Preserve this content.',
      tags: ['migration'],
      createdAt: '2026-08-01T10:00:01.000Z',
      updatedAt: '2026-08-01T10:00:01.000Z',
    };
    const versionOne = new Dexie(databaseName, { indexedDB, IDBKeyRange });
    versionOne.version(1).stores({
      knowledgeEntries: 'id, createdAt',
      snippetEntries: 'id, createdAt',
    });
    await versionOne.open();
    await versionOne.table<KnowledgeEntry>('knowledgeEntries').add(knowledge);
    await versionOne.table<SnippetEntry>('snippetEntries').add(snippet);
    versionOne.close();

    await database.open();

    expect(database.verno).toBe(2);
    expect(await database.knowledgeEntries.toArray()).toEqual([knowledge]);
    expect(await database.snippetEntries.toArray()).toEqual([snippet]);
    expect(await database.settings.count()).toBe(0);
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      'knowledgeEntries',
      'settings',
      'snippetEntries',
    ]);
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
