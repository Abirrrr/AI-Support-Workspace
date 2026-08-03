import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RetrievalEngine } from '../../../src/application/retrieval/retrieval-engine';
import {
  DATABASE_NAME,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../../src/infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSnippetEntryRepository } from '../../../src/infrastructure/persistence/dexie-snippet-entry-repository';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from '../persistence/test-database';

describe('Retrieval Engine production persistence integration', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;

  beforeEach(() => {
    databaseName = `${DATABASE_NAME}-retrieval-test-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  it('retrieves and ranks persisted Knowledge and Snippets without writing', async () => {
    const knowledgeRepository = new DexieKnowledgeEntryRepository(database);
    const snippetRepository = new DexieSnippetEntryRepository(database);
    const knowledgeTitleMatch = await knowledgeRepository.create({
      title: 'Refund policy',
      body: 'Unrelated body',
      tags: [],
      source: 'Internal handbook',
    });
    const knowledgeBodyMatch = await knowledgeRepository.create({
      title: 'Billing policy',
      body: 'Issue the refund after verification.',
      tags: [],
      source: 'Internal handbook',
    });
    await knowledgeRepository.create({
      title: 'Shipping policy',
      body: 'Unrelated body',
      tags: [],
      source: 'Refund source metadata',
    });
    const snippetTagMatch = await snippetRepository.create({
      title: 'Billing response',
      content: 'Please allow processing time.',
      tags: ['refund'],
      trigger: null,
    });
    const snippetContentMatch = await snippetRepository.create({
      title: 'Follow-up response',
      content: 'Your refund is being processed.',
      tags: [],
      trigger: null,
    });
    const engine = new RetrievalEngine(knowledgeRepository, snippetRepository);
    const knowledgeBefore = await knowledgeRepository.list();
    const snippetsBefore = await snippetRepository.list();

    const results = await engine.retrieve('refund');

    expect(results.knowledge.map(({ id, score }) => ({ id, score }))).toEqual([
      { id: knowledgeTitleMatch.id, score: 5 },
      { id: knowledgeBodyMatch.id, score: 1 },
    ]);
    expect(results.snippets.map(({ id, score }) => ({ id, score }))).toEqual([
      { id: snippetTagMatch.id, score: 3 },
      { id: snippetContentMatch.id, score: 1 },
    ]);
    expect(await knowledgeRepository.list()).toEqual(knowledgeBefore);
    expect(await snippetRepository.list()).toEqual(snippetsBefore);
  });
});
