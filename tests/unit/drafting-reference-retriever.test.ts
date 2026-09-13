import { describe, expect, it, vi } from 'vitest';

import { DraftingReferenceRetriever } from '../../src/application/retrieval/drafting-reference-retriever';
import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import type { SnippetGeneratedMetadataRepository } from '../../src/application/persistence/snippet-generated-metadata-repository';
import {
  createPlainSnippetContent,
  type SnippetContent,
} from '../../src/domain/snippet-content';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import {
  createSnippetSourceFingerprint,
  type SnippetGeneratedMetadata,
} from '../../src/domain/snippet-generated-metadata';

const timestamp = '2026-09-13T00:00:00.000Z';

function createSnippet(
  overrides: Omit<Partial<SnippetEntry>, 'content'> & {
    content?: string | SnippetContent;
  } = {},
): SnippetEntry {
  const { content = 'Default content', ...rest } = overrides;
  return {
    id: 'snippet-default',
    title: 'Default title',
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

function createSnippetRepository(
  records: readonly SnippetEntry[],
): SnippetEntryRepository {
  return {
    create: vi.fn(async () => {
      throw new Error('Not used by drafting retrieval.');
    }),
    get: vi.fn(async () => undefined),
    list: vi.fn(async () => records),
    findByTrigger: vi.fn(async () => undefined),
    update: vi.fn(async () => {
      throw new Error('Not used by drafting retrieval.');
    }),
    delete: vi.fn(async () => false),
  };
}

function createMetadataRepository(
  records: readonly unknown[],
  failure?: Error,
): SnippetGeneratedMetadataRepository {
  return {
    get: vi.fn(async () => undefined),
    list: vi.fn(async () => {
      if (failure !== undefined) throw failure;
      return records as readonly SnippetGeneratedMetadata[];
    }),
    save: vi.fn(async (metadata) => metadata),
    saveIfSourceMatches: vi.fn(async () => false),
    delete: vi.fn(async () => false),
  };
}

describe('DraftingReferenceRetriever', () => {
  it('requires only Snippet capabilities and returns Text Snippet projections without accessing Knowledge', async () => {
    const rich = createSnippet({
      id: 'snippet-rich',
      title: 'Refund response',
      tags: ['private-authored-tag'],
      trigger: ';private-trigger',
      content: {
        kind: 'rich',
        blocks: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                text: 'Refund portal',
                url: 'https://example.com/refund',
                bold: false,
                italic: false,
              },
            ],
          },
        ],
      },
    });
    const repository = createSnippetRepository([rich]);
    const retriever = new DraftingReferenceRetriever(repository);

    const results = await retriever.retrieve('refund');

    expect(results).toEqual([
      {
        kind: 'text-snippet',
        id: rich.id,
        title: rich.title,
        content: 'Refund portal (https://example.com/refund)',
        score: 6,
      },
    ]);
    expect(Object.keys(results[0] ?? {})).toEqual([
      'kind',
      'id',
      'title',
      'content',
      'score',
    ]);
    expect(JSON.stringify(results)).not.toContain('trigger');
    expect(JSON.stringify(results)).not.toContain('tags');
    expect(repository.list).toHaveBeenCalledOnce();
  });

  it('excludes Image Snippets even when every lexical field would match', async () => {
    const image = createSnippet({
      id: 'snippet-image',
      title: 'Refund image',
      tags: ['refund'],
      content: {
        kind: 'image',
        assetId: '123e4567-e89b-42d3-a456-426614174000',
      },
    });
    const retriever = new DraftingReferenceRetriever(
      createSnippetRepository([image]),
    );

    await expect(retriever.retrieve('refund')).resolves.toEqual([]);
  });

  it('preserves title 5, authored-tag 3, content 1, and current generated-tag 1 scoring', async () => {
    const combined = createSnippet({
      id: 'snippet-combined',
      title: 'Refund',
      tags: ['refund'],
      content: 'Refund refund',
    });
    const title = createSnippet({
      id: 'snippet-title',
      title: 'Refund',
      content: 'Unrelated',
    });
    const authoredTag = createSnippet({
      id: 'snippet-authored-tag',
      title: 'Unrelated',
      tags: ['refund refund'],
      content: 'Unrelated',
    });
    const content = createSnippet({
      id: 'snippet-content',
      title: 'Unrelated',
      content: 'Refund refund',
    });
    const generatedTag = createSnippet({
      id: 'snippet-generated-tag',
      title: 'Unrelated',
      content: 'Unrelated',
    });
    const metadata: SnippetGeneratedMetadata = {
      snippetId: generatedTag.id,
      generatedTags: ['refund'],
      sourceFingerprint: await createSnippetSourceFingerprint(generatedTag),
      generatedAt: timestamp,
    };
    const retriever = new DraftingReferenceRetriever(
      createSnippetRepository([
        content,
        authoredTag,
        title,
        generatedTag,
        combined,
      ]),
      createMetadataRepository([metadata]),
    );

    expect(
      (await retriever.retrieve('refund')).map(({ id, score }) => ({
        id,
        score,
      })),
    ).toEqual([
      { id: combined.id, score: 9 },
      { id: title.id, score: 5 },
      { id: authoredTag.id, score: 3 },
      { id: content.id, score: 1 },
      { id: generatedTag.id, score: 1 },
    ]);
  });

  it('treats stale or missing generated metadata as zero without blocking authored retrieval', async () => {
    const stale = createSnippet({
      id: 'snippet-stale',
      title: 'Refund',
      content: 'Unrelated',
    });
    const missing = createSnippet({
      id: 'snippet-missing',
      title: 'Unrelated',
      tags: ['refund'],
      content: 'Unrelated',
    });
    const metadata: SnippetGeneratedMetadata = {
      snippetId: stale.id,
      generatedTags: ['refund'],
      sourceFingerprint: '0'.repeat(64),
      generatedAt: timestamp,
    };
    const retriever = new DraftingReferenceRetriever(
      createSnippetRepository([missing, stale]),
      createMetadataRepository([metadata]),
    );

    expect(
      (await retriever.retrieve('refund')).map(({ id, score }) => ({
        id,
        score,
      })),
    ).toEqual([
      { id: stale.id, score: 5 },
      { id: missing.id, score: 3 },
    ]);
  });

  it('fails soft when generated metadata cannot be read', async () => {
    const snippet = createSnippet({ title: 'Refund', content: 'Unrelated' });
    const retriever = new DraftingReferenceRetriever(
      createSnippetRepository([snippet]),
      createMetadataRepository([], new Error('Unreadable metadata')),
    );

    await expect(retriever.retrieve('refund')).resolves.toEqual([
      {
        kind: 'text-snippet',
        id: snippet.id,
        title: snippet.title,
        content: 'Unrelated',
        score: 5,
      },
    ]);
  });

  it('gives malformed generated metadata zero authority', async () => {
    const snippet = createSnippet({
      id: 'snippet-malformed',
      title: 'Refund',
      content: 'Unrelated',
    });
    const malformed = {
      snippetId: snippet.id,
      generatedTags: ['refund'],
      sourceFingerprint: await createSnippetSourceFingerprint(snippet),
      generatedAt: timestamp,
      unsupportedVersion: 2,
    };
    const retriever = new DraftingReferenceRetriever(
      createSnippetRepository([snippet]),
      createMetadataRepository([null, malformed]),
    );

    expect((await retriever.retrieve('refund'))[0]?.score).toBe(5);
  });

  it('orders by descending score, then createdAt, then ID and returns every positive result', async () => {
    const records = [
      createSnippet({ id: 'snippet-z', content: 'match' }),
      createSnippet({
        id: 'snippet-high',
        title: 'match',
        content: 'Unrelated',
        createdAt: '2026-09-13T00:00:03.000Z',
      }),
      createSnippet({ id: 'snippet-a', content: 'match' }),
      createSnippet({
        id: 'snippet-early',
        content: 'match',
        createdAt: '2026-09-12T23:59:59.000Z',
      }),
      ...Array.from({ length: 9 }, (_, index) =>
        createSnippet({
          id: `snippet-later-${index}`,
          content: 'match',
          createdAt: `2026-09-14T00:00:0${index}.000Z`,
        }),
      ),
    ];
    const retriever = new DraftingReferenceRetriever(
      createSnippetRepository(records),
    );

    const first = await retriever.retrieve('match');
    const second = await retriever.retrieve('match');

    expect(first).toHaveLength(13);
    expect(first.map(({ id }) => id).slice(0, 4)).toEqual([
      'snippet-high',
      'snippet-early',
      'snippet-a',
      'snippet-z',
    ]);
    expect(second).toEqual(first);
  });

  it.each(['', '   ', '!!!', '\t—\n'])(
    'returns empty without repository reads for tokenless query %j',
    async (query) => {
      const snippetRepository = createSnippetRepository([
        createSnippet({ title: 'Would match' }),
      ]);
      const metadataRepository = createMetadataRepository([]);
      const retriever = new DraftingReferenceRetriever(
        snippetRepository,
        metadataRepository,
      );

      await expect(retriever.retrieve(query)).resolves.toEqual([]);
      expect(snippetRepository.list).not.toHaveBeenCalled();
      expect(metadataRepository.list).not.toHaveBeenCalled();
    },
  );

  it('preserves NFKC, lowercase, Unicode tokenization, and query-token set semantics', async () => {
    const snippet = createSnippet({
      id: 'snippet-unicode',
      title: 'ＲＥＦＵＮＤ CAFÉ رقم １２３',
      tags: ['refund'],
      content: 'refund',
    });
    const retriever = new DraftingReferenceRetriever(
      createSnippetRepository([snippet]),
    );

    const single = await retriever.retrieve(' refund café رقم 123 ');
    const repeated = await retriever.retrieve(
      'ＲＥＦＵＮＤ refund CAFÉ café رقم رقم １２３ 123',
    );

    expect(single).toEqual(repeated);
    expect(single[0]?.score).toBe(24);
  });
});
