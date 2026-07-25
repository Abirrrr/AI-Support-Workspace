// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { KnowledgeLibrary } from '../../src/application/knowledge/knowledge-library';
import type { KnowledgeEntry } from '../../src/domain/knowledge-entry';
import { KnowledgeLibraryView } from '../../src/ui/knowledge/KnowledgeLibraryView';

const entry: KnowledgeEntry = {
  id: 'knowledge-1',
  title: 'Troubleshooting checkout',
  body: 'Restart the local checkout service.',
  tags: ['checkout', 'service'],
  createdAt: '2026-07-25T12:00:00.000Z',
  updatedAt: '2026-07-25T12:00:00.000Z',
  source: 'Internal runbook',
};

function createLibrary(overrides: Partial<KnowledgeLibrary> = {}) {
  return {
    load: vi.fn(async () => []),
    create: vi.fn(async (input) => ({
      id: 'knowledge-created',
      ...input,
      createdAt: '2026-07-25T12:00:01.000Z',
      updatedAt: '2026-07-25T12:00:01.000Z',
    })),
    update: vi.fn(async (id, input) => ({
      id,
      ...input,
      createdAt: entry.createdAt,
      updatedAt: '2026-07-25T12:00:02.000Z',
    })),
    delete: vi.fn(async () => true),
    ...overrides,
  } satisfies KnowledgeLibrary;
}

afterEach(cleanup);

describe('KnowledgeLibraryView', () => {
  it('renders existing entries with their identifying fields', async () => {
    const library = createLibrary({ load: vi.fn(async () => [entry]) });

    render(<KnowledgeLibraryView knowledgeLibrary={library} />);

    expect(await screen.findByText(entry.title)).toBeTruthy();
    expect(screen.getByText(entry.body)).toBeTruthy();
    expect(screen.getByText(`Source: ${entry.source}`)).toBeTruthy();
    expect(screen.getByText('checkout')).toBeTruthy();
    expect(screen.getByText('service')).toBeTruthy();
  });

  it('renders loading and empty states', async () => {
    render(<KnowledgeLibraryView knowledgeLibrary={createLibrary()} />);

    expect(screen.getByText('Loading knowledge…')).toBeTruthy();
    expect(await screen.findByText('No knowledge entries yet.')).toBeTruthy();
  });

  it('creates an entry and reflects it without reloading the library', async () => {
    const library = createLibrary();
    render(<KnowledgeLibraryView knowledgeLibrary={library} />);
    await screen.findByText('No knowledge entries yet.');

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Refund workflow' },
    });
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: 'Confirm the payment status first.' },
    });
    fireEvent.change(screen.getByLabelText('Tags (comma-separated)'), {
      target: { value: 'billing, refunds' },
    });
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: 'Support handbook' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create entry' }));

    await waitFor(() =>
      expect(library.create).toHaveBeenCalledWith({
        title: 'Refund workflow',
        body: 'Confirm the payment status first.',
        tags: ['billing', 'refunds'],
        source: 'Support handbook',
      }),
    );
    expect(await screen.findByText('Refund workflow')).toBeTruthy();
    expect(screen.getByText('Knowledge entry created.')).toBeTruthy();
    expect(library.load).toHaveBeenCalledOnce();
  });

  it('edits an entry and immediately renders the repository result', async () => {
    const updatedEntry = {
      ...entry,
      title: 'Updated checkout troubleshooting',
      body: 'Restart and verify the checkout service.',
      tags: ['checkout'],
      source: 'Updated runbook',
      updatedAt: '2026-07-25T12:00:02.000Z',
    };
    const library = createLibrary({
      load: vi.fn(async () => [entry]),
      update: vi.fn(async () => updatedEntry),
    });
    render(<KnowledgeLibraryView knowledgeLibrary={library} />);
    await screen.findByText(entry.title);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Title')).toHaveProperty('value', entry.title);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: updatedEntry.title },
    });
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: updatedEntry.body },
    });
    fireEvent.change(screen.getByLabelText('Tags (comma-separated)'), {
      target: { value: 'checkout' },
    });
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: updatedEntry.source },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(library.update).toHaveBeenCalledWith(entry.id, {
        title: updatedEntry.title,
        body: updatedEntry.body,
        tags: ['checkout'],
        source: updatedEntry.source,
      }),
    );
    expect(await screen.findByText(updatedEntry.title)).toBeTruthy();
    expect(screen.getByText('Knowledge entry updated.')).toBeTruthy();
  });

  it('requires confirmation before deleting and removes a confirmed entry', async () => {
    const confirmDelete = vi
      .fn<(candidate: KnowledgeEntry) => boolean>()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const library = createLibrary({ load: vi.fn(async () => [entry]) });
    render(
      <KnowledgeLibraryView
        confirmDelete={confirmDelete}
        knowledgeLibrary={library}
      />,
    );
    await screen.findByText(entry.title);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirmDelete).toHaveBeenCalledWith(entry);
    expect(library.delete).not.toHaveBeenCalled();
    expect(screen.getByText(entry.title)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(library.delete).toHaveBeenCalledWith(entry.id));
    await waitFor(() => expect(screen.queryByText(entry.title)).toBeNull());
    expect(screen.getByText('Knowledge entry deleted.')).toBeTruthy();
  });

  it('shows safe user-visible load and persistence errors', async () => {
    const failedLoad = createLibrary({
      load: vi.fn(async () => {
        throw new Error('raw IndexedDB load failure');
      }),
    });
    const { rerender } = render(
      <KnowledgeLibraryView knowledgeLibrary={failedLoad} />,
    );

    expect(
      await screen.findByText(
        'We could not load your Knowledge Library. Please try again.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('raw IndexedDB load failure')).toBeNull();

    const failedCreate = createLibrary({
      create: vi.fn(async () => {
        throw new Error('raw Dexie create failure');
      }),
    });
    rerender(<KnowledgeLibraryView knowledgeLibrary={failedCreate} />);
    await screen.findByText('No knowledge entries yet.');
    fireEvent.click(screen.getByRole('button', { name: 'Create entry' }));

    expect(
      await screen.findByText(
        'We could not create this knowledge entry. Please try again.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('raw Dexie create failure')).toBeNull();
  });
});
