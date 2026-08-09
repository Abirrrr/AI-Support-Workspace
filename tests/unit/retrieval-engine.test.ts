import { describe, expect, it, vi } from 'vitest';

import { RetrievalEngine } from '../../src/application/retrieval/retrieval-engine';
import type { KnowledgeEntryRepository } from '../../src/application/persistence/knowledge-entry-repository';
import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import type { KnowledgeEntry } from '../../src/domain/knowledge-entry';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import {
  createPlainSnippetContent,
  type SnippetContent,
} from '../../src/domain/snippet-content';

const timestamp = '2026-07-26T12:00:00.000Z';

function createKnowledgeEntry(
  overrides: Partial<KnowledgeEntry> = {},
): KnowledgeEntry {
  return {
    id: 'knowledge-default',
    title: 'Default knowledge',
    body: 'Default body',
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    source: 'Internal guide',
    ...overrides,
  };
}

function createSnippetEntry(
  overrides: Omit<Partial<SnippetEntry>, 'content'> & {
    content?: string | SnippetContent;
  } = {},
): SnippetEntry {
  const { content = 'Default content', ...rest } = overrides;
  return {
    id: 'snippet-default',
    title: 'Default snippet',
    content:
      typeof content === 'string'
        ? createPlainSnippetContent(content)
        : content,
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    trigger: null,
    ...rest,
  };
}

function createRepositories(
  knowledge: readonly KnowledgeEntry[] = [],
  snippets: readonly SnippetEntry[] = [],
) {
  const knowledgeRepository = {
    create: vi.fn(async () => {
      throw new Error('Not used by retrieval.');
    }),
    get: vi.fn(async () => undefined),
    list: vi.fn(async () => knowledge),
    update: vi.fn(async () => {
      throw new Error('Not used by retrieval.');
    }),
    delete: vi.fn(async () => false),
  } satisfies KnowledgeEntryRepository;

  const snippetRepository = {
    create: vi.fn(async () => {
      throw new Error('Not used by retrieval.');
    }),
    get: vi.fn(async () => undefined),
    list: vi.fn(async () => snippets),
    findByTrigger: vi.fn(async () => undefined),
    update: vi.fn(async () => {
      throw new Error('Not used by retrieval.');
    }),
    delete: vi.fn(async () => false),
  } satisfies SnippetEntryRepository;

  return {
    knowledgeRepository,
    snippetRepository,
    engine: new RetrievalEngine(knowledgeRepository, snippetRepository),
  };
}

describe('RetrievalEngine', () => {
  it('normalizes NFKC, case, punctuation, whitespace, Unicode letters, and Unicode numbers', async () => {
    const ascii = createKnowledgeEntry({
      id: 'knowledge-ascii',
      title: 'refund café رقم 123',
    });
    const compatibility = createKnowledgeEntry({
      id: 'knowledge-compatibility',
      title: 'ＲＥＦＵＮＤ CAFÉ رقم １２３',
    });
    const { engine } = createRepositories([ascii, compatibility]);

    const results = await engine.retrieve('  ＲＥＦＵＮＤ, Café رقم １２３!  ');

    expect(results.knowledge).toHaveLength(2);
    expect(results.knowledge.map(({ id, score }) => ({ id, score }))).toEqual([
      { id: 'knowledge-ascii', score: 20 },
      { id: 'knowledge-compatibility', score: 20 },
    ]);
  });

  it.each(['', '   ', '!!!', '\t—\n'])(
    'returns empty collections without repository reads for tokenless query %j',
    async (query) => {
      const { engine, knowledgeRepository, snippetRepository } =
        createRepositories([
          createKnowledgeEntry({ title: 'Would otherwise match' }),
        ]);

      await expect(engine.retrieve(query)).resolves.toEqual({
        knowledge: [],
        snippets: [],
      });
      expect(knowledgeRepository.list).not.toHaveBeenCalled();
      expect(snippetRepository.list).not.toHaveBeenCalled();
    },
  );

  it('deduplicates repeated query terms', async () => {
    const record = createKnowledgeEntry({
      title: 'Refund',
      tags: ['refund'],
      body: 'refund',
    });
    const { engine } = createRepositories([record]);

    const single = await engine.retrieve('refund');
    const repeated = await engine.retrieve('refund refund refund');

    expect(single).toEqual(repeated);
    expect(single.knowledge[0]?.score).toBe(9);
  });

  it('requires exact tokens without prefix or stemming matches', async () => {
    const exact = createKnowledgeEntry({
      id: 'knowledge-exact',
      title: 'Refund',
    });
    const inflected = createKnowledgeEntry({
      id: 'knowledge-inflected',
      title: 'Refunds refunding',
      body: 'Unrelated',
    });
    const { engine } = createRepositories([inflected, exact]);

    const results = await engine.retrieve('refund');

    expect(results.knowledge.map(({ id }) => id)).toEqual(['knowledge-exact']);
  });

  it('scores only Knowledge title, tags, and body with exact 5/3/1 weights', async () => {
    const combined = createKnowledgeEntry({
      id: 'knowledge-combined',
      title: 'Refund request',
      tags: ['request'],
      body: 'refund refund request request',
      source: 'Unrelated source',
    });
    const repeatedAcrossTags = createKnowledgeEntry({
      id: 'knowledge-repeated',
      title: 'Refund',
      tags: ['refund', 'refund refund'],
      body: 'refund refund refund',
      source: 'Unrelated source',
    });
    const sourceOnly = createKnowledgeEntry({
      id: 'knowledge-source-only',
      title: 'Unrelated',
      tags: ['unrelated'],
      body: 'Unrelated',
      source: 'Refund request',
    });
    const { engine } = createRepositories([
      sourceOnly,
      repeatedAcrossTags,
      combined,
    ]);

    const results = await engine.retrieve('refund request');

    expect(results.knowledge.map(({ id, score }) => ({ id, score }))).toEqual([
      { id: 'knowledge-combined', score: 15 },
      { id: 'knowledge-repeated', score: 9 },
    ]);
  });

  it('scores Snippet title, tags, and content and excludes nonmatches', async () => {
    const snippets = [
      createSnippetEntry({
        id: 'snippet-content',
        title: 'Unrelated',
        content: 'refund refund refund',
      }),
      createSnippetEntry({
        id: 'snippet-tag',
        title: 'Unrelated',
        content: 'Unrelated',
        tags: ['refund', 'refund refund'],
      }),
      createSnippetEntry({
        id: 'snippet-title',
        title: 'Refund',
        content: 'Unrelated',
      }),
      createSnippetEntry({
        id: 'snippet-combined',
        title: 'Refund',
        tags: ['refund'],
        content: 'refund refund',
      }),
      createSnippetEntry({
        id: 'snippet-nonmatch',
        title: 'Unrelated',
        content: 'Unrelated',
      }),
    ];
    const { engine } = createRepositories([], snippets);

    const results = await engine.retrieve('refund');

    expect(results.snippets.map(({ id, score }) => ({ id, score }))).toEqual([
      { id: 'snippet-combined', score: 9 },
      { id: 'snippet-title', score: 5 },
      { id: 'snippet-tag', score: 3 },
      { id: 'snippet-content', score: 1 },
    ]);
  });

  it('scores rich Snippets through their deterministic plain projection', async () => {
    const rich = createSnippetEntry({
      id: 'snippet-rich',
      title: 'Unrelated',
      content: {
        kind: 'rich',
        blocks: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Refund details',
                bold: true,
                italic: true,
              },
            ],
          },
          {
            type: 'image',
            assetId: '123e4567-e89b-42d3-a456-426614174000',
            altText: 'Receipt',
          },
        ],
      },
    });
    const { engine } = createRepositories([], [rich]);

    expect((await engine.retrieve('refund')).snippets).toEqual([
      { kind: 'snippet', id: rich.id, record: rich, score: 1 },
    ]);
  });

  it('retrieves list projection but explicitly excludes Image Snippets from all ranking fields', async () => {
    const list = createSnippetEntry({
      id: 'snippet-list',
      title: 'Unrelated',
      content: {
        kind: 'rich',
        blocks: [
          {
            type: 'list',
            listType: 'ordered',
            items: [
              {
                children: [
                  {
                    type: 'text',
                    text: 'Enable widget',
                    bold: true,
                    italic: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    const image = createSnippetEntry({
      id: 'snippet-image',
      title: 'refund secret.png',
      tags: ['refund', 'base64'],
      content: {
        kind: 'image',
        assetId: '123e4567-e89b-42d3-a456-426614174000',
      },
    });
    const { engine } = createRepositories([], [image, list]);

    expect(
      (await engine.retrieve('widget')).snippets.map(({ id }) => id),
    ).toEqual([list.id]);
    expect((await engine.retrieve('refund base64')).snippets).toEqual([]);
  });

  it('orders each domain by score, createdAt, and id deterministically', async () => {
    const records = [
      createKnowledgeEntry({
        id: 'knowledge-z',
        title: 'Unrelated',
        body: 'match',
      }),
      createKnowledgeEntry({
        id: 'knowledge-high',
        title: 'match',
        body: 'Unrelated',
        createdAt: '2026-07-26T12:00:03.000Z',
      }),
      createKnowledgeEntry({
        id: 'knowledge-a',
        title: 'Unrelated',
        body: 'match',
      }),
      createKnowledgeEntry({
        id: 'knowledge-early',
        title: 'Unrelated',
        body: 'match',
        createdAt: '2026-07-26T11:59:59.000Z',
      }),
    ];
    const { engine } = createRepositories(records);

    const first = await engine.retrieve('match');
    const second = await engine.retrieve('match');
    const expectedOrder = [
      'knowledge-high',
      'knowledge-early',
      'knowledge-a',
      'knowledge-z',
    ];

    expect(first.knowledge.map(({ id }) => id)).toEqual(expectedOrder);
    expect(second.knowledge.map(({ id }) => id)).toEqual(expectedOrder);
  });

  it('returns separate typed domain results with the source records and scores', async () => {
    const knowledge = createKnowledgeEntry({
      id: 'knowledge-result',
      title: 'Refund',
    });
    const snippet = createSnippetEntry({
      id: 'snippet-result',
      title: 'Unrelated',
      content: 'Refund',
    });
    const { engine } = createRepositories([knowledge], [snippet]);

    await expect(engine.retrieve('refund')).resolves.toEqual({
      knowledge: [
        {
          kind: 'knowledge',
          id: knowledge.id,
          record: knowledge,
          score: 5,
        },
      ],
      snippets: [
        {
          kind: 'snippet',
          id: snippet.id,
          record: snippet,
          score: 1,
        },
      ],
    });
  });

  it('returns every positive-score result without a fixed limit', async () => {
    const records = Array.from({ length: 12 }, (_, index) =>
      createKnowledgeEntry({
        id: `knowledge-${String(index).padStart(2, '0')}`,
        body: 'match',
      }),
    );
    const { engine } = createRepositories(records);

    const results = await engine.retrieve('match');

    expect(results.knowledge).toHaveLength(12);
    expect(results.knowledge.every(({ score }) => score === 1)).toBe(true);
  });

  it('reads each repository once and does not mutate records or call write methods', async () => {
    const knowledge = createKnowledgeEntry({
      title: 'Refund',
      tags: ['billing'],
    });
    const snippet = createSnippetEntry({
      content: 'Refund',
      tags: ['billing'],
    });
    const knowledgeBefore = structuredClone(knowledge);
    const snippetBefore = structuredClone(snippet);
    const { engine, knowledgeRepository, snippetRepository } =
      createRepositories([knowledge], [snippet]);

    await engine.retrieve('refund');

    expect(knowledge).toEqual(knowledgeBefore);
    expect(snippet).toEqual(snippetBefore);
    expect(knowledgeRepository.list).toHaveBeenCalledOnce();
    expect(snippetRepository.list).toHaveBeenCalledOnce();
    expect(knowledgeRepository.create).not.toHaveBeenCalled();
    expect(knowledgeRepository.update).not.toHaveBeenCalled();
    expect(knowledgeRepository.delete).not.toHaveBeenCalled();
    expect(snippetRepository.create).not.toHaveBeenCalled();
    expect(snippetRepository.update).not.toHaveBeenCalled();
    expect(snippetRepository.delete).not.toHaveBeenCalled();
  });
});
