import { describe, expect, it, vi } from 'vitest';

import { PersistenceError } from '../../src/application/persistence/errors';
import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import {
  orderSnippetEntries,
  SnippetLibraryService,
} from '../../src/application/snippet/snippet-library';
import { DuplicateSnippetTriggerError } from '../../src/application/snippet/snippet-trigger';
import type { CatalogMutationPort } from '../../src/application/snippet/catalog-mutation';
import type { SnippetEntry } from '../../src/domain/snippet-entry';

const entry: SnippetEntry = {
  id: 'snippet-1',
  title: 'Greeting',
  content: 'Thanks for contacting support.',
  tags: ['greeting'],
  createdAt: '2026-07-26T12:00:00.000Z',
  updatedAt: '2026-07-26T12:00:00.000Z',
  trigger: ';greeting',
};

function createRepository() {
  return {
    create: vi.fn(async () => entry),
    get: vi.fn(async () => undefined),
    list: vi.fn(async () => [entry]),
    findByTrigger: vi.fn<SnippetEntryRepository['findByTrigger']>(
      async () => undefined,
    ),
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
      trigger: ';GREETING',
    };

    await expect(library.load()).resolves.toEqual([entry]);
    await expect(library.create(input)).resolves.toEqual(entry);
    await expect(library.update(entry.id, input)).resolves.toMatchObject({
      id: entry.id,
      title: 'Updated greeting',
    });
    await expect(library.delete(entry.id)).resolves.toBe(true);

    expect(repository.list).toHaveBeenCalledOnce();
    expect(repository.create).toHaveBeenCalledWith({
      ...input,
      trigger: ';greeting',
    });
    expect(repository.update).toHaveBeenCalledWith(entry.id, {
      ...input,
      trigger: ';greeting',
    });
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

  it('prechecks canonical duplicate triggers while allowing the current entry', async () => {
    const repository = createRepository();
    repository.findByTrigger.mockResolvedValue(entry);
    const library = new SnippetLibraryService(repository);
    const input = {
      title: 'Duplicate',
      content: 'Duplicate content',
      tags: [],
      trigger: ';GREETING',
    };

    await expect(library.create(input)).rejects.toBeInstanceOf(
      DuplicateSnippetTriggerError,
    );
    expect(repository.create).not.toHaveBeenCalled();
    await expect(library.update(entry.id, input)).resolves.toMatchObject({
      id: entry.id,
    });
    expect(repository.findByTrigger).toHaveBeenCalledWith(';greeting');
  });

  it('coordinates catalog invalidation and refresh for create, edit, and delete', async () => {
    const repository = createRepository();
    const port: CatalogMutationPort = {
      invalidateBeforeMutation: vi
        .fn<CatalogMutationPort['invalidateBeforeMutation']>()
        .mockResolvedValueOnce('create')
        .mockResolvedValueOnce('update')
        .mockResolvedValueOnce('delete'),
      publishAfterMutation: vi.fn(async () => true),
    };
    const library = new SnippetLibraryService(repository, port);
    const input = {
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      trigger: entry.trigger,
    };

    await library.create(input);
    await library.update(entry.id, input);
    await library.delete(entry.id);

    expect(port.invalidateBeforeMutation).toHaveBeenCalledTimes(3);
    expect(port.publishAfterMutation).toHaveBeenNthCalledWith(
      1,
      'create',
      'succeeded',
    );
    expect(port.publishAfterMutation).toHaveBeenNthCalledWith(
      2,
      'update',
      'succeeded',
    );
    expect(port.publishAfterMutation).toHaveBeenNthCalledWith(
      3,
      'delete',
      'succeeded',
    );
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
