import { describe, expect, it, vi } from 'vitest';

import type {
  BackupSnapshot,
  TransactionalBackupRestorePort,
} from '../../src/application/backup/backup-ports';
import { BackupRestoreService } from '../../src/application/backup/backup-service';
import { parseBackupFile } from '../../src/application/backup/backup-validator';
import {
  decodeCanonicalBase64,
  encodeBase64,
} from '../../src/application/backup/base64';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION_4,
  type BackupFileV4,
} from '../../src/domain/backup-file';
import {
  MAX_SNIPPET_ASSET_BYTES,
  type SnippetAsset,
} from '../../src/domain/snippet-asset';
import { validateSnippetAssetGraph } from '../../src/domain/snippet-asset-graph';

const SNIPPET_ID = '123e4567-e89b-42d3-a456-426614174000';
const ASSET_ID = '223e4567-e89b-42d3-a456-426614174000';
const CREATED_AT = '2026-08-09T00:00:00.000Z';
const BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff,
]);

function createAsset(overrides: Partial<SnippetAsset> = {}): SnippetAsset {
  return {
    id: ASSET_ID,
    snippetId: SNIPPET_ID,
    mimeType: 'image/png',
    blob: new Blob([BYTES], { type: 'image/png' }),
    byteSize: BYTES.byteLength,
    originalFilename: 'receipt.png',
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function createSnapshot(): BackupSnapshot {
  return {
    knowledge: [],
    snippets: [
      {
        id: SNIPPET_ID,
        title: 'Receipt',
        content: {
          kind: 'rich',
          blocks: [
            { type: 'image', assetId: ASSET_ID, altText: 'Receipt image' },
          ],
        },
        tags: ['asset'],
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
        trigger: ';receipt',
      },
    ],
    snippetAssets: [createAsset()],
    settings: { defaultModel: null },
  };
}

async function exportV4(snapshot = createSnapshot()): Promise<string> {
  const snippets = snapshot.snippets.map((entry) => {
    if (entry.content.kind !== 'rich') {
      throw new Error('Expected historical Rich fixture.');
    }
    return {
      id: entry.id,
      title: entry.title,
      content: {
        kind: 'rich' as const,
        blocks: entry.content.blocks.map((block) => {
          if (block.type === 'list') {
            throw new Error('Backup v4 cannot contain lists.');
          }
          return block.type === 'paragraph'
            ? {
                type: 'paragraph' as const,
                children: block.children.map((inline) => ({ ...inline })),
              }
            : { ...block };
        }),
      },
      tags: [...entry.tags],
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      trigger: entry.trigger,
    };
  });
  const snippetAssets = await Promise.all(
    [...snapshot.snippetAssets]
      .sort((left, right) =>
        left.createdAt === right.createdAt
          ? left.id.localeCompare(right.id)
          : left.createdAt.localeCompare(right.createdAt),
      )
      .map(async (asset) => ({
        id: asset.id,
        snippetId: asset.snippetId,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
        originalFilename: asset.originalFilename,
        createdAt: asset.createdAt,
        encoding: 'base64' as const,
        data: encodeBase64(new Uint8Array(await asset.blob.arrayBuffer())),
      })),
  );
  const backup: BackupFileV4 = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_4,
    exportedAt: CREATED_AT,
    data: {
      knowledge: [],
      snippets,
      snippetAssets,
      settings: { defaultModel: snapshot.settings.defaultModel },
    },
  };
  return JSON.stringify(backup);
}

describe('Backup v4 local image assets', () => {
  it('exports dedicated DTOs and restores exact Blob bytes and metadata', async () => {
    const serialized = await exportV4();
    const json = JSON.parse(serialized) as BackupFileV4;
    expect(json.formatVersion).toBe(BACKUP_FORMAT_VERSION_4);
    expect(json.data.snippetAssets).toEqual([
      {
        id: ASSET_ID,
        snippetId: SNIPPET_ID,
        mimeType: 'image/png',
        byteSize: BYTES.byteLength,
        originalFilename: 'receipt.png',
        createdAt: CREATED_AT,
        encoding: 'base64',
        data: encodeBase64(BYTES),
      },
    ]);
    expect(serialized).not.toContain('blob');

    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => undefined,
    );
    await new BackupRestoreService({ replaceAll }).restoreBackup(
      parseBackupFile(serialized),
    );
    const restored = replaceAll.mock.calls[0]?.[0];
    expect(restored?.snippets[0]?.content).toEqual(
      createSnapshot().snippets[0]?.content,
    );
    expect(restored?.snippets[0]?.content.kind).toBe('rich');
    const restoredAsset = restored?.snippetAssets?.[0];
    expect(restoredAsset).toMatchObject({
      id: ASSET_ID,
      snippetId: SNIPPET_ID,
      mimeType: 'image/png',
      byteSize: BYTES.byteLength,
      originalFilename: 'receipt.png',
    });
    if (restoredAsset === undefined) throw new Error('Missing restored asset.');
    expect(new Uint8Array(await restoredAsset.blob.arrayBuffer())).toEqual(
      BYTES,
    );
  });

  it('round-trips multiple separately owned JPEG/WebP assets in deterministic order', async () => {
    const jpegId = '323e4567-e89b-42d3-a456-426614174000';
    const webpId = '423e4567-e89b-42d3-a456-426614174000';
    const secondSnippetId = '523e4567-e89b-42d3-a456-426614174000';
    const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0x00]);
    const webpBytes = Uint8Array.from([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    const baseSnippet = createSnapshot().snippets[0];
    if (baseSnippet === undefined) throw new Error('Missing Snippet fixture.');
    const snapshot: BackupSnapshot = {
      knowledge: [],
      snippets: [
        {
          ...baseSnippet,
          content: {
            kind: 'rich',
            blocks: [{ type: 'image', assetId: jpegId, altText: 'JPEG' }],
          },
        },
        {
          ...baseSnippet,
          id: secondSnippetId,
          content: {
            kind: 'rich',
            blocks: [{ type: 'image', assetId: webpId, altText: 'WebP' }],
          },
          trigger: ';webp',
        },
      ],
      snippetAssets: [
        createAsset({
          id: webpId,
          snippetId: secondSnippetId,
          mimeType: 'image/webp',
          blob: new Blob([webpBytes], { type: 'image/webp' }),
          byteSize: webpBytes.byteLength,
          createdAt: '2026-08-09T00:00:02.000Z',
        }),
        createAsset({
          id: jpegId,
          mimeType: 'image/jpeg',
          blob: new Blob([jpegBytes], { type: 'image/jpeg' }),
          byteSize: jpegBytes.byteLength,
          createdAt: '2026-08-09T00:00:01.000Z',
        }),
      ],
      settings: { defaultModel: null },
    };
    const serialized = await exportV4(snapshot);
    const parsed = parseBackupFile(serialized);
    if (parsed.formatVersion !== 4) throw new Error('Expected Backup v4.');
    expect(parsed.data.snippetAssets.map(({ id }) => id)).toEqual([
      jpegId,
      webpId,
    ]);
    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => undefined,
    );
    await new BackupRestoreService({ replaceAll }).restoreBackup(parsed);
    const assets = replaceAll.mock.calls[0]?.[0].snippetAssets;
    expect(
      await Promise.all(
        (assets ?? []).map(async ({ blob }) =>
          Array.from(new Uint8Array(await blob.arrayBuffer())),
        ),
      ),
    ).toEqual([Array.from(jpegBytes), Array.from(webpBytes)]);
  });

  it('accepts only canonical padded RFC 4648 base64', () => {
    expect(decodeCanonicalBase64('AQI=')).toEqual(Uint8Array.from([1, 2]));
    for (const invalid of [
      'AQI',
      'AQI=\n',
      'data:image/png;base64,AQI=',
      'Af==',
    ]) {
      expect(() => decodeCanonicalBase64(invalid)).toThrow();
    }
  });

  it('rejects a Backup v4 asset declared above the 5 MiB decoded limit', async () => {
    const backup = JSON.parse(await exportV4()) as BackupFileV4;
    const asset = backup.data.snippetAssets[0];
    if (asset === undefined) throw new Error('Missing asset fixture.');
    (asset as { byteSize: number }).byteSize = MAX_SNIPPET_ASSET_BYTES + 1;

    expect(() => parseBackupFile(JSON.stringify(backup))).toThrowError(
      expect.objectContaining({ code: 'invalid' }),
    );
  });

  it('applies shared 20 MiB and 40 MiB graph limits to Backup-shaped metadata', () => {
    function uuid(seed: number): string {
      return `${seed.toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`;
    }

    const oneSnippetId = uuid(100);
    const oneSnippetAssets = Array.from({ length: 5 }, (_, index) => ({
      id: uuid(200 + index),
      snippetId: oneSnippetId,
      byteSize: 4_200_000,
    }));
    expect(() =>
      validateSnippetAssetGraph(
        [
          {
            id: oneSnippetId,
            content: {
              kind: 'rich',
              blocks: oneSnippetAssets.map(({ id }) => ({
                type: 'image',
                assetId: id,
                altText: '',
              })),
            },
          },
        ],
        oneSnippetAssets,
      ),
    ).toThrowError(expect.objectContaining({ code: 'snippet-limit-exceeded' }));

    const projectSnippets = Array.from({ length: 3 }, (_, snippetIndex) => {
      const snippetId = uuid(300 + snippetIndex);
      const assets = Array.from({ length: 3 }, (_, assetIndex) => ({
        id: uuid(400 + snippetIndex * 3 + assetIndex),
        snippetId,
        byteSize: 5_000_000,
      }));
      return {
        snippet: {
          id: snippetId,
          content: {
            kind: 'rich' as const,
            blocks: assets.map(({ id }) => ({
              type: 'image' as const,
              assetId: id,
              altText: '',
            })),
          },
        },
        assets,
      };
    });
    expect(() =>
      validateSnippetAssetGraph(
        projectSnippets.map(({ snippet }) => snippet),
        projectSnippets.flatMap(({ assets }) => assets),
      ),
    ).toThrowError(expect.objectContaining({ code: 'project-limit-exceeded' }));
  });

  it.each([
    [
      'unknown key',
      (backup: BackupFileV4) => {
        Object.assign(backup.data.snippetAssets[0] as object, { future: true });
      },
    ],
    [
      'noncanonical base64',
      (backup: BackupFileV4) => {
        (backup.data.snippetAssets[0] as { data: string }).data += '\n';
      },
    ],
    [
      'byte mismatch',
      (backup: BackupFileV4) => {
        (backup.data.snippetAssets[0] as { byteSize: number }).byteSize = 1;
      },
    ],
    [
      'signature mismatch',
      (backup: BackupFileV4) => {
        (backup.data.snippetAssets[0] as { data: string }).data = 'AQIDBA==';
        (backup.data.snippetAssets[0] as { byteSize: number }).byteSize = 4;
      },
    ],
    [
      'missing asset reference',
      (backup: BackupFileV4) => {
        (backup.data.snippetAssets as unknown[]).splice(0, 1);
      },
    ],
    [
      'duplicate asset ID',
      (backup: BackupFileV4) => {
        const asset = backup.data.snippetAssets[0];
        if (asset === undefined) throw new Error('Missing asset fixture.');
        (backup.data.snippetAssets as unknown[]).push({ ...asset });
      },
    ],
    [
      'foreign asset ownership',
      (backup: BackupFileV4) => {
        const asset = backup.data.snippetAssets[0];
        if (asset === undefined) throw new Error('Missing asset fixture.');
        (asset as { snippetId: string }).snippetId =
          '623e4567-e89b-42d3-a456-426614174000';
      },
    ],
    [
      'malformed local image block',
      (backup: BackupFileV4) => {
        const snippet = backup.data.snippets[0];
        if (snippet === undefined) throw new Error('Missing Snippet fixture.');
        const content = snippet.content;
        if (content.kind !== 'rich') throw new Error('Expected Rich fixture.');
        Object.assign(content.blocks[0] as object, { extra: true });
      },
    ],
    [
      'dangerous object key',
      (backup: BackupFileV4) => {
        Object.defineProperty(backup.data, '__proto__', {
          enumerable: true,
          value: {},
        });
      },
    ],
    [
      'orphan asset',
      (backup: BackupFileV4) => {
        const snippet = backup.data.snippets[0];
        if (snippet === undefined) throw new Error('Missing Snippet fixture.');
        (
          snippet as unknown as { content: { blocks: unknown[] } }
        ).content.blocks = [];
      },
    ],
  ])('rejects %s before restore', async (_label, mutate) => {
    const backup = JSON.parse(await exportV4()) as BackupFileV4;
    mutate(backup);
    expect(() => parseBackupFile(JSON.stringify(backup))).toThrowError(
      expect.objectContaining({ code: 'invalid' }),
    );
  });
});
