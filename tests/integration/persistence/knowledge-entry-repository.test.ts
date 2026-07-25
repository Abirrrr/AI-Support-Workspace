import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RecordNotFoundError } from '../../../src/application/persistence/errors';
import {
  DATABASE_NAME,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../../src/infrastructure/persistence/dexie-knowledge-entry-repository';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from './test-database';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

describe('DexieKnowledgeEntryRepository', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;
  let repository: DexieKnowledgeEntryRepository;

  beforeEach(() => {
    databaseName = `${DATABASE_NAME}-knowledge-test-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
    repository = new DexieKnowledgeEntryRepository(database);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  it('creates and reads a complete record with generated identity and timestamps', async () => {
    const now = Date.parse('2026-07-25T12:00:00.000Z');
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const created = await repository.create({
      title: 'Troubleshooting',
      body: 'Restart the local service.',
      tags: [],
      source: 'internal',
    });

    expect(created.id).toMatch(UUID_PATTERN);
    expect(created.createdAt).toBe('2026-07-25T12:00:00.000Z');
    expect(created.updatedAt).toBe(created.createdAt);
    expect(created).toMatchObject({
      title: 'Troubleshooting',
      body: 'Restart the local service.',
      tags: [],
      source: 'internal',
    });
    expect(await repository.get(created.id)).toEqual(created);
    expect(await repository.get('missing-id')).toBeUndefined();
  });

  it('lists by createdAt and then by id regardless of insertion order', async () => {
    const now = vi.spyOn(Date, 'now');

    now.mockReturnValue(Date.parse('2026-07-25T12:00:02.000Z'));
    const later = await repository.create({
      title: 'Later',
      body: 'Later body',
      tags: [],
      source: 'local',
    });

    now.mockReturnValue(Date.parse('2026-07-25T12:00:00.000Z'));
    const earlier = await repository.create({
      title: 'Earlier',
      body: 'Earlier body',
      tags: [],
      source: 'local',
    });

    now.mockReturnValue(Date.parse('2026-07-25T12:00:01.000Z'));
    const tiedFirst = await repository.create({
      title: 'Tied first',
      body: 'Tied body',
      tags: [],
      source: 'local',
    });
    const tiedSecond = await repository.create({
      title: 'Tied second',
      body: 'Tied body',
      tags: [],
      source: 'local',
    });

    const tiedById = [tiedFirst, tiedSecond].sort((left, right) =>
      left.id < right.id ? -1 : 1,
    );

    expect(await repository.list()).toEqual([earlier, ...tiedById, later]);
  });

  it('fully replaces mutable fields while preserving identity and advancing timestamps', async () => {
    const baseTime = Date.parse('2026-07-25T12:00:00.000Z');
    const now = vi.spyOn(Date, 'now').mockReturnValue(baseTime);
    const created = await repository.create({
      title: 'Original',
      body: 'Original body',
      tags: ['original'],
      source: 'original source',
    });

    const firstUpdate = await repository.update(created.id, {
      title: 'Updated once',
      body: 'Updated body once',
      tags: [],
      source: 'updated source',
    });
    const secondUpdate = await repository.update(created.id, {
      title: 'Updated twice',
      body: 'Updated body twice',
      tags: ['replacement'],
      source: 'replacement source',
    });

    now.mockReturnValue(baseTime - 60_000);
    const backwardClockUpdate = await repository.update(created.id, {
      title: 'Updated with backward clock',
      body: 'Final body',
      tags: ['final'],
      source: 'final source',
    });

    expect(firstUpdate).toMatchObject({
      id: created.id,
      createdAt: created.createdAt,
      updatedAt: '2026-07-25T12:00:00.001Z',
      title: 'Updated once',
      body: 'Updated body once',
      tags: [],
      source: 'updated source',
    });
    expect(secondUpdate.updatedAt).toBe('2026-07-25T12:00:00.002Z');
    expect(backwardClockUpdate).toEqual({
      id: created.id,
      title: 'Updated with backward clock',
      body: 'Final body',
      tags: ['final'],
      createdAt: created.createdAt,
      updatedAt: '2026-07-25T12:00:00.003Z',
      source: 'final source',
    });
    expect(await repository.get(created.id)).toEqual(backwardClockUpdate);
  });

  it('throws RecordNotFoundError when updating an absent record', async () => {
    const operation = repository.update('missing-id', {
      title: 'Missing',
      body: 'Missing body',
      tags: [],
      source: 'local',
    });

    await expect(operation).rejects.toBeInstanceOf(RecordNotFoundError);
    await expect(operation).rejects.toMatchObject({
      entityKind: 'knowledgeEntry',
      id: 'missing-id',
    });
  });

  it('deletes existing records and treats an absent record as a normal result', async () => {
    const created = await repository.create({
      title: 'Temporary',
      body: 'Temporary body',
      tags: [],
      source: 'local',
    });

    expect(await repository.delete(created.id)).toBe(true);
    expect(await repository.get(created.id)).toBeUndefined();
    expect(await repository.delete(created.id)).toBe(false);
  });

  it('preserves records when the persistence layer is closed and reopened', async () => {
    const created = await repository.create({
      title: 'Persistent',
      body: 'Persistent body',
      tags: ['reopen'],
      source: 'local',
    });

    database.close({ disableAutoOpen: true });
    database = createIsolatedDatabase(databaseName);
    repository = new DexieKnowledgeEntryRepository(database);

    expect(await repository.get(created.id)).toEqual(created);
  });
});
