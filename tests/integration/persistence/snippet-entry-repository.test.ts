import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RecordNotFoundError } from '../../../src/application/persistence/errors';
import {
  DATABASE_NAME,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieSnippetEntryRepository } from '../../../src/infrastructure/persistence/dexie-snippet-entry-repository';
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
      content: 'Later content',
      tags: [],
    });

    now.mockReturnValue(Date.parse('2026-07-25T12:00:00.000Z'));
    const earlier = await repository.create({
      title: 'Earlier snippet',
      content: 'Earlier content',
      tags: ['snippet'],
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
      content: 'Original content',
      tags: ['original'],
    });

    const updated = await repository.update(created.id, {
      title: 'Updated snippet',
      content: 'Updated content',
      tags: [],
    });

    expect(updated).toEqual({
      id: created.id,
      title: 'Updated snippet',
      content: 'Updated content',
      tags: [],
      createdAt: created.createdAt,
      updatedAt: '2026-07-25T12:00:00.001Z',
    });
  });

  it('throws for an absent update and returns boolean delete results', async () => {
    const missingUpdate = repository.update('missing-id', {
      title: 'Missing',
      content: 'Missing content',
      tags: [],
    });

    await expect(missingUpdate).rejects.toMatchObject({
      name: 'RecordNotFoundError',
      entityKind: 'snippetEntry',
      id: 'missing-id',
    });
    await expect(missingUpdate).rejects.toBeInstanceOf(RecordNotFoundError);

    const created = await repository.create({
      title: 'Temporary snippet',
      content: 'Temporary content',
      tags: [],
    });

    expect(await repository.delete(created.id)).toBe(true);
    expect(await repository.get(created.id)).toBeUndefined();
    expect(await repository.delete(created.id)).toBe(false);
  });

  it('preserves snippet records across a database reopen', async () => {
    const created = await repository.create({
      title: 'Persistent snippet',
      content: 'Persistent content',
      tags: ['reopen'],
    });

    database.close({ disableAutoOpen: true });
    database = createIsolatedDatabase(databaseName);
    repository = new DexieSnippetEntryRepository(database);

    expect(await repository.get(created.id)).toEqual(created);
  });
});
