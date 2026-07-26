import { type FormEvent, useEffect, useState } from 'react';

import type { SnippetEntryInput } from '../../application/persistence/snippet-entry-repository';
import {
  orderSnippetEntries,
  type SnippetLibrary,
} from '../../application/snippet/snippet-library';
import type { SnippetEntry } from '../../domain/snippet-entry';
import { formatTags, parseTags } from '../library/tags';

interface SnippetDraft {
  title: string;
  content: string;
  tags: string;
}

interface SnippetLibraryViewProps {
  snippetLibrary: SnippetLibrary;
  confirmDelete?: (entry: SnippetEntry) => boolean;
}

const EMPTY_DRAFT: SnippetDraft = {
  title: '',
  content: '',
  tags: '',
};

function defaultDeleteConfirmation(entry: SnippetEntry): boolean {
  return globalThis.confirm(
    `Delete “${entry.title}”? This permanently removes the local snippet.`,
  );
}

function draftFromEntry(entry: SnippetEntry): SnippetDraft {
  return {
    title: entry.title,
    content: entry.content,
    tags: formatTags(entry.tags),
  };
}

function inputFromDraft(draft: SnippetDraft): SnippetEntryInput {
  return {
    title: draft.title,
    content: draft.content,
    tags: parseTags(draft.tags),
  };
}

export function SnippetLibraryView({
  snippetLibrary,
  confirmDelete = defaultDeleteConfirmation,
}: SnippetLibraryViewProps) {
  const [entries, setEntries] = useState<readonly SnippetEntry[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [draft, setDraft] = useState<SnippetDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string>();
  const [operation, setOperation] = useState<'saving' | 'deleting'>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [statusMessage, setStatusMessage] = useState<string>();

  async function loadEntries() {
    setLoadState('loading');
    setErrorMessage(undefined);

    try {
      const loadedEntries = await snippetLibrary.load();
      setEntries(loadedEntries);
      setLoadState('ready');
    } catch {
      setLoadState('failed');
      setErrorMessage(
        'We could not load your Snippet Library. Please try again.',
      );
    }
  }

  useEffect(() => {
    let active = true;

    void snippetLibrary.load().then(
      (loadedEntries) => {
        if (!active) return;
        setEntries(loadedEntries);
        setLoadState('ready');
      },
      () => {
        if (!active) return;
        setLoadState('failed');
        setErrorMessage(
          'We could not load your Snippet Library. Please try again.',
        );
      },
    );

    return () => {
      active = false;
    };
  }, [snippetLibrary]);

  function resetForm() {
    setDraft(EMPTY_DRAFT);
    setEditingId(undefined);
  }

  function updateDraft(field: keyof SnippetDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function beginEditing(entry: SnippetEntry) {
    setDraft(draftFromEntry(entry));
    setEditingId(entry.id);
    setErrorMessage(undefined);
    setStatusMessage(undefined);
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperation('saving');
    setErrorMessage(undefined);
    setStatusMessage(undefined);

    try {
      if (editingId) {
        const updated = await snippetLibrary.update(
          editingId,
          inputFromDraft(draft),
        );
        setEntries((current) =>
          orderSnippetEntries(
            current.map((entry) => (entry.id === updated.id ? updated : entry)),
          ),
        );
        setStatusMessage('Snippet updated.');
      } else {
        const created = await snippetLibrary.create(inputFromDraft(draft));
        setEntries((current) => orderSnippetEntries([...current, created]));
        setStatusMessage('Snippet created.');
      }

      resetForm();
    } catch {
      setErrorMessage(
        editingId
          ? 'We could not update this snippet. Please try again.'
          : 'We could not create this snippet. Please try again.',
      );
    } finally {
      setOperation(undefined);
    }
  }

  async function deleteEntry(entry: SnippetEntry) {
    if (!confirmDelete(entry)) return;

    setOperation('deleting');
    setErrorMessage(undefined);
    setStatusMessage(undefined);

    try {
      const existed = await snippetLibrary.delete(entry.id);
      setEntries((current) =>
        current.filter((candidate) => candidate.id !== entry.id),
      );

      if (editingId === entry.id) resetForm();
      setStatusMessage(
        existed ? 'Snippet deleted.' : 'This snippet was already removed.',
      );
    } catch {
      setErrorMessage('We could not delete this snippet. Please try again.');
    } finally {
      setOperation(undefined);
    }
  }

  const isBusy = operation !== undefined;

  return (
    <section aria-labelledby="snippet-library-heading" className="mt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id="snippet-library-heading"
            className="text-xl font-semibold text-slate-950"
          >
            Snippet Library
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Save and maintain reusable response text on this device.
          </p>
        </div>
        {loadState === 'ready' ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {entries.length} {entries.length === 1 ? 'snippet' : 'snippets'}
          </span>
        ) : null}
      </div>

      {errorMessage ? (
        <div
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <p>{errorMessage}</p>
          {loadState === 'failed' ? (
            <button
              className="mt-3 rounded-md bg-red-700 px-3 py-2 font-medium text-white hover:bg-red-800"
              onClick={() => void loadEntries()}
              type="button"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {statusMessage ? (
        <p
          className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}

      {loadState === 'loading' ? (
        <p className="mt-6 text-sm text-slate-600" role="status">
          Loading snippets…
        </p>
      ) : null}

      {loadState === 'ready' ? (
        <>
          <form
            aria-label={editingId ? 'Edit snippet' : 'Create snippet'}
            className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={(event) => void saveEntry(event)}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-slate-900">
                {editingId ? 'Edit snippet' : 'Create snippet'}
              </h3>
              {editingId ? (
                <button
                  className="text-sm font-medium text-slate-600 hover:text-slate-950"
                  disabled={isBusy}
                  onClick={resetForm}
                  type="button"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={isBusy}
                onChange={(event) => updateDraft('title', event.target.value)}
                type="text"
                value={draft.title}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Content
              <textarea
                className="mt-1 block min-h-32 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={isBusy}
                onChange={(event) => updateDraft('content', event.target.value)}
                value={draft.content}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Tags (comma-separated)
              <input
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={isBusy}
                onChange={(event) => updateDraft('tags', event.target.value)}
                placeholder="billing, greeting"
                type="text"
                value={draft.tags}
              />
            </label>

            <button
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isBusy}
              type="submit"
            >
              {operation === 'saving'
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : 'Create snippet'}
            </button>
          </form>

          <div className="mt-8">
            <h3 className="font-semibold text-slate-900">Saved snippets</h3>
            {entries.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="font-medium text-slate-800">
                  No snippets saved yet.
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Create your first snippet using the form above.
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-4">
                {entries.map((entry) => (
                  <li
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    key={entry.id}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-semibold text-slate-950">
                        {entry.title}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          disabled={isBusy}
                          onClick={() => beginEditing(entry)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                          disabled={isBusy}
                          onClick={() => void deleteEntry(entry)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
                      {entry.content}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {entry.tags.length === 0 ? (
                        <span className="text-xs text-slate-500">No tags</span>
                      ) : (
                        entry.tags.map((tag, index) => (
                          <span
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                            key={`${entry.id}-${index}`}
                          >
                            {tag}
                          </span>
                        ))
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
