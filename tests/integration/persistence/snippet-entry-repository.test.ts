import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RecordNotFoundError } from '../../../src/application/persistence/errors';
import { DuplicateSnippetTriggerError } from '../../../src/application/snippet/snippet-trigger';
import {
  DATABASE_NAME,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieSnippetEntryRepository } from '../../../src/infrastructure/persistence/dexie-snippet-entry-repository';
import { DexieSnippetAssetRepository } from '../../../src/infrastructure/persistence/dexie-snippet-asset-repository';
import { createPlainSnippetContent } from '../../../src/domain/snippet-content';
import { MAX_SNIPPET_ASSET_BYTES } from '../../../src/domain/snippet-asset';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from './test-database';

describe('DexieSnippetEntryRepository', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;
  let repository: DexieSnippetEntryRepository;

  beforeEach(() => {
    databaseName = `${DATABASE_NAME}-snippet-test-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
    repository = new DexieSnippetEntryRepository(database);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  it('creates, gets, and lists complete snippet records deterministically', async () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(Date.parse('2026-07-25T12:00:01.000Z'));
    const later = await repository.create({
      title: 'Later snippet',
      content: createPlainSnippetContent('Later content'),
      tags: [],
      trigger: null,
    });

    now.mockReturnValue(Date.parse('2026-07-25T12:00:00.000Z'));
    const earlier = await repository.create({
      title: 'Earlier snippet',
      content: createPlainSnippetContent('Earlier content'),
      tags: ['snippet'],
      trigger: ';earlier',
    });

    expect(earlier.createdAt).toBe(earlier.updatedAt);
    expect(earlier.tags).toEqual(['snippet']);
    expect(later.tags).toEqual([]);
    expect(await repository.get(earlier.id)).toEqual(earlier);
    expect(await repository.get('missing-id')).toBeUndefined();
    expect(await repository.list()).toEqual([earlier, later]);
  });

  it('replaces mutable fields, preserves immutable fields, and advances updatedAt', async () => {
    const baseTime = Date.parse('2026-07-25T12:00:00.000Z');
    vi.spyOn(Date, 'now').mockReturnValue(baseTime);
    const created = await repository.create({
      title: 'Original snippet',
      content: createPlainSnippetContent('Original content'),
      tags: ['original'],
      trigger: ';original',
    });

    const updated = await repository.update(created.id, {
      title: 'Updated snippet',
      content: createPlainSnippetContent('Updated content'),
      tags: [],
      trigger: ';updated',
    });

    expect(updated).toEqual({
      id: created.id,
      title: 'Updated snippet',
      content: createPlainSnippetContent('Updated content'),
      tags: [],
      createdAt: created.createdAt,
      updatedAt: '2026-07-25T12:00:00.001Z',
      trigger: ';updated',
    });
  });

  it('throws for an absent update and returns boolean delete results', async () => {
    const missingUpdate = repository.update('missing-id', {
      title: 'Missing',
      content: createPlainSnippetContent('Missing content'),
      tags: [],
      trigger: null,
    });

    await expect(missingUpdate).rejects.toMatchObject({
      name: 'RecordNotFoundError',
      entityKind: 'snippetEntry',
      id: 'missing-id',
    });
    await expect(missingUpdate).rejects.toBeInstanceOf(RecordNotFoundError);

    const created = await repository.create({
      title: 'Temporary snippet',
      content: createPlainSnippetContent('Temporary content'),
      tags: [],
      trigger: null,
    });

    expect(await repository.delete(created.id)).toBe(true);
    expect(await repository.get(created.id)).toBeUndefined();
    expect(await repository.delete(created.id)).toBe(false);
  });

  it('preserves snippet records across a database reopen', async () => {
    const created = await repository.create({
      title: 'Persistent snippet',
      content: createPlainSnippetContent('Persistent content'),
      tags: ['reopen'],
      trigger: ';persistent',
    });

    database.close({ disableAutoOpen: true });
    database = createIsolatedDatabase(databaseName);
    repository = new DexieSnippetEntryRepository(database);

    expect(await repository.get(created.id)).toEqual(created);
  });

  it('round-trips rich content through explicit physical mapping without aliasing', async () => {
    const content = {
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Rich', bold: true, italic: false },
            {
              type: 'link',
              text: 'Guide',
              url: 'https://example.com/guide',
              bold: false,
              italic: true,
            },
          ],
        },
      ],
    } as const;
    const created = await repository.create({
      title: 'Rich snippet',
      content,
      tags: ['rich'],
      trigger: ';rich',
    });
    const physical = await database.snippetEntries.get(created.id);

    expect(created.content).toEqual(content);
    expect(physical?.content).toEqual(content);
    expect(created.content).not.toBe(content);
    expect(physical?.content).not.toBe(created.content);
    expect(await repository.get(created.id)).toEqual(created);
  });

  it('omits null physically, finds exact triggers, maps conflicts, and releases triggers', async () => {
    const first = await repository.create({
      title: 'First',
      content: createPlainSnippetContent('First content'),
      tags: [],
      trigger: ';shared',
    });
    const triggerless = await repository.create({
      title: 'Triggerless',
      content: createPlainSnippetContent('No trigger'),
      tags: [],
      trigger: null,
    });

    expect(await repository.findByTrigger(';shared')).toEqual(first);
    expect(await repository.findByTrigger(';sha')).toBeUndefined();
    expect(await repository.findByTrigger(';SHARED')).toBeUndefined();
    expect(
      await database.snippetEntries.get(triggerless.id),
    ).not.toHaveProperty('trigger');

    await expect(
      repository.create({
        title: 'Duplicate',
        content: createPlainSnippetContent('Duplicate content'),
        tags: [],
        trigger: ';shared',
      }),
    ).rejects.toBeInstanceOf(DuplicateSnippetTriggerError);

    await repository.update(first.id, {
      title: first.title,
      content: first.content,
      tags: first.tags,
      trigger: null,
    });
    const reused = await repository.create({
      title: 'Reused',
      content: createPlainSnippetContent('Reused content'),
      tags: [],
      trigger: ';shared',
    });
    expect(reused.trigger).toBe(';shared');
    await repository.delete(reused.id);
    await expect(
      repository.create({
        title: 'Reused after delete',
        content: createPlainSnippetContent('Reused again'),
        tags: [],
        trigger: ';shared',
      }),
    ).resolves.toMatchObject({ trigger: ';shared' });
  });

  it('atomically saves, retrieves, preserves, removes, and cascades local assets', async () => {
    const assetId = '123e4567-e89b-42d3-a456-426614174000';
    const bytes = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const content = {
      kind: 'rich',
      blocks: [{ type: 'image', assetId, altText: 'Receipt' }],
    } as const;
    const created = await repository.create({
      title: 'Asset snippet',
      content,
      tags: [],
      trigger: ';asset',
      newAssets: [
        {
          id: assetId,
          mimeType: 'image/png',
          blob: new Blob([bytes], { type: 'image/png' }),
          byteSize: bytes.byteLength,
          originalFilename: 'receipt.png',
          createdAt: '2026-08-09T00:00:00.000Z',
        },
      ],
    });
    const assetRepository = new DexieSnippetAssetRepository(database);
    const stored = await assetRepository.get(assetId);
    expect(stored).toMatchObject({
      id: assetId,
      snippetId: created.id,
      byteSize: bytes.byteLength,
      originalFilename: 'receipt.png',
    });
    if (stored === undefined) throw new Error('Missing stored asset.');
    expect(new Uint8Array(await stored.blob.arrayBuffer())).toEqual(bytes);
    expect(await assetRepository.listBySnippet(created.id)).toHaveLength(1);

    await repository.update(created.id, {
      title: 'Metadata changed',
      content,
      tags: ['preserved'],
      trigger: ';asset',
    });
    expect(await assetRepository.get(assetId)).toBeDefined();

    const replacementAssetId = '823e4567-e89b-42d3-a456-426614174000';
    await repository.update(created.id, {
      title: 'Image replaced',
      content: {
        kind: 'rich',
        blocks: [
          { type: 'image', assetId: replacementAssetId, altText: 'New' },
        ],
      },
      tags: [],
      trigger: ';asset',
      newAssets: [
        {
          id: replacementAssetId,
          mimeType: 'image/png',
          blob: new Blob([bytes], { type: 'image/png' }),
          byteSize: bytes.byteLength,
          originalFilename: 'new.png',
          createdAt: '2026-08-09T00:00:01.000Z',
        },
      ],
    });
    expect(await assetRepository.get(assetId)).toBeUndefined();
    expect(await assetRepository.get(replacementAssetId)).toBeDefined();

    await repository.update(created.id, {
      title: 'Image removed',
      content: { kind: 'rich', blocks: [] },
      tags: [],
      trigger: ';asset',
    });
    expect(await assetRepository.get(replacementAssetId)).toBeUndefined();

    const secondAssetId = '223e4567-e89b-42d3-a456-426614174000';
    const second = await repository.create({
      title: 'Cascade',
      content: {
        kind: 'rich',
        blocks: [{ type: 'image', assetId: secondAssetId, altText: '' }],
      },
      tags: [],
      trigger: null,
      newAssets: [
        {
          id: secondAssetId,
          mimeType: 'image/png',
          blob: new Blob([bytes], { type: 'image/png' }),
          byteSize: bytes.byteLength,
          originalFilename: null,
          createdAt: '2026-08-09T00:00:01.000Z',
        },
      ],
    });
    await repository.delete(second.id);
    expect(await assetRepository.get(secondAssetId)).toBeUndefined();
  });

  it('rolls back both records when an atomic create fails', async () => {
    await repository.create({
      title: 'Existing',
      content: createPlainSnippetContent('Existing'),
      tags: [],
      trigger: ';taken',
    });
    const assetId = '323e4567-e89b-42d3-a456-426614174000';
    const bytes = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    await expect(
      repository.create({
        title: 'Rejected',
        content: {
          kind: 'rich',
          blocks: [{ type: 'image', assetId, altText: '' }],
        },
        tags: [],
        trigger: ';taken',
        newAssets: [
          {
            id: assetId,
            mimeType: 'image/png',
            blob: new Blob([bytes], { type: 'image/png' }),
            byteSize: bytes.byteLength,
            originalFilename: null,
            createdAt: '2026-08-09T00:00:00.000Z',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(DuplicateSnippetTriggerError);
    expect(await database.snippetEntries.count()).toBe(1);
    expect(await database.snippetAssets.count()).toBe(0);
  });

  it('rejects missing, foreign, and orphan asset graphs before committing', async () => {
    const first = await repository.create({
      title: 'First',
      content: createPlainSnippetContent('First'),
      tags: [],
      trigger: null,
    });
    const second = await repository.create({
      title: 'Second',
      content: createPlainSnippetContent('Second'),
      tags: [],
      trigger: null,
    });
    const missingId = '423e4567-e89b-42d3-a456-426614174000';
    await expect(
      repository.update(first.id, {
        title: first.title,
        content: {
          kind: 'rich',
          blocks: [{ type: 'image', assetId: missingId, altText: '' }],
        },
        tags: [],
        trigger: null,
      }),
    ).rejects.toMatchObject({ code: 'missing-asset' });
    expect(await repository.get(first.id)).toEqual(first);

    const orphanId = '523e4567-e89b-42d3-a456-426614174000';
    const bytes = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    await expect(
      repository.update(first.id, {
        title: first.title,
        content: first.content,
        tags: [],
        trigger: null,
        newAssets: [
          {
            id: orphanId,
            mimeType: 'image/png',
            blob: new Blob([bytes], { type: 'image/png' }),
            byteSize: bytes.byteLength,
            originalFilename: null,
            createdAt: '2026-08-09T00:00:00.000Z',
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'orphan-asset' });
    expect(await database.snippetAssets.count()).toBe(0);

    const foreignId = '623e4567-e89b-42d3-a456-426614174000';
    await database.snippetAssets.add({
      id: foreignId,
      snippetId: second.id,
      mimeType: 'image/png',
      blob: new Blob([bytes], { type: 'image/png' }),
      byteSize: bytes.byteLength,
      originalFilename: null,
      createdAt: '2026-08-09T00:00:00.000Z',
    });
    await expect(
      repository.update(first.id, {
        title: first.title,
        content: {
          kind: 'rich',
          blocks: [{ type: 'image', assetId: foreignId, altText: '' }],
        },
        tags: [],
        trigger: null,
      }),
    ).rejects.toMatchObject({ code: 'foreign-asset-reference' });
    expect(await repository.get(first.id)).toEqual(first);
  });

  it('uses final-state size when replacing an asset at the Snippet limit', async () => {
    const originalIds = [
      'a23e4567-e89b-42d3-a456-426614174000',
      'b23e4567-e89b-42d3-a456-426614174000',
      'c23e4567-e89b-42d3-a456-426614174000',
      'd23e4567-e89b-42d3-a456-426614174000',
    ];
    const replacementId = 'e23e4567-e89b-42d3-a456-426614174000';
    const exactBytes = new Uint8Array(MAX_SNIPPET_ASSET_BYTES);
    exactBytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const created = await repository.create({
      title: 'At final-state limit',
      content: {
        kind: 'rich',
        blocks: originalIds.map((assetId) => ({
          type: 'image',
          assetId,
          altText: '',
        })),
      },
      tags: [],
      trigger: null,
      newAssets: originalIds.map((id, index) => ({
        id,
        mimeType: 'image/png',
        blob: new Blob([exactBytes], { type: 'image/png' }),
        byteSize: exactBytes.byteLength,
        originalFilename: null,
        createdAt: `2026-08-09T00:00:0${index}.000Z`,
      })),
    });

    await repository.update(created.id, {
      title: created.title,
      content: {
        kind: 'rich',
        blocks: [...originalIds.slice(1), replacementId].map((assetId) => ({
          type: 'image',
          assetId,
          altText: '',
        })),
      },
      tags: [],
      trigger: null,
      newAssets: [
        {
          id: replacementId,
          mimeType: 'image/png',
          blob: new Blob([exactBytes], { type: 'image/png' }),
          byteSize: exactBytes.byteLength,
          originalFilename: null,
          createdAt: '2026-08-09T00:00:04.000Z',
        },
      ],
    });

    const assetRepository = new DexieSnippetAssetRepository(database);
    const removedId = originalIds[0];
    if (removedId === undefined) throw new Error('Missing removed asset ID.');
    expect(await assetRepository.get(removedId)).toBeUndefined();
    expect(await assetRepository.get(replacementId)).toBeDefined();
    expect(await assetRepository.listBySnippet(created.id)).toHaveLength(4);
  });

  it('rolls back an update after the Snippet write but before asset mutation', async () => {
    const originalAssetId = 'f23e4567-e89b-42d3-a456-426614174000';
    const replacementAssetId = '123e4567-e89b-42d3-b456-426614174000';
    const bytes = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const original = await repository.create({
      title: 'Original update state',
      content: {
        kind: 'rich',
        blocks: [{ type: 'image', assetId: originalAssetId, altText: 'Old' }],
      },
      tags: ['original'],
      trigger: null,
      newAssets: [
        {
          id: originalAssetId,
          mimeType: 'image/png',
          blob: new Blob([bytes], { type: 'image/png' }),
          byteSize: bytes.byteLength,
          originalFilename: 'old.png',
          createdAt: '2026-08-09T00:00:00.000Z',
        },
      ],
    });
    const failingRepository = new DexieSnippetEntryRepository(database, {
      afterSnippetUpdateWrite: () => {
        throw new Error('forced post-Snippet-write failure');
      },
    });

    await expect(
      failingRepository.update(original.id, {
        title: 'Should roll back',
        content: {
          kind: 'rich',
          blocks: [
            {
              type: 'image',
              assetId: replacementAssetId,
              altText: 'New',
            },
          ],
        },
        tags: ['changed'],
        trigger: null,
        newAssets: [
          {
            id: replacementAssetId,
            mimeType: 'image/png',
            blob: new Blob([bytes], { type: 'image/png' }),
            byteSize: bytes.byteLength,
            originalFilename: 'new.png',
            createdAt: '2026-08-09T00:00:01.000Z',
          },
        ],
      }),
    ).rejects.toThrow('Failed to update snippet entry.');

    expect(await repository.get(original.id)).toEqual(original);
    expect(await database.snippetAssets.get(originalAssetId)).toBeDefined();
    expect(
      await database.snippetAssets.get(replacementAssetId),
    ).toBeUndefined();
  });

  it('rolls back a Snippet delete when owned-asset deletion fails', async () => {
    const assetId = '723e4567-e89b-42d3-a456-426614174000';
    const bytes = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const created = await repository.create({
      title: 'Rollback delete',
      content: {
        kind: 'rich',
        blocks: [{ type: 'image', assetId, altText: '' }],
      },
      tags: [],
      trigger: null,
      newAssets: [
        {
          id: assetId,
          mimeType: 'image/png',
          blob: new Blob([bytes], { type: 'image/png' }),
          byteSize: bytes.byteLength,
          originalFilename: null,
          createdAt: '2026-08-09T00:00:00.000Z',
        },
      ],
    });
    const failingRepository = new DexieSnippetEntryRepository(database, {
      afterSnippetDelete: () => {
        throw new Error('forced asset delete failure');
      },
    });

    await expect(failingRepository.delete(created.id)).rejects.toThrow(
      'Failed to delete snippet entry.',
    );
    expect(await repository.get(created.id)).toEqual(created);
    expect(await database.snippetAssets.get(assetId)).toBeDefined();
  });
});
