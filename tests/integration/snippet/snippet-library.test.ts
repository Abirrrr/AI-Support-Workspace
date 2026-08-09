import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SnippetLibraryService } from '../../../src/application/snippet/snippet-library';
import { createPlainSnippetContent } from '../../../src/domain/snippet-content';
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
      content: createPlainSnippetContent('Your order has been confirmed.'),
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

  it('persists and reopens UI-shaped Rich content through the same aggregate', async () => {
    const library = new SnippetLibraryService(
      new DexieSnippetEntryRepository(database),
    );
    const content = {
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Hello ', bold: true, italic: true },
            {
              type: 'link',
              text: 'help',
              url: 'https://example.com/help',
              bold: false,
              italic: false,
            },
          ],
        },
        {
          type: 'reference',
          referenceType: 'image',
          label: 'Diagram',
          url: 'http://example.com/diagram.png',
        },
      ],
    } as const;

    const created = await library.create({
      title: 'Rich reply',
      content,
      tags: ['rich'],
      trigger: ';rich',
    });
    database.close({ disableAutoOpen: true });
    database = createIsolatedDatabase(databaseName);
    const reopened = new SnippetLibraryService(
      new DexieSnippetEntryRepository(database),
    );

    await expect(reopened.load()).resolves.toEqual([created]);
    expect(created.content).toEqual(content);
    expect(created.id).toBe((await reopened.load())[0]?.id);
  });
});
