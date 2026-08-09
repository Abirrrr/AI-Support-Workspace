import { describe, expect, it } from 'vitest';

import {
  MAX_SNIPPET_ASSET_BYTES,
  SnippetAssetValidationError,
  validateSnippetAsset,
  type SnippetAsset,
  type SnippetAssetMimeType,
} from '../../src/domain/snippet-asset';
import { validateSnippetAssetGraph } from '../../src/domain/snippet-asset-graph';
import type { SnippetEntry } from '../../src/domain/snippet-entry';

const SNIPPET_ID = '123e4567-e89b-42d3-a456-426614174000';
const ASSET_ID = '223e4567-e89b-42d3-a456-426614174000';
const CREATED_AT = '2026-08-09T00:00:00.000Z';

const signatures: Record<SnippetAssetMimeType, number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/webp': [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
};

function asset(
  mimeType: SnippetAssetMimeType = 'image/png',
  overrides: Partial<SnippetAsset> = {},
): SnippetAsset {
  const bytes = Uint8Array.from(signatures[mimeType]);
  return {
    id: ASSET_ID,
    snippetId: SNIPPET_ID,
    mimeType,
    blob: new Blob([bytes], { type: mimeType }),
    byteSize: bytes.byteLength,
    originalFilename: 'image.bin',
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function snippet(assetId = ASSET_ID): SnippetEntry {
  return {
    id: SNIPPET_ID,
    title: 'Local image',
    content: {
      kind: 'rich',
      blocks: [{ type: 'image', assetId, altText: 'Receipt' }],
    },
    tags: [],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    trigger: ';receipt',
  };
}

describe('SnippetAsset', () => {
  it.each(Object.keys(signatures) as SnippetAssetMimeType[])(
    'validates actual %s bytes without decoding the image',
    async (mimeType) => {
      await expect(
        validateSnippetAsset(asset(mimeType)),
      ).resolves.toMatchObject({
        mimeType,
      });
    },
  );

  it('rejects MIME disagreement, byte-count disagreement, bad signatures, and oversize blobs', async () => {
    await expect(
      validateSnippetAsset(
        asset('image/png', {
          blob: new Blob([Uint8Array.from(signatures['image/png'])], {
            type: 'image/jpeg',
          }),
        }),
      ),
    ).rejects.toMatchObject({ code: 'invalid-blob' });
    await expect(
      validateSnippetAsset(asset('image/png', { byteSize: 1 })),
    ).rejects.toMatchObject({ code: 'byte-size-mismatch' });
    await expect(
      validateSnippetAsset(
        asset('image/png', {
          blob: new Blob([Uint8Array.from([1, 2, 3, 4])], {
            type: 'image/png',
          }),
          byteSize: 4,
        }),
      ),
    ).rejects.toMatchObject({ code: 'signature-mismatch' });
    const oversized = new Blob([new Uint8Array(MAX_SNIPPET_ASSET_BYTES + 1)], {
      type: 'image/png',
    });
    await expect(
      validateSnippetAsset(
        asset('image/png', {
          blob: oversized,
          byteSize: oversized.size,
        }),
      ),
    ).rejects.toBeInstanceOf(SnippetAssetValidationError);
  });

  it('accepts the exact 5 MiB boundary and rejects unsupported SVG data', async () => {
    const exactBytes = new Uint8Array(MAX_SNIPPET_ASSET_BYTES);
    exactBytes.set(signatures['image/png']);
    await expect(
      validateSnippetAsset(
        asset('image/png', {
          blob: new Blob([exactBytes], { type: 'image/png' }),
          byteSize: exactBytes.byteLength,
        }),
      ),
    ).resolves.toMatchObject({ byteSize: MAX_SNIPPET_ASSET_BYTES });
    await expect(
      validateSnippetAsset({
        ...asset(),
        mimeType: 'image/svg+xml',
        blob: new Blob(['<svg/>'], { type: 'image/svg+xml' }),
        byteSize: 6,
      } as unknown as SnippetAsset),
    ).rejects.toMatchObject({ code: 'unsupported-mime-type' });
  });

  it('accepts repeated references but rejects missing, foreign, orphaned, and over-limit graphs', () => {
    const repeated = {
      ...snippet(),
      content: {
        kind: 'rich' as const,
        blocks: [
          { type: 'image' as const, assetId: ASSET_ID, altText: '' },
          { type: 'image' as const, assetId: ASSET_ID, altText: 'Again' },
        ],
      },
    };
    expect(() =>
      validateSnippetAssetGraph([repeated], [asset()]),
    ).not.toThrow();
    expect(() => validateSnippetAssetGraph([snippet()], [])).toThrowError(
      expect.objectContaining({ code: 'missing-asset' }),
    );
    expect(() =>
      validateSnippetAssetGraph(
        [
          snippet(),
          {
            ...snippet(),
            id: '323e4567-e89b-42d3-a456-426614174000',
            content: { kind: 'plain', text: 'Owner' },
          },
        ],
        [
          asset('image/png', {
            snippetId: '323e4567-e89b-42d3-a456-426614174000',
          }),
        ],
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'foreign-asset-reference' }),
    );
    expect(() =>
      validateSnippetAssetGraph(
        [{ ...snippet(), content: { kind: 'rich', blocks: [] } }],
        [asset()],
      ),
    ).toThrowError(expect.objectContaining({ code: 'orphan-asset' }));
    expect(() =>
      validateSnippetAssetGraph(
        [snippet()],
        [asset('image/png', { byteSize: 20_971_521 })],
      ),
    ).toThrowError(expect.objectContaining({ code: 'snippet-limit-exceeded' }));

    const projectRecords = [0, 1, 2].map((index) => {
      const snippetId = `${index + 4}23e4567-e89b-42d3-a456-426614174000`;
      const assetId = `${index + 7}23e4567-e89b-42d3-a456-426614174000`;
      return {
        snippet: { ...snippet(assetId), id: snippetId },
        asset: asset('image/png', {
          id: assetId,
          snippetId,
          byteSize: 15_000_000,
        }),
      };
    });
    expect(() =>
      validateSnippetAssetGraph(
        projectRecords.map(({ snippet: record }) => record),
        projectRecords.map(({ asset: record }) => record),
      ),
    ).toThrowError(expect.objectContaining({ code: 'project-limit-exceeded' }));
  });

  it('enforces exactly one same-owner asset for top-level Image Snippets', () => {
    const imageSnippet: SnippetEntry = {
      ...snippet(),
      content: { kind: 'image', assetId: ASSET_ID },
    };
    expect(() =>
      validateSnippetAssetGraph([imageSnippet], [asset()]),
    ).not.toThrow();
    expect(() => validateSnippetAssetGraph([imageSnippet], [])).toThrowError(
      expect.objectContaining({ code: 'missing-asset' }),
    );
    expect(() =>
      validateSnippetAssetGraph(
        [
          imageSnippet,
          {
            ...snippet(),
            id: '323e4567-e89b-42d3-a456-426614174000',
            content: { kind: 'plain', text: 'Foreign owner' },
          },
        ],
        [
          asset('image/png', {
            snippetId: '323e4567-e89b-42d3-a456-426614174000',
          }),
        ],
      ),
    ).toThrowError(
      expect.objectContaining({ code: 'foreign-asset-reference' }),
    );
    expect(() =>
      validateSnippetAssetGraph(
        [imageSnippet],
        [
          asset(),
          asset('image/jpeg', {
            id: '423e4567-e89b-42d3-a456-426614174000',
          }),
        ],
      ),
    ).toThrowError(expect.objectContaining({ code: 'orphan-asset' }));
  });
});
