import { describe, expect, it, vi } from 'vitest';

import type { SnippetAssetRepository } from '../../src/application/persistence/snippet-asset-repository';
import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import {
  SnippetDeliveryError,
  SnippetDeliveryPlanner,
} from '../../src/application/snippet/snippet-delivery-planner';
import type { SnippetAsset } from '../../src/domain/snippet-asset';
import type { SnippetEntry } from '../../src/domain/snippet-entry';

const snippetId = '123e4567-e89b-42d3-a456-426614174001';
const assetId = '123e4567-e89b-42d3-a456-426614174002';

function png(width = 1, height = 1) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function entry(content: SnippetEntry['content']): SnippetEntry {
  return {
    id: snippetId,
    title: 'Snippet',
    content,
    tags: [],
    createdAt: '2026-08-09T00:00:00.000Z',
    updatedAt: '2026-08-09T00:00:00.000Z',
    trigger: ';hello',
  };
}

function asset(overrides: Partial<SnippetAsset> = {}): SnippetAsset {
  const bytes = png();
  return {
    id: assetId,
    snippetId,
    mimeType: 'image/png',
    blob: new Blob([bytes], { type: 'image/png' }),
    byteSize: bytes.byteLength,
    originalFilename: 'screenshot.png',
    createdAt: '2026-08-09T00:00:00.000Z',
    ...overrides,
  };
}

function plannerFor(
  snippet: SnippetEntry | undefined,
  assets: readonly SnippetAsset[] = [],
) {
  const snippetRepository: SnippetEntryRepository = {
    create: vi.fn(),
    get: vi.fn(async () => snippet),
    list: vi.fn(),
    findByTrigger: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const assetRepository: SnippetAssetRepository = {
    get: vi.fn(async (id) => assets.find((candidate) => candidate.id === id)),
    listBySnippet: vi.fn(async (id) =>
      assets.filter((candidate) => candidate.snippetId === id),
    ),
  };
  return {
    planner: new SnippetDeliveryPlanner(snippetRepository, assetRepository),
    assetRepository,
  };
}

describe('unified authoritative Snippet delivery planner', () => {
  it('plans historical Plain and supported Rich through one Text plan', async () => {
    const plain = plannerFor(
      entry({ kind: 'plain', text: 'Hello\n\nWorld' }),
    ).planner;
    await expect(
      plain.plan({ snippetId, trigger: ';hello', kind: 'text' }),
    ).resolves.toEqual({
      kind: 'text',
      snippetId,
      plainText: 'Hello\n\nWorld',
      html: '<p>Hello</p><p>World</p>',
    });

    const rich = plannerFor(
      entry({
        kind: 'rich',
        blocks: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Bold', bold: true, italic: false },
            ],
          },
        ],
      }),
    ).planner;
    await expect(
      rich.plan({ snippetId, trigger: ';hello', kind: 'text' }),
    ).resolves.toMatchObject({
      kind: 'text',
      plainText: 'Bold',
      html: '<p><strong>Bold</strong></p>',
    });
  });

  it('loads and validates the one authoritative owned Image asset after activation', async () => {
    const imageAsset = asset();
    const { planner, assetRepository } = plannerFor(
      entry({ kind: 'image', assetId }),
      [imageAsset],
    );
    await expect(
      planner.plan({ snippetId, trigger: ';hello', kind: 'image' }),
    ).resolves.toEqual({
      kind: 'image',
      snippetId,
      mimeType: 'image/png',
      blob: imageAsset.blob,
      dimensions: { width: 1, height: 1 },
    });
    expect(assetRepository.get).toHaveBeenCalledWith(assetId);
    expect(assetRepository.listBySnippet).toHaveBeenCalledWith(snippetId);
  });

  it.each([
    [
      'deleted',
      undefined,
      { snippetId, trigger: ';hello', kind: 'text' as const },
    ],
    [
      'stale trigger',
      entry({ kind: 'plain', text: 'text' }),
      { snippetId, trigger: ';stale', kind: 'text' as const },
    ],
    [
      'kind mismatch',
      entry({ kind: 'plain', text: 'text' }),
      { snippetId, trigger: ';hello', kind: 'image' as const },
    ],
  ])(
    'rejects %s catalog activation safely',
    async (_label, snippet, request) => {
      await expect(
        plannerFor(snippet).planner.plan(request),
      ).rejects.toBeInstanceOf(SnippetDeliveryError);
    },
  );

  it('keeps Decision 38 legacy local-image Rich content fail-closed', async () => {
    await expect(
      plannerFor(
        entry({
          kind: 'rich',
          blocks: [{ type: 'image', assetId, altText: 'legacy' }],
        }),
      ).planner.plan({ snippetId, trigger: ';hello', kind: 'text' }),
    ).rejects.toMatchObject({ code: 'unsupported-content' });
  });

  it('rejects missing, foreign, unreferenced-extra, and invalid assets', async () => {
    const imageSnippet = entry({ kind: 'image', assetId });
    await expect(
      plannerFor(imageSnippet).planner.plan({
        snippetId,
        trigger: ';hello',
        kind: 'image',
      }),
    ).rejects.toMatchObject({ code: 'asset-unavailable' });

    const foreign = asset({
      snippetId: '123e4567-e89b-42d3-a456-426614174099',
    });
    await expect(
      plannerFor(imageSnippet, [foreign]).planner.plan({
        snippetId,
        trigger: ';hello',
        kind: 'image',
      }),
    ).rejects.toBeInstanceOf(SnippetDeliveryError);

    const extra = asset({ id: '123e4567-e89b-42d3-a456-426614174003' });
    await expect(
      plannerFor(imageSnippet, [asset(), extra]).planner.plan({
        snippetId,
        trigger: ';hello',
        kind: 'image',
      }),
    ).rejects.toMatchObject({ code: 'asset-ownership-invalid' });

    const invalidBlob = new Blob([Uint8Array.from([1, 2, 3])], {
      type: 'image/png',
    });
    await expect(
      plannerFor(imageSnippet, [
        asset({ blob: invalidBlob, byteSize: invalidBlob.size }),
      ]).planner.plan({ snippetId, trigger: ';hello', kind: 'image' }),
    ).rejects.toMatchObject({ code: 'asset-invalid' });
  });

  it('runs metadata safety before any decoder boundary exists', async () => {
    const oversized = png(8192, 2049);
    const oversizedAsset = asset({
      blob: new Blob([oversized], { type: 'image/png' }),
      byteSize: oversized.byteLength,
    });
    await expect(
      plannerFor(entry({ kind: 'image', assetId }), [
        oversizedAsset,
      ]).planner.plan({
        snippetId,
        trigger: ';hello',
        kind: 'image',
      }),
    ).rejects.toMatchObject({ code: 'image-too-large' });
  });
});
