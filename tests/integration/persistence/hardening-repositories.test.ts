import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createPlainSnippetContent } from '../../../src/domain/snippet-content';
import { createSnippetSourceFingerprint } from '../../../src/domain/snippet-generated-metadata';
import { DexieAutomaticBackupStateRepository } from '../../../src/infrastructure/persistence/dexie-automatic-backup-state-repository';
import { DexieSnippetEntryRepository } from '../../../src/infrastructure/persistence/dexie-snippet-entry-repository';
import { DexieSnippetGeneratedMetadataRepository } from '../../../src/infrastructure/persistence/dexie-snippet-generated-metadata-repository';
import { DexieSnippetUsageStatsRepository } from '../../../src/infrastructure/persistence/dexie-snippet-usage-stats-repository';
import {
  DATABASE_NAME,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from './test-database';

const USED_AT = '2026-08-25T01:02:03.000Z';

describe('M14-M.1 hardening repositories', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;

  beforeEach(() => {
    databaseName = `${DATABASE_NAME}-hardening-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  async function createTextSnippet() {
    return new DexieSnippetEntryRepository(database).create({
      title: 'Text owner',
      content: createPlainSnippetContent('Reusable response'),
      tags: ['support'],
      trigger: ';owner',
    });
  }

  it('treats missing usage as zero-by-absence and validates persistence', async () => {
    const snippet = await createTextSnippet();
    const repository = new DexieSnippetUsageStatsRepository(database);

    await expect(repository.get(snippet.id)).resolves.toBeUndefined();
    await expect(
      repository.save({
        snippetId: snippet.id,
        usageCount: 3,
        lastUsedAt: USED_AT,
      }),
    ).resolves.toEqual({
      snippetId: snippet.id,
      usageCount: 3,
      lastUsedAt: USED_AT,
    });
    await expect(
      repository.save({
        snippetId: snippet.id,
        usageCount: Number.MAX_SAFE_INTEGER + 1,
        lastUsedAt: USED_AT,
      }),
    ).rejects.toThrow('Failed to save Snippet usage statistics.');
    await expect(repository.delete(snippet.id)).resolves.toBe(true);
    await expect(repository.delete(snippet.id)).resolves.toBe(false);
  });

  it('persists bounded generated metadata for Text owners only', async () => {
    const snippet = await createTextSnippet();
    const repository = new DexieSnippetGeneratedMetadataRepository(database);
    const metadata = {
      snippetId: snippet.id,
      generatedTags: ['refund', 'account access'],
      sourceFingerprint: await createSnippetSourceFingerprint(snippet),
      generatedAt: USED_AT,
    };

    await expect(repository.get(snippet.id)).resolves.toBeUndefined();
    await expect(repository.save(metadata)).resolves.toEqual(metadata);
    await expect(repository.get(snippet.id)).resolves.toEqual(metadata);

    const imageId = crypto.randomUUID();
    await database.snippetEntries.add({
      id: imageId,
      title: 'Image owner',
      content: { kind: 'image', assetId: crypto.randomUUID() },
      tags: [],
      createdAt: USED_AT,
      updatedAt: USED_AT,
    });
    await expect(
      repository.save({ ...metadata, snippetId: imageId }),
    ).rejects.toThrow('Failed to save generated Snippet metadata.');
  });

  it('round-trips the smallest local directory-handle state and clears it', async () => {
    const repository = new DexieAutomaticBackupStateRepository(database);
    const state = {
      directoryHandle: { kind: 'directory' as const, name: 'Disposable' },
      backupSetId: crypto.randomUUID(),
    };

    await expect(repository.load()).resolves.toBeUndefined();
    await expect(repository.save(state)).resolves.toEqual(state);
    database.close();
    database = createIsolatedDatabase(databaseName);
    await expect(
      new DexieAutomaticBackupStateRepository(database).load(),
    ).resolves.toEqual(state);
    await new DexieAutomaticBackupStateRepository(database).clear();
    await expect(
      new DexieAutomaticBackupStateRepository(database).load(),
    ).resolves.toBeUndefined();
  });
});
