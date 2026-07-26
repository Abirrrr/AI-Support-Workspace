import { describe, expect, it, vi } from 'vitest';

import { PersistenceError } from '../../src/application/persistence/errors';
import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import {
  orderSnippetEntries,
  SnippetLibraryService,
} from '../../src/application/snippet/snippet-library';
import type { SnippetEntry } from '../../src/domain/snippet-entry';

const entry: SnippetEntry = {
  id: 'snippet-1',
  title: 'Greeting',
  content: 'Thanks for contacting support.',
  tags: ['greeting'],
  createdAt: '2026-07-26T12:00:00.000Z',
  updatedAt: '2026-07-26T12:00:00.000Z',
};

function createRepository() {
  return {
    create: vi.fn(async () => entry),
    get: vi.fn(async () => undefined),
    list: vi.fn(async () => [entry]),
    update: vi.fn(async () => ({
      ...entry,
      title: 'Updated greeting',
      updatedAt: '2026-07-26T12:00:01.000Z',
    })),
    delete: vi.fn(async () => true),
  } satisfies SnippetEntryRepository;
}

describe('SnippetLibraryService', () => {
  it('loads, creates, updates, and deletes through the repository boundary', async () => {
    const repository = createRepository();
    const library = new SnippetLibraryService(repository);
    const input = {
      title: 'Greeting',
      content: 'Thanks for contacting support.',
      tags: ['greeting'],
    };

    await expect(library.load()).resolves.toEqual([entry]);
    await expect(library.create(input)).resolves.toEqual(entry);
    await expect(library.update(entry.id, input)).resolves.toMatchObject({
      id: entry.id,
      title: 'Updated greeting',
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
      'Failed to list snippet entries.',
      new Error('IndexedDB unavailable'),
    );
    repository.list.mockRejectedValueOnce(failure);
    const library = new SnippetLibraryService(repository);

    await expect(library.load()).rejects.toBe(failure);
  });

  it('keeps immediate UI updates in the repository contract order', () => {
    const earlier = {
      ...entry,
      id: 'snippet-a',
      createdAt: '2026-07-26T11:59:59.000Z',
    };
    const tiedLaterId = { ...entry, id: 'snippet-z' };

    expect(orderSnippetEntries([tiedLaterId, entry, earlier])).toEqual([
      earlier,
      entry,
      tiedLaterId,
    ]);
  });
});
