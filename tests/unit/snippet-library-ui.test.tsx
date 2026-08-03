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
import type { SettingsApplication } from '../../src/application/settings/settings-service';
import type { SnippetLibrary } from '../../src/application/snippet/snippet-library';
import {
  DuplicateSnippetTriggerError,
  InvalidSnippetTriggerError,
} from '../../src/application/snippet/snippet-trigger';
import { CatalogUnavailableAfterMutationError } from '../../src/application/snippet/catalog-mutation';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import type { ImportExportActions } from '../../src/ui/import-export/ImportExportView';
import { OptionsShell } from '../../src/ui/options/OptionsShell';
import { SnippetLibraryView } from '../../src/ui/snippet/SnippetLibraryView';

const entry: SnippetEntry = {
  id: 'snippet-1',
  title: 'Order confirmation',
  content: 'Your order has been confirmed.',
  tags: ['orders', 'confirmation'],
  createdAt: '2026-07-26T12:00:00.000Z',
  updatedAt: '2026-07-26T12:00:00.000Z',
  trigger: null,
};

const importExport: ImportExportActions = {
  exportBackup: async () => undefined,
  prepareImport: async () => {
    throw new Error('Not used by this navigation test.');
  },
  restoreBackup: async () => undefined,
};

function createSnippetLibrary(overrides: Partial<SnippetLibrary> = {}) {
  return {
    load: vi.fn(async () => []),
    create: vi.fn(async (input) => ({
      id: 'snippet-created',
      ...input,
      createdAt: '2026-07-26T12:00:01.000Z',
      updatedAt: '2026-07-26T12:00:01.000Z',
    })),
    update: vi.fn(async (id, input) => ({
      id,
      ...input,
      createdAt: entry.createdAt,
      updatedAt: '2026-07-26T12:00:02.000Z',
    })),
    delete: vi.fn(async () => true),
    ...overrides,
  } satisfies SnippetLibrary;
}

function createKnowledgeLibrary() {
  return {
    load: vi.fn(async () => []),
    create: vi.fn(async () => {
      throw new Error('Not used by this navigation test.');
    }),
    update: vi.fn(async () => {
      throw new Error('Not used by this navigation test.');
    }),
    delete: vi.fn(async () => false),
  } satisfies KnowledgeLibrary;
}

function createSettings(): SettingsApplication {
  return {
    load: vi.fn(async () => ({ defaultModel: null })),
    save: vi.fn(async (defaultModelInput) => ({
      defaultModel: defaultModelInput.trim() || null,
    })),
  };
}

afterEach(cleanup);

describe('SnippetLibraryView', () => {
  it('renders existing snippets with their approved fields', async () => {
    const library = createSnippetLibrary({
      load: vi.fn(async () => [entry]),
    });

    render(<SnippetLibraryView snippetLibrary={library} />);

    expect(await screen.findByText(entry.title)).toBeTruthy();
    expect(screen.getByText(entry.content)).toBeTruthy();
    expect(screen.getByText('orders')).toBeTruthy();
    expect(screen.getByText('confirmation')).toBeTruthy();
  });

  it('renders loading and empty states', async () => {
    render(<SnippetLibraryView snippetLibrary={createSnippetLibrary()} />);

    expect(screen.getByText('Loading snippets…')).toBeTruthy();
    expect(await screen.findByText('No snippets saved yet.')).toBeTruthy();
  });

  it('creates a snippet and reflects it without reloading the library', async () => {
    const library = createSnippetLibrary();
    render(<SnippetLibraryView snippetLibrary={library} />);
    await screen.findByText('No snippets saved yet.');

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Refund confirmation' },
    });
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: 'Your refund has been processed.' },
    });
    fireEvent.change(screen.getByLabelText('Tags (comma-separated)'), {
      target: { value: 'billing, refunds' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create snippet' }));

    await waitFor(() =>
      expect(library.create).toHaveBeenCalledWith({
        title: 'Refund confirmation',
        content: 'Your refund has been processed.',
        tags: ['billing', 'refunds'],
        trigger: null,
      }),
    );
    expect(await screen.findByText('Refund confirmation')).toBeTruthy();
    expect(screen.getByText('Snippet created.')).toBeTruthy();
    expect(library.load).toHaveBeenCalledOnce();
  });

  it('creates, displays, prepopulates, and clears an optional trigger', async () => {
    const triggered = { ...entry, trigger: ';refund' };
    const cleared = { ...triggered, trigger: null };
    const library = createSnippetLibrary({
      load: vi.fn(async () => [triggered]),
      update: vi.fn(async () => cleared),
    });
    render(<SnippetLibraryView snippetLibrary={library} />);

    expect(await screen.findByText(';refund')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const triggerInput = screen.getByLabelText(/^Trigger \(optional\)/);
    expect(triggerInput).toHaveProperty('value', ';refund');
    expect(triggerInput.getAttribute('aria-describedby')).toContain(
      'snippet-trigger-guidance',
    );
    expect(screen.getByText(/characters starting with ;/)).toBeTruthy();
    fireEvent.change(triggerInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(library.update).toHaveBeenCalledWith(
        triggered.id,
        expect.objectContaining({ trigger: null }),
      ),
    );
    await waitFor(() => expect(screen.queryByText(';refund')).toBeNull());
  });

  it.each([
    ['invalid format', new InvalidSnippetTriggerError()],
    ['duplicate trigger', new DuplicateSnippetTriggerError(';used')],
  ])('shows focused inline %s feedback', async (_label, error) => {
    const library = createSnippetLibrary({
      create: vi.fn(async () => {
        throw error;
      }),
    });
    render(<SnippetLibraryView snippetLibrary={library} />);
    await screen.findByText('No snippets saved yet.');
    const triggerInput = screen.getByLabelText(/^Trigger \(optional\)/);
    fireEvent.change(triggerInput, { target: { value: ';candidate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create snippet' }));

    expect(await screen.findByText(error.message)).toBeTruthy();
    expect(triggerInput.getAttribute('aria-invalid')).toBe('true');
    expect(triggerInput.getAttribute('aria-describedby')).toContain(
      'snippet-trigger-error',
    );
  });

  it('reports a saved Snippet accurately when catalog publication is unavailable', async () => {
    const persisted = { ...entry, id: 'persisted', trigger: ';saved' };
    const library = createSnippetLibrary({
      create: vi.fn(async () => {
        throw new CatalogUnavailableAfterMutationError(persisted);
      }),
    });
    render(<SnippetLibraryView snippetLibrary={library} />);
    await screen.findByText('No snippets saved yet.');
    fireEvent.click(screen.getByRole('button', { name: 'Create snippet' }));

    expect(await screen.findByText(persisted.title)).toBeTruthy();
    expect(
      screen.getByText(
        'Snippet saved. Trigger expansion is temporarily unavailable.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/could not create/i)).toBeNull();
  });

  it('edits a snippet and immediately renders the repository result', async () => {
    const updatedEntry = {
      ...entry,
      title: 'Updated order confirmation',
      content: 'Your updated order has been confirmed.',
      tags: ['orders'],
      updatedAt: '2026-07-26T12:00:02.000Z',
    };
    const library = createSnippetLibrary({
      load: vi.fn(async () => [entry]),
      update: vi.fn(async () => updatedEntry),
    });
    render(<SnippetLibraryView snippetLibrary={library} />);
    await screen.findByText(entry.title);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Title')).toHaveProperty('value', entry.title);
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: updatedEntry.title },
    });
    fireEvent.change(screen.getByLabelText('Content'), {
      target: { value: updatedEntry.content },
    });
    fireEvent.change(screen.getByLabelText('Tags (comma-separated)'), {
      target: { value: 'orders' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(library.update).toHaveBeenCalledWith(entry.id, {
        title: updatedEntry.title,
        content: updatedEntry.content,
        tags: ['orders'],
        trigger: null,
      }),
    );
    expect(await screen.findByText(updatedEntry.title)).toBeTruthy();
    expect(screen.getByText('Snippet updated.')).toBeTruthy();
  });

  it('requires confirmation before deleting and removes a confirmed snippet', async () => {
    const confirmDelete = vi
      .fn<(candidate: SnippetEntry) => boolean>()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const library = createSnippetLibrary({
      load: vi.fn(async () => [entry]),
    });
    render(
      <SnippetLibraryView
        confirmDelete={confirmDelete}
        snippetLibrary={library}
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
    expect(screen.getByText('Snippet deleted.')).toBeTruthy();
  });

  it('shows safe user-visible load and persistence errors', async () => {
    const failedLoad = createSnippetLibrary({
      load: vi.fn(async () => {
        throw new Error('raw IndexedDB load failure');
      }),
    });
    const { rerender } = render(
      <SnippetLibraryView snippetLibrary={failedLoad} />,
    );

    expect(
      await screen.findByText(
        'We could not load your Snippet Library. Please try again.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('raw IndexedDB load failure')).toBeNull();

    const failedCreate = createSnippetLibrary({
      create: vi.fn(async () => {
        throw new Error('raw Dexie create failure');
      }),
    });
    rerender(<SnippetLibraryView snippetLibrary={failedCreate} />);
    await screen.findByText('No snippets saved yet.');
    fireEvent.click(screen.getByRole('button', { name: 'Create snippet' }));

    expect(
      await screen.findByText(
        'We could not create this snippet. Please try again.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('raw Dexie create failure')).toBeNull();
  });

  it('navigates between distinct libraries without reloading either view', async () => {
    const knowledgeLibrary = createKnowledgeLibrary();
    const settings = createSettings();
    const snippetLibrary = createSnippetLibrary();
    render(
      <OptionsShell
        importExport={importExport}
        knowledgeLibrary={knowledgeLibrary}
        settings={settings}
        snippetLibrary={snippetLibrary}
      />,
    );

    expect(await screen.findByText('No knowledge entries yet.')).toBeTruthy();
    expect(snippetLibrary.load).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('tab', { name: 'Snippet Library' }));
    expect(await screen.findByText('No snippets saved yet.')).toBeTruthy();
    expect(snippetLibrary.load).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('tab', { name: 'Knowledge Library' }));
    expect(
      screen.getByRole('heading', { name: 'Knowledge Library' }),
    ).toBeTruthy();
    expect(knowledgeLibrary.load).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('tab', { name: 'Snippet Library' }));
    expect(
      screen.getByRole('heading', { name: 'Snippet Library' }),
    ).toBeTruthy();
    expect(snippetLibrary.load).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(
      await screen.findByRole('heading', { name: 'Settings' }),
    ).toBeTruthy();
    expect(settings.load).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('tab', { name: 'Snippet Library' }));
    expect(snippetLibrary.load).toHaveBeenCalledOnce();
  });
});
