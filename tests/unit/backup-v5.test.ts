import { describe, expect, it, vi } from 'vitest';

import type {
  BackupDownloadPort,
  BackupSnapshot,
  TransactionalBackupRestorePort,
} from '../../src/application/backup/backup-ports';
import {
  BackupExportService,
  BackupRestoreService,
  assertBackupFitsByteLimit,
} from '../../src/application/backup/backup-service';
import { parseBackupFile } from '../../src/application/backup/backup-validator';
import { encodeBase64 } from '../../src/application/backup/base64';
import {
  BACKUP_FORMAT_VERSION_7,
  MAX_BACKUP_V7_BYTES,
  type BackupFileV7,
} from '../../src/domain/backup-file';
import type {
  SnippetAsset,
  SnippetAssetMimeType,
} from '../../src/domain/snippet-asset';

const RICH_ID = '123e4567-e89b-42d3-a456-426614174000';
const IMAGE_ID = '223e4567-e89b-42d3-a456-426614174000';
const ASSET_ID = '323e4567-e89b-42d3-a456-426614174000';
const EXTRA_ASSET_ID = '423e4567-e89b-42d3-a456-426614174000';
const CREATED_AT = '2026-08-09T00:00:00.000Z';

const signatures: Record<SnippetAssetMimeType, number[]> = {
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff, 0x00],
  'image/webp': [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
};

function createAsset(
  mimeType: SnippetAssetMimeType = 'image/png',
  overrides: Partial<SnippetAsset> = {},
): SnippetAsset {
  const bytes = Uint8Array.from(signatures[mimeType]);
  return {
    id: ASSET_ID,
    snippetId: IMAGE_ID,
    mimeType,
    blob: new Blob([bytes], { type: mimeType }),
    byteSize: bytes.byteLength,
    originalFilename: `private-${mimeType.split('/')[1]}.bin`,
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function createSnapshot(
  mimeType: SnippetAssetMimeType = 'image/png',
): BackupSnapshot {
  return {
    knowledge: [],
    snippets: [
      {
        id: RICH_ID,
        title: 'Steps',
        content: {
          kind: 'rich',
          blocks: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: 'Steps:', bold: true, italic: false },
              ],
            },
            {
              type: 'list',
              listType: 'unordered',
              items: [
                {
                  children: [
                    {
                      type: 'link',
                      text: 'Open settings',
                      url: 'https://example.com/settings',
                      bold: false,
                      italic: true,
                    },
                  ],
                },
              ],
            },
            {
              type: 'list',
              listType: 'ordered',
              items: [
                {
                  children: [
                    {
                      type: 'text',
                      text: 'Save',
                      bold: false,
                      italic: false,
                    },
                  ],
                },
              ],
            },
            {
              type: 'reference',
              referenceType: 'image',
              label: 'Legacy URL',
              url: 'https://example.com/legacy.png',
            },
          ],
        },
        tags: ['rich'],
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
        trigger: ';steps',
      },
      {
        id: IMAGE_ID,
        title: 'Screenshot',
        content: { kind: 'image', assetId: ASSET_ID },
        tags: ['image'],
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
        trigger: ';screenshot',
      },
    ],
    snippetAssets: [createAsset(mimeType)],
    settings: {
      defaultModel: null,
      snippetPasteMode: 'clipboard-only',
      automaticBackupCadence: 'weekly',
    },
    snippetUsageStats: [],
    snippetGeneratedMetadata: [],
  };
}

async function exportV6(snapshot = createSnapshot()): Promise<string> {
  const download = vi.fn<BackupDownloadPort['download']>(async () => undefined);
  await new BackupExportService(
    { readSnapshot: async () => snapshot },
    { download },
    () => new Date(CREATED_AT),
    () => '423e4567-e89b-42d3-a456-426614174000',
  ).exportBackup();
  const serialized = download.mock.calls[0]?.[0];
  if (serialized === undefined) throw new Error('Missing backup download.');
  return serialized;
}

describe('Backup v6 lists, Image Snippets, and paste mode', () => {
  it('exports empty assets as v6 with exact public envelope keys', async () => {
    const serialized = await exportV6({
      knowledge: [],
      snippets: [],
      snippetAssets: [],
      settings: {
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence: 'weekly',
      },
      snippetUsageStats: [],
      snippetGeneratedMetadata: [],
    });
    const backup = JSON.parse(serialized) as BackupFileV7;
    expect(backup.formatVersion).toBe(BACKUP_FORMAT_VERSION_7);
    expect(Object.keys(backup).sort()).toEqual([
      'backupId',
      'creationMode',
      'data',
      'exportedAt',
      'format',
      'formatVersion',
    ]);
    expect(backup.data).toEqual({
      knowledge: [],
      snippets: [],
      snippetAssets: [],
      snippetUsageStats: [],
      snippetGeneratedMetadata: [],
      settings: {
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence: 'weekly',
      },
    });
  });

  it.each(Object.keys(signatures) as SnippetAssetMimeType[])(
    'round-trips mixed list content and one %s Image Snippet with exact bytes',
    async (mimeType) => {
      const snapshot = createSnapshot(mimeType);
      const first = await exportV6(snapshot);
      const second = await exportV6(snapshot);
      expect(second).toBe(first);
      const parsed = parseBackupFile(first);
      expect(parsed.formatVersion).toBe(7);
      const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
        async () => undefined,
      );
      await new BackupRestoreService({ replaceAll }).restoreBackup(parsed);
      const restored = replaceAll.mock.calls[0]?.[0];
      expect(restored?.snippets).toEqual(snapshot.snippets);
      const restoredAsset = restored?.snippetAssets[0];
      if (restoredAsset === undefined) throw new Error('Missing asset.');
      expect(new Uint8Array(await restoredAsset.blob.arrayBuffer())).toEqual(
        Uint8Array.from(signatures[mimeType]),
      );
      expect(first).not.toContain('blob');
      expect(first).not.toContain('[Image]');
    },
  );

  it.each([
    [
      'unknown list key',
      (backup: BackupFileV7) => {
        const rich = backup.data.snippets[0];
        if (rich?.content.kind !== 'rich') throw new Error('Missing Rich.');
        Object.assign(rich.content.blocks[1] as object, { nested: [] });
      },
    ],
    [
      'invalid list type',
      (backup: BackupFileV7) => {
        const rich = backup.data.snippets[0];
        if (rich?.content.kind !== 'rich') throw new Error('Missing Rich.');
        Object.assign(rich.content.blocks[1] as object, { listType: 'task' });
      },
    ],
    [
      'malformed Image Snippet',
      (backup: BackupFileV7) => {
        const image = backup.data.snippets[1];
        if (image === undefined) throw new Error('Missing Image.');
        Object.assign(image.content as object, { text: '[Image]' });
      },
    ],
    [
      'missing Image Snippet asset',
      (backup: BackupFileV7) => {
        (backup.data.snippetAssets as unknown[]).splice(0, 1);
      },
    ],
    [
      'foreign Image Snippet asset',
      (backup: BackupFileV7) => {
        const asset = backup.data.snippetAssets[0];
        if (asset === undefined) throw new Error('Missing asset.');
        (asset as { snippetId: string }).snippetId = RICH_ID;
      },
    ],
    [
      'additional owned asset',
      (backup: BackupFileV7) => {
        const asset = backup.data.snippetAssets[0];
        if (asset === undefined) throw new Error('Missing asset.');
        (backup.data.snippetAssets as unknown[]).push({
          ...asset,
          id: EXTRA_ASSET_ID,
        });
      },
    ],
    [
      'duplicate asset',
      (backup: BackupFileV7) => {
        const asset = backup.data.snippetAssets[0];
        if (asset === undefined) throw new Error('Missing asset.');
        (backup.data.snippetAssets as unknown[]).push({ ...asset });
      },
    ],
    [
      'invalid binary signature',
      (backup: BackupFileV7) => {
        const asset = backup.data.snippetAssets[0];
        if (asset === undefined) throw new Error('Missing asset.');
        (asset as { data: string }).data = encodeBase64(
          Uint8Array.from([1, 2, 3, 4]),
        );
        (asset as { byteSize: number }).byteSize = 4;
      },
    ],
  ] as const)('rejects %s atomically', async (_name, mutate) => {
    const backup = JSON.parse(await exportV6()) as BackupFileV7;
    mutate(backup);
    expect(() => parseBackupFile(JSON.stringify(backup))).toThrowError(
      expect.objectContaining({ code: 'invalid' }),
    );
  });

  it('retains the documented 96 MiB guard and surfaces restore failure', async () => {
    expect(MAX_BACKUP_V7_BYTES).toBe(100_663_296);
    expect(() => assertBackupFitsByteLimit('1234', 3)).toThrowError(
      expect.objectContaining({ code: 'too-large' }),
    );
    const parsed = parseBackupFile(await exportV6());
    await expect(
      new BackupRestoreService({
        replaceAll: async () => {
          throw new Error('transaction rolled back');
        },
      }).restoreBackup(parsed),
    ).rejects.toMatchObject({ name: 'BackupRestoreError' });
  });
});
