import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SnippetLibraryService } from '../../../src/application/snippet/snippet-library';
import {
  DATABASE_NAME,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieSnippetEntryRepository } from '../../../src/infrastructure/persistence/dexie-snippet-entry-repository';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from '../persistence/test-database';

describe('Snippet Library production persistence integration', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;

  beforeEach(() => {
    databaseName = `${DATABASE_NAME}-snippet-library-test-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  it('persists an application-created snippet through the real repository', async () => {
    const library = new SnippetLibraryService(
      new DexieSnippetEntryRepository(database),
    );

    const created = await library.create({
      title: 'Order confirmation',
      content: 'Your order has been confirmed.',
      tags: ['orders'],
      trigger: ';order',
    });

    expect(await database.snippetEntries.get(created.id)).toEqual({
      id: created.id,
      title: created.title,
      content: created.content,
      tags: created.tags,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      trigger: ';order',
    });
    expect(await library.load()).toEqual([created]);
  });
});
