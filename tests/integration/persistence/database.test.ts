import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PersistenceError } from '../../../src/application/persistence/errors';
import type { KnowledgeEntry } from '../../../src/domain/knowledge-entry';
import {
  DATABASE_NAME,
  DATABASE_VERSION,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../../src/infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSnippetEntryRepository } from '../../../src/infrastructure/persistence/dexie-snippet-entry-repository';
import type { SnippetEntryRecord } from '../../../src/infrastructure/persistence/snippet-entry-record';
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

  it('opens version 3 with only the approved tables and indexes', async () => {
    await database.open();

    expect(database.verno).toBe(DATABASE_VERSION);
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      'knowledgeEntries',
      'settings',
      'snippetEntries',
    ]);

    expect(database.knowledgeEntries.schema.primKey).toMatchObject({
      name: 'id',
      keyPath: 'id',
      auto: false,
      compound: false,
      multi: false,
    });
    expect(database.knowledgeEntries.schema.indexes).toHaveLength(1);
    expect(database.knowledgeEntries.schema.indexes[0]).toMatchObject({
      name: 'createdAt',
      keyPath: 'createdAt',
      compound: false,
      multi: false,
      unique: false,
    });
    expect(database.snippetEntries.schema.indexes).toHaveLength(2);
    expect(database.snippetEntries.schema.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'createdAt', unique: false }),
        expect.objectContaining({ name: 'trigger', unique: true }),
      ]),
    );

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
    const snippet: SnippetEntryRecord = {
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
    await versionOne.table<SnippetEntryRecord>('snippetEntries').add(snippet);
    versionOne.close();

    await database.open();

    expect(database.verno).toBe(3);
    expect(await database.knowledgeEntries.toArray()).toEqual([knowledge]);
    expect(await database.snippetEntries.toArray()).toEqual([snippet]);
    expect(await database.settings.count()).toBe(0);
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      'knowledgeEntries',
      'settings',
      'snippetEntries',
    ]);
  });

  it('upgrades version 2 to version 3 without changing existing records', async () => {
    const knowledge: KnowledgeEntry = {
      id: 'knowledge-v2',
      title: 'Version 2 knowledge',
      body: 'Preserved body',
      tags: ['migration'],
      createdAt: '2026-08-01T11:00:00.000Z',
      updatedAt: '2026-08-01T11:00:00.000Z',
      source: 'migration fixture',
    };
    const snippet: SnippetEntryRecord = {
      id: 'snippet-v2',
      title: 'Version 2 snippet',
      content: 'Preserved content',
      tags: ['migration'],
      createdAt: '2026-08-01T11:00:01.000Z',
      updatedAt: '2026-08-01T11:00:01.000Z',
    };
    const versionTwo = new Dexie(databaseName, { indexedDB, IDBKeyRange });
    versionTwo.version(1).stores({
      knowledgeEntries: 'id, createdAt',
      snippetEntries: 'id, createdAt',
    });
    versionTwo.version(2).stores({
      knowledgeEntries: 'id, createdAt',
      settings: 'id',
      snippetEntries: 'id, createdAt',
    });
    await versionTwo.open();
    await versionTwo.table<KnowledgeEntry>('knowledgeEntries').add(knowledge);
    await versionTwo.table<SnippetEntryRecord>('snippetEntries').add(snippet);
    await versionTwo.table('settings').add({
      id: 'global',
      defaultModel: 'preserved-model',
    });
    versionTwo.close();

    await database.open();

    expect(await database.knowledgeEntries.toArray()).toEqual([knowledge]);
    expect(await database.snippetEntries.toArray()).toEqual([snippet]);
    expect(await database.settings.toArray()).toEqual([
      { id: 'global', defaultModel: 'preserved-model' },
    ]);
    database.close();
    database = createIsolatedDatabase(databaseName);
    expect(await database.snippetEntries.toArray()).toEqual([snippet]);
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
      trigger: null,
    });

    expect(await database.knowledgeEntries.toArray()).toEqual([knowledge]);
    expect(await database.snippetEntries.toArray()).toEqual([
      {
        id: snippet.id,
        title: snippet.title,
        content: snippet.content,
        tags: snippet.tags,
        createdAt: snippet.createdAt,
        updatedAt: snippet.updatedAt,
      },
    ]);
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
