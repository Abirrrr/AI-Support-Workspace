import { describe, expect, it, vi } from 'vitest';

import type { GenerateSnippetTags } from '../../src/application/generation/generate-snippet-tags';
import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import type { SnippetGeneratedMetadataRepository } from '../../src/application/persistence/snippet-generated-metadata-repository';
import {
  MAX_SNIPPET_TAG_BACKFILL_RECORDS,
  SnippetTagBackfillService,
  SnippetTagGenerationService,
  parseGeneratedSnippetTags,
} from '../../src/application/snippet/snippet-tag-generation';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import { createPlainSnippetContent } from '../../src/domain/snippet-content';
import {
  createSnippetSourceFingerprint,
  hasSameGeneratedMetadataSource,
  type SnippetGeneratedMetadata,
  type SnippetGeneratedMetadataSource,
} from '../../src/domain/snippet-generated-metadata';

const NOW = '2026-08-27T04:05:06.000Z';

function snippet(overrides: Partial<SnippetEntry> = {}): SnippetEntry {
  return {
    id: '123e4567-e89b-42d3-a456-426614174000',
    title: 'Refund follow up',
    content: createPlainSnippetContent('Payment status response'),
    tags: ['Billing'],
    trigger: ';refund',
    createdAt: '2026-08-20T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
    ...overrides,
  };
}

class MemorySnippetRepository implements SnippetEntryRepository {
  readonly records = new Map<string, SnippetEntry>();

  constructor(records: readonly SnippetEntry[]) {
    for (const record of records) this.records.set(record.id, record);
  }

  async create(): Promise<SnippetEntry> {
    throw new Error('Not used.');
  }

  async get(id: string): Promise<SnippetEntry | undefined> {
    return this.records.get(id);
  }

  async list(): Promise<readonly SnippetEntry[]> {
    return [...this.records.values()];
  }

  async findByTrigger(): Promise<SnippetEntry | undefined> {
    return undefined;
  }

  async update(): Promise<SnippetEntry> {
    throw new Error('Not used.');
  }

  async delete(): Promise<boolean> {
    return false;
  }
}

class MemoryMetadataRepository implements SnippetGeneratedMetadataRepository {
  readonly records = new Map<string, SnippetGeneratedMetadata>();
  failSave = false;

  constructor(private readonly snippets: MemorySnippetRepository) {}

  async get(id: string): Promise<SnippetGeneratedMetadata | undefined> {
    return this.records.get(id);
  }

  async list(): Promise<readonly SnippetGeneratedMetadata[]> {
    return [...this.records.values()];
  }

  async save(
    metadata: SnippetGeneratedMetadata,
  ): Promise<SnippetGeneratedMetadata> {
    this.records.set(metadata.snippetId, metadata);
    return metadata;
  }

  async saveIfSourceMatches(
    metadata: SnippetGeneratedMetadata,
    source: SnippetGeneratedMetadataSource,
  ): Promise<boolean> {
    if (this.failSave) throw new Error('forced persistence failure');
    const current = this.snippets.records.get(metadata.snippetId);
    if (
      current === undefined ||
      current.content.kind === 'image' ||
      !hasSameGeneratedMetadataSource(current, source)
    ) {
      return false;
    }
    this.records.set(metadata.snippetId, metadata);
    return true;
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('M14-O strict generated-tag parser', () => {
  it.each([
    [
      'simple array',
      '["refund","payment status"]',
      ['refund', 'payment status'],
    ],
    ['Unicode', '["Café","দ্রুত","東京"]', ['café', 'দ্রুত', '東京']],
    [
      'normalization',
      '["  REFUND  STATUS  ","ＡＢＣ"]',
      ['refund status', 'abc'],
    ],
    ['deduplication', '["refund","Refund"," refund "]', ['refund']],
    [
      'exactly eight tags',
      JSON.stringify(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']),
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    ],
    [
      'exactly 40 code points',
      JSON.stringify(['😀'.repeat(40)]),
      ['😀'.repeat(40)],
    ],
  ])('accepts %s', (_label, raw, expected) => {
    expect(parseGeneratedSnippetTags(raw)).toEqual(expected);
  });

  it.each([
    ['empty response', ''],
    ['whitespace response', '   '],
    ['malformed JSON', '["refund"'],
    ['top-level object', '{"tags":["refund"]}'],
    ['top-level number', '1'],
    ['top-level string', '"refund"'],
    ['top-level null', 'null'],
    ['prose before', 'Here: ["refund"]'],
    ['prose after', '["refund"] thanks'],
    ['code fence', '```json\n["refund"]\n```'],
    ['nested array', '[["refund"]]'],
    ['nested object', '[{"tag":"refund"}]'],
    ['number element', '["refund",1]'],
    ['boolean element', '[true]'],
    ['null element', '[null]'],
    [
      'more than eight',
      JSON.stringify(Array.from({ length: 9 }, (_, i) => `t${i}`)),
    ],
    ['empty normalized tag', '["   "]'],
    ['over 40 code points', JSON.stringify(['a'.repeat(41)])],
    ['control character', JSON.stringify(['refund\u0001'])],
    ['newline', JSON.stringify(['refund\nstatus'])],
    ['HTML', JSON.stringify(['<b>refund</b>'])],
    ['trailing non-whitespace', '["refund"]\n!'],
    ['over 4 KiB', JSON.stringify(['a'.repeat(4097)])],
  ])('rejects %s', (_label, raw) => {
    expect(() => parseGeneratedSnippetTags(raw)).toThrow(
      'Generated Snippet tag',
    );
  });
});

describe('M14-O generated-tag application lifecycle', () => {
  function setup(generator: GenerateSnippetTags) {
    const authoritative = snippet();
    const snippets = new MemorySnippetRepository([authoritative]);
    const metadata = new MemoryMetadataRepository(snippets);
    const service = new SnippetTagGenerationService(
      snippets,
      metadata,
      generator,
      () => new Date(NOW),
    );
    return { authoritative, snippets, metadata, service };
  }

  it('persists normalized metadata for a current immutable semantic snapshot', async () => {
    const generate = vi.fn<GenerateSnippetTags['generate']>(async () =>
      Promise.resolve('[" Refund ","PAYMENT   STATUS","refund"]'),
    );
    const { authoritative, metadata, service } = setup({ generate });

    const result = await service.generateForSnippet(authoritative.id);

    expect(result).toEqual({
      status: 'persisted',
      metadata: {
        snippetId: authoritative.id,
        generatedTags: ['refund', 'payment status'],
        sourceFingerprint: await createSnippetSourceFingerprint(authoritative),
        generatedAt: NOW,
      },
    });
    expect(metadata.records.get(authoritative.id)).toEqual(
      result.status === 'persisted' ? result.metadata : undefined,
    );
    const request = generate.mock.calls[0]?.[0];
    expect(JSON.parse(request?.input ?? '')).toEqual({
      title: authoritative.title,
      content: 'Payment status response',
      authoredTags: ['Billing'],
    });
    expect(request?.input).not.toContain(authoritative.trigger ?? '');
  });

  it('discards a result when source A changes to B before completion', async () => {
    const pending = deferred<string>();
    const generate = vi.fn<GenerateSnippetTags['generate']>(
      () => pending.promise,
    );
    const { authoritative, snippets, metadata, service } = setup({ generate });
    const running = service.generateForSnippet(authoritative.id);
    await vi.waitFor(() => expect(generate).toHaveBeenCalledOnce());
    snippets.records.set(authoritative.id, {
      ...authoritative,
      title: 'Material state B',
      tags: [...authoritative.tags],
    });

    pending.resolve('["state a"]');

    await expect(running).resolves.toEqual({
      status: 'skipped',
      reason: 'stale-source',
    });
    expect(metadata.records.size).toBe(0);
  });

  it('prevents an older concurrent generation from overwriting a newer result', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const generate = vi
      .fn<GenerateSnippetTags['generate']>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const { authoritative, metadata, service } = setup({ generate });
    const older = service.generateForSnippet(authoritative.id);
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1));
    const newer = service.generateForSnippet(authoritative.id);
    await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(2));

    second.resolve('["newer"]');
    await expect(newer).resolves.toMatchObject({ status: 'persisted' });
    first.resolve('["older"]');
    await expect(older).resolves.toEqual({
      status: 'skipped',
      reason: 'superseded',
    });
    expect(metadata.records.get(authoritative.id)?.generatedTags).toEqual([
      'newer',
    ]);
  });

  it('fails safely for generation, parser, persistence, oversized input, and Image records', async () => {
    const generate = vi.fn<GenerateSnippetTags['generate']>(async () => {
      throw new Error('provider-like fake failure');
    });
    const { authoritative, snippets, metadata, service } = setup({ generate });
    const before = structuredClone(authoritative);
    await expect(
      service.generateForSnippet(authoritative.id),
    ).resolves.toMatchObject({
      status: 'failed',
      error: { code: 'generation-failed' },
    });
    expect(snippets.records.get(authoritative.id)).toEqual(before);
    expect(metadata.records.size).toBe(0);

    const invalid = setup({ generate: async () => 'not json' });
    await expect(
      invalid.service.generateForSnippet(authoritative.id),
    ).resolves.toMatchObject({
      status: 'failed',
      error: { code: 'invalid-response' },
    });
    invalid.metadata.failSave = true;
    const persistence = new SnippetTagGenerationService(
      invalid.snippets,
      invalid.metadata,
      { generate: async () => '["valid"]' },
      () => new Date(NOW),
    );
    await expect(
      persistence.generateForSnippet(authoritative.id),
    ).resolves.toMatchObject({
      status: 'failed',
      error: { code: 'persistence-failed' },
    });
    expect(invalid.snippets.records.get(authoritative.id)).toEqual(before);
    expect(invalid.metadata.records.size).toBe(0);

    const oversized = snippet({
      id: '223e4567-e89b-42d3-a456-426614174000',
      content: createPlainSnippetContent('界'.repeat(22_000)),
    });
    const image = snippet({
      id: '323e4567-e89b-42d3-a456-426614174000',
      content: {
        kind: 'image',
        assetId: '423e4567-e89b-42d3-a456-426614174000',
      },
    });
    invalid.snippets.records.set(oversized.id, oversized);
    invalid.snippets.records.set(image.id, image);
    const noCall = vi.fn<GenerateSnippetTags['generate']>(async () => '[]');
    const skipService = new SnippetTagGenerationService(
      invalid.snippets,
      invalid.metadata,
      { generate: noCall },
    );
    await expect(skipService.generateForSnippet(oversized.id)).resolves.toEqual(
      {
        status: 'skipped',
        reason: 'input-too-large',
      },
    );
    await expect(skipService.generateForSnippet(image.id)).resolves.toEqual({
      status: 'skipped',
      reason: 'image-snippet',
    });
    expect(noCall).not.toHaveBeenCalled();
  });
});

describe('M14-O explicit generated-tag backfill', () => {
  it('selects Text only in deterministic order, skips valid metadata, caps at 20, and runs concurrency one', async () => {
    const records = Array.from({ length: 23 }, (_, index) =>
      snippet({
        id: `00000000-0000-4000-8000-${String(22 - index).padStart(12, '0')}`,
        title: `Snippet ${index}`,
        createdAt: '2026-08-20T00:00:00.000Z',
      }),
    );
    const image = snippet({
      id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      content: {
        kind: 'image',
        assetId: '123e4567-e89b-42d3-a456-426614174000',
      },
    });
    const snippets = new MemorySnippetRepository([...records, image]);
    const metadata = new MemoryMetadataRepository(snippets);
    const valid = records[0];
    if (valid === undefined) throw new Error('Missing fixture.');
    metadata.records.set(valid.id, {
      snippetId: valid.id,
      generatedTags: ['valid'],
      sourceFingerprint: await createSnippetSourceFingerprint(valid),
      generatedAt: NOW,
    });
    const stale = records.at(-1);
    if (stale === undefined) throw new Error('Missing stale fixture.');
    metadata.records.set(stale.id, {
      snippetId: stale.id,
      generatedTags: ['stale'],
      sourceFingerprint: '0'.repeat(64),
      generatedAt: NOW,
    });

    let inFlight = 0;
    let maxInFlight = 0;
    const order: string[] = [];
    const generationService = {
      generateForSnippet: async (snippetId: string) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        order.push(snippetId);
        await Promise.resolve();
        inFlight -= 1;
        return snippetId.endsWith('000000000010')
          ? ({
              status: 'failed',
              error: { code: 'generation-failed', cause: new Error('fake') },
            } as const)
          : ({
              status: 'persisted',
              metadata: {
                snippetId,
                generatedTags: ['tag'],
                sourceFingerprint: 'a'.repeat(64),
                generatedAt: NOW,
              },
            } as const);
      },
    };

    const result = await new SnippetTagBackfillService(
      snippets,
      metadata,
      generationService,
    ).backfill();

    const expected = records
      .filter((record) => record.id !== valid.id)
      .sort((left, right) => left.id.localeCompare(right.id))
      .slice(0, MAX_SNIPPET_TAG_BACKFILL_RECORDS)
      .map(({ id }) => id);
    expect(order).toEqual(expected);
    expect(result.items.map(({ snippetId }) => snippetId)).toEqual(expected);
    expect(result.items).toHaveLength(20);
    expect(maxInFlight).toBe(1);
    expect(result.items.some(({ result }) => result.status === 'failed')).toBe(
      true,
    );
    expect(order).not.toContain(image.id);
    expect(order).toContain(stale.id);
  });

  it('honors explicit cancellation without starting later records', async () => {
    const records = [
      snippet({ id: '00000000-0000-4000-8000-000000000001' }),
      snippet({ id: '00000000-0000-4000-8000-000000000002' }),
    ];
    const snippets = new MemorySnippetRepository(records);
    const metadata = new MemoryMetadataRepository(snippets);
    const controller = new AbortController();
    const generateForSnippet = vi.fn(async (snippetId: string) => {
      controller.abort();
      return {
        status: 'skipped' as const,
        reason: 'superseded' as const,
        snippetId,
      };
    });

    const result = await new SnippetTagBackfillService(snippets, metadata, {
      generateForSnippet,
    }).backfill(controller.signal);

    expect(generateForSnippet).toHaveBeenCalledOnce();
    expect(result.items).toHaveLength(1);
  });
});
