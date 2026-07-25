import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { KnowledgeLibraryService } from '../../../src/application/knowledge/knowledge-library';
import {
  DATABASE_NAME,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../../src/infrastructure/persistence/dexie-knowledge-entry-repository';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from '../persistence/test-database';

describe('Knowledge Library production persistence integration', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;

  beforeEach(() => {
    databaseName = `${DATABASE_NAME}-library-test-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  it('persists an application-created entry through the real repository', async () => {
    const library = new KnowledgeLibraryService(
      new DexieKnowledgeEntryRepository(database),
    );

    const created = await library.create({
      title: 'Checkout troubleshooting',
      body: 'Restart the local checkout service.',
      tags: ['checkout'],
      source: 'Internal runbook',
    });

    expect(await database.knowledgeEntries.get(created.id)).toEqual(created);
    expect(await library.load()).toEqual([created]);
  });
});
