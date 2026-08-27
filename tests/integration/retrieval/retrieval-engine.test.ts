import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RetrievalEngine } from '../../../src/application/retrieval/retrieval-engine';
import { createPlainSnippetContent } from '../../../src/domain/snippet-content';
import {
  DATABASE_NAME,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../../src/infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSnippetEntryRepository } from '../../../src/infrastructure/persistence/dexie-snippet-entry-repository';
import { DexieSnippetGeneratedMetadataRepository } from '../../../src/infrastructure/persistence/dexie-snippet-generated-metadata-repository';
import { createSnippetSourceFingerprint } from '../../../src/domain/snippet-generated-metadata';
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
      content: createPlainSnippetContent('Please allow processing time.'),
      tags: ['refund'],
      trigger: null,
    });
    const snippetContentMatch = await snippetRepository.create({
      title: 'Follow-up response',
      content: createPlainSnippetContent('Your refund is being processed.'),
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

  it('joins valid generated metadata locally while stale metadata contributes zero', async () => {
    const knowledgeRepository = new DexieKnowledgeEntryRepository(database);
    const snippetRepository = new DexieSnippetEntryRepository(database);
    const metadataRepository = new DexieSnippetGeneratedMetadataRepository(
      database,
    );
    const valid = await snippetRepository.create({
      title: 'Unrelated title',
      content: createPlainSnippetContent('Unrelated content'),
      tags: [],
      trigger: null,
    });
    const stale = await snippetRepository.create({
      title: 'Refund authored fallback',
      content: createPlainSnippetContent('Unrelated content'),
      tags: [],
      trigger: null,
    });
    await metadataRepository.save({
      snippetId: valid.id,
      generatedTags: ['refund'],
      sourceFingerprint: await createSnippetSourceFingerprint(valid),
      generatedAt: '2026-08-27T00:00:00.000Z',
    });
    await metadataRepository.save({
      snippetId: stale.id,
      generatedTags: ['refund'],
      sourceFingerprint: '0'.repeat(64),
      generatedAt: '2026-08-27T00:00:00.000Z',
    });
    const engine = new RetrievalEngine(
      knowledgeRepository,
      snippetRepository,
      metadataRepository,
    );

    expect(
      (await engine.retrieve('refund')).snippets.map(({ id, score }) => ({
        id,
        score,
      })),
    ).toEqual([
      { id: stale.id, score: 5 },
      { id: valid.id, score: 1 },
    ]);
  });
});
