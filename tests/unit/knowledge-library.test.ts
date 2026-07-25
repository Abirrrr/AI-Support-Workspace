import { describe, expect, it, vi } from 'vitest';

import {
  KnowledgeLibraryService,
  orderKnowledgeEntries,
} from '../../src/application/knowledge/knowledge-library';
import { PersistenceError } from '../../src/application/persistence/errors';
import type { KnowledgeEntryRepository } from '../../src/application/persistence/knowledge-entry-repository';
import type { KnowledgeEntry } from '../../src/domain/knowledge-entry';

const entry: KnowledgeEntry = {
  id: 'knowledge-1',
  title: 'Troubleshooting',
  body: 'Restart the local service.',
  tags: ['service'],
  createdAt: '2026-07-25T12:00:00.000Z',
  updatedAt: '2026-07-25T12:00:00.000Z',
  source: 'Internal guide',
};

function createRepository() {
  return {
    create: vi.fn(async () => entry),
    get: vi.fn(async () => undefined),
    list: vi.fn(async () => [entry]),
    update: vi.fn(async () => ({
      ...entry,
      title: 'Updated troubleshooting',
      updatedAt: '2026-07-25T12:00:01.000Z',
    })),
    delete: vi.fn(async () => true),
  } satisfies KnowledgeEntryRepository;
}

describe('KnowledgeLibraryService', () => {
  it('loads, creates, updates, and deletes through the repository boundary', async () => {
    const repository = createRepository();
    const library = new KnowledgeLibraryService(repository);
    const input = {
      title: 'Troubleshooting',
      body: 'Restart the local service.',
      tags: ['service'],
      source: 'Internal guide',
    };

    await expect(library.load()).resolves.toEqual([entry]);
    await expect(library.create(input)).resolves.toEqual(entry);
    await expect(library.update(entry.id, input)).resolves.toMatchObject({
      id: entry.id,
      title: 'Updated troubleshooting',
    });
    await expect(library.delete(entry.id)).resolves.toBe(true);

    expect(repository.list).toHaveBeenCalledOnce();
    expect(repository.create).toHaveBeenCalledWith(input);
    expect(repository.update).toHaveBeenCalledWith(entry.id, input);
    expect(repository.delete).toHaveBeenCalledWith(entry.id);
  });

  it('surfaces persistence failures without replacing their project-owned error', async () => {
    const repository = createRepository();
    const failure = new PersistenceError(
      'Failed to list knowledge entries.',
      new Error('IndexedDB unavailable'),
    );
    repository.list.mockRejectedValueOnce(failure);
    const library = new KnowledgeLibraryService(repository);

    await expect(library.load()).rejects.toBe(failure);
  });

  it('keeps immediate UI updates in the repository contract order', () => {
    const earlier = {
      ...entry,
      id: 'knowledge-a',
      createdAt: '2026-07-25T11:59:59.000Z',
    };
    const tiedLaterId = { ...entry, id: 'knowledge-z' };

    expect(orderKnowledgeEntries([tiedLaterId, entry, earlier])).toEqual([
      earlier,
      entry,
      tiedLaterId,
    ]);
  });
});
