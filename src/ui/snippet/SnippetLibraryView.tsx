import {
  type FormEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { SnippetEntryInput } from '../../application/persistence/snippet-entry-repository';
import {
  orderSnippetEntries,
  type SnippetLibrary,
} from '../../application/snippet/snippet-library';
import { CatalogUnavailableAfterMutationError } from '../../application/snippet/catalog-mutation';
import {
  DuplicateSnippetTriggerError,
  InvalidSnippetTriggerError,
} from '../../application/snippet/snippet-trigger';
import type {
  SnippetAsset,
  SnippetAssetDraft,
} from '../../domain/snippet-asset';
import type { SnippetEntry } from '../../domain/snippet-entry';
import {
  convertPlainSnippetToRich,
  InvalidSnippetContentError,
  renderSnippetPlainText,
  type RichSnippetContent,
} from '../../domain/snippet-content';
import { formatTags, parseTags } from '../library/tags';
import { ImageSnippetEditor } from './ImageSnippetEditor';
import { ImagePreviewUrl } from './image-preview-url';
import { isSupportedTextSnippetContent } from './text-editor-document';
import { TextSnippetEditor } from './TextSnippetEditor';
import type { CopySnippetToClipboard } from '../../application/snippet/copy-snippet-to-clipboard';

type EditorMode = 'closed' | 'chooser' | 'text' | 'image' | 'compatibility';
type LibraryFilter = 'all' | 'text' | 'images';

interface EditNavigationRequest {
  readonly id: number;
  readonly mode: 'text' | 'image' | 'compatibility';
}

interface SnippetDraft {
  title: string;
  content: RichSnippetContent;
  tags: string;
  trigger: string;
}

interface SnippetLibraryViewProps {
  snippetLibrary: SnippetLibrary;
  copySnippet?: CopySnippetToClipboard | undefined;
}

const EMPTY_RICH_CONTENT: RichSnippetContent = {
  kind: 'rich',
  blocks: [{ type: 'paragraph', children: [] }],
};
const SNIPPETS_PER_PAGE = 100;

function emptyDraft(): SnippetDraft {
  return { title: '', content: EMPTY_RICH_CONTENT, tags: '', trigger: '' };
}

function filterSnippetEntries(
  entries: readonly SnippetEntry[],
  filter: LibraryFilter,
  search: string,
): SnippetEntry[] {
  const query = search.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    const typeMatches =
      filter === 'all' ||
      (filter === 'images'
        ? entry.content.kind === 'image'
        : entry.content.kind !== 'image');
    const searchMatches =
      query === '' ||
      [entry.title, entry.trigger ?? '', ...entry.tags].some((value) =>
        value.toLocaleLowerCase().includes(query),
      );
    return typeMatches && searchMatches;
  });
}

function pageCount(resultCount: number): number {
  return Math.max(1, Math.ceil(resultCount / SNIPPETS_PER_PAGE));
}

async function readSnippetLibraryData(snippetLibrary: SnippetLibrary) {
  const [entries, usageStats] = await Promise.all([
    snippetLibrary.load(),
    snippetLibrary.loadUsageStats?.() ?? Promise.resolve([]),
  ]);
  return {
    entries,
    usageCounts: new Map(
      usageStats.map((stats) => [stats.snippetId, stats.usageCount]),
    ),
  };
}

function draftFromEntry(entry: SnippetEntry): SnippetDraft {
  if (entry.content.kind === 'image') throw new InvalidSnippetContentError();
  return {
    title: entry.title,
    content:
      entry.content.kind === 'plain'
        ? convertPlainSnippetToRich(entry.content)
        : entry.content,
    tags: formatTags(entry.tags),
    trigger: entry.trigger ?? '',
  };
}

function ImageThumbnail({
  assetId,
  snippetLibrary,
}: {
  readonly assetId: string;
  readonly snippetLibrary: SnippetLibrary;
}) {
  const [url, setUrl] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const preview = new ImagePreviewUrl(URL);
    void (
      snippetLibrary.loadAsset?.(assetId) ?? Promise.resolve(undefined)
    ).then(
      (asset) => {
        if (!active) return;
        if (asset === undefined) {
          setFailed(true);
          return;
        }
        setFailed(false);
        setUrl(preview.replace(asset.blob));
      },
      () => active && setFailed(true),
    );
    return () => {
      active = false;
      preview.clear();
    };
  }, [assetId, snippetLibrary]);
  if (failed) {
    return (
      <div
        className="mt-3 flex h-20 w-28 items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-2 text-center text-xs text-amber-800"
        role="status"
      >
        Preview unavailable
      </div>
    );
  }
  return url ? (
    <img
      alt="Image Snippet details preview"
      className="mt-2 max-h-32 w-full rounded-md border border-slate-200 object-contain"
      loading="lazy"
      onError={() => setFailed(true)}
      src={url}
    />
  ) : null;
}

export function SnippetLibraryView({
  snippetLibrary,
  copySnippet,
}: SnippetLibraryViewProps) {
  const [entries, setEntries] = useState<readonly SnippetEntry[]>([]);
  const [usageCounts, setUsageCounts] = useState<ReadonlyMap<string, number>>(
    new Map(),
  );
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [mode, setMode] = useState<EditorMode>('closed');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<SnippetDraft>(emptyDraft);
  const [imageAsset, setImageAsset] = useState<
    SnippetAsset | SnippetAssetDraft
  >();
  const [editingId, setEditingId] = useState<string>();
  const [operation, setOperation] = useState<
    'saving' | 'deleting' | 'copying'
  >();
  const [pendingDelete, setPendingDelete] =
    useState<Pick<SnippetEntry, 'id' | 'title'>>();
  const returnFocusId = useRef<string | undefined>(undefined);
  const deleteButtons = useRef(new Map<string, HTMLButtonElement>());
  const [errorMessage, setErrorMessage] = useState<string>();
  const [triggerErrorMessage, setTriggerErrorMessage] = useState<string>();
  const [statusMessage, setStatusMessage] = useState<string>();
  const assetLoadGeneration = useRef(0);
  const editNavigationGeneration = useRef(0);
  const [editNavigationRequest, setEditNavigationRequest] =
    useState<EditNavigationRequest>();
  const authoringFormRef = useRef<HTMLFormElement>(null);
  const imageTitleRef = useRef<HTMLInputElement>(null);
  const compatibilitySectionRef = useRef<HTMLElement>(null);
  const compatibilityCloseRef = useRef<HTMLButtonElement>(null);

  function replaceEntries(nextEntries: readonly SnippetEntry[]) {
    setEntries(nextEntries);
    const nextPageCount = pageCount(
      filterSnippetEntries(nextEntries, filter, search).length,
    );
    setPage((current) => Math.min(current, nextPageCount));
  }

  function requestEditNavigation(requestMode: EditNavigationRequest['mode']) {
    editNavigationGeneration.current += 1;
    setEditNavigationRequest({
      id: editNavigationGeneration.current,
      mode: requestMode,
    });
  }

  useLayoutEffect(() => {
    if (editNavigationRequest === undefined) return;
    if (
      editNavigationRequest.mode === 'compatibility' &&
      mode === 'compatibility'
    ) {
      compatibilitySectionRef.current?.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
      compatibilityCloseRef.current?.focus();
      return;
    }
    if (editNavigationRequest.mode !== mode) return;
    authoringFormRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'start',
    });
    if (mode === 'image') imageTitleRef.current?.focus();
  }, [editNavigationRequest, mode]);

  async function loadEntries() {
    setLoadState('loading');
    setErrorMessage(undefined);
    try {
      const loaded = await readSnippetLibraryData(snippetLibrary);
      setEntries(loaded.entries);
      setPage(1);
      setUsageCounts(loaded.usageCounts);
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
    void readSnippetLibraryData(snippetLibrary).then(
      (loaded) => {
        if (!active) return;
        setEntries(loaded.entries);
        setPage(1);
        setUsageCounts(loaded.usageCounts);
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

  function closeEditor() {
    assetLoadGeneration.current += 1;
    setMode('closed');
    setDraft(emptyDraft());
    setImageAsset(undefined);
    setEditingId(undefined);
    setEditNavigationRequest(undefined);
    setTriggerErrorMessage(undefined);
  }

  function openNewText() {
    assetLoadGeneration.current += 1;
    setDraft(emptyDraft());
    setEditingId(undefined);
    setEditNavigationRequest(undefined);
    setMode('text');
    setErrorMessage(undefined);
  }

  function openNewImage() {
    assetLoadGeneration.current += 1;
    setDraft(emptyDraft());
    setImageAsset(undefined);
    setEditingId(undefined);
    setEditNavigationRequest(undefined);
    setMode('image');
    setErrorMessage(undefined);
  }

  async function beginEditing(entry: SnippetEntry) {
    const loadGeneration = assetLoadGeneration.current + 1;
    assetLoadGeneration.current = loadGeneration;
    setStatusMessage(undefined);
    setErrorMessage(undefined);
    setEditingId(entry.id);
    if (entry.content.kind === 'image') {
      setImageAsset(undefined);
      setDraft({
        title: entry.title,
        content: EMPTY_RICH_CONTENT,
        tags: formatTags(entry.tags),
        trigger: entry.trigger ?? '',
      });
      setMode('image');
      requestEditNavigation('image');
      try {
        const asset = await snippetLibrary.loadAsset?.(entry.content.assetId);
        if (assetLoadGeneration.current !== loadGeneration) return;
        if (asset === undefined) throw new Error('missing asset');
        setImageAsset(asset);
      } catch {
        if (assetLoadGeneration.current !== loadGeneration) return;
        setErrorMessage(
          'We could not load this image. The saved Snippet was not changed.',
        );
      }
      return;
    }
    if (
      entry.content.kind === 'rich' &&
      !isSupportedTextSnippetContent(entry.content)
    ) {
      setMode('compatibility');
      requestEditNavigation('compatibility');
      return;
    }
    setDraft(draftFromEntry(entry));
    setMode('text');
    requestEditNavigation('text');
  }

  function updateDraft(field: 'title' | 'tags' | 'trigger', value: string) {
    if (field === 'trigger') setTriggerErrorMessage(undefined);
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperation('saving');
    setErrorMessage(undefined);
    setTriggerErrorMessage(undefined);
    setStatusMessage(undefined);
    const newAsset =
      imageAsset !== undefined && !('snippetId' in imageAsset)
        ? imageAsset
        : undefined;
    const input: SnippetEntryInput = {
      title: draft.title,
      content:
        mode === 'image' && imageAsset !== undefined
          ? { kind: 'image', assetId: imageAsset.id }
          : draft.content,
      tags: parseTags(draft.tags),
      trigger: draft.trigger === '' ? null : draft.trigger,
      ...(newAsset === undefined ? {} : { newAssets: [newAsset] }),
    };
    try {
      const saved = editingId
        ? await snippetLibrary.update(editingId, input)
        : await snippetLibrary.create(input);
      replaceEntries(
        orderSnippetEntries(
          editingId
            ? entries.map((entry) => (entry.id === saved.id ? saved : entry))
            : [...entries, saved],
        ),
      );
      closeEditor();
      setStatusMessage(editingId ? 'Snippet updated.' : 'Snippet created.');
    } catch (error) {
      if (error instanceof CatalogUnavailableAfterMutationError) {
        const persisted = error.persistedResult as SnippetEntry;
        replaceEntries(
          orderSnippetEntries(
            editingId
              ? entries.map((entry) =>
                  entry.id === persisted.id ? persisted : entry,
                )
              : [...entries, persisted],
          ),
        );
        closeEditor();
        setStatusMessage(
          'Snippet saved. Trigger expansion is temporarily unavailable.',
        );
      } else if (
        error instanceof InvalidSnippetTriggerError ||
        error instanceof DuplicateSnippetTriggerError
      ) {
        setTriggerErrorMessage(error.message);
      } else {
        setErrorMessage(
          editingId
            ? 'We could not update this snippet. Your draft is still here.'
            : 'We could not create this snippet. Your draft is still here.',
        );
      }
    } finally {
      setOperation(undefined);
    }
  }

  useLayoutEffect(() => {
    if (pendingDelete !== undefined || returnFocusId.current === undefined)
      return;
    deleteButtons.current.get(returnFocusId.current)?.focus();
    returnFocusId.current = undefined;
  }, [pendingDelete]);

  function requestDelete(entry: SnippetEntry) {
    returnFocusId.current = entry.id;
    setPendingDelete({ id: entry.id, title: entry.title });
  }

  async function confirmPendingDelete() {
    if (pendingDelete === undefined || operation === 'deleting') return;
    const target = entries.find((entry) => entry.id === pendingDelete.id);
    if (target === undefined) {
      setPendingDelete(undefined);
      setErrorMessage(
        'That Snippet is no longer available. Nothing was deleted.',
      );
      return;
    }
    setOperation('deleting');
    setErrorMessage(undefined);
    try {
      await snippetLibrary.delete(target.id);
      replaceEntries(entries.filter((candidate) => candidate.id !== target.id));
      if (editingId === target.id) closeEditor();
      setStatusMessage('Snippet deleted.');
    } catch (error) {
      if (error instanceof CatalogUnavailableAfterMutationError) {
        replaceEntries(
          entries.filter((candidate) => candidate.id !== target.id),
        );
        if (editingId === target.id) closeEditor();
        setStatusMessage(
          'Snippet deleted. Trigger expansion is temporarily unavailable.',
        );
      } else {
        setErrorMessage('We could not delete this snippet. Please try again.');
      }
    } finally {
      setOperation(undefined);
      setPendingDelete(undefined);
    }
  }

  async function copyEntry(entry: SnippetEntry) {
    if (copySnippet === undefined) {
      setErrorMessage(
        'Clipboard delivery is unavailable. Check Settings and try again.',
      );
      return;
    }
    setOperation('copying');
    setErrorMessage(undefined);
    setStatusMessage(undefined);
    const result = await copySnippet.copy(entry.id);
    if (result.outcome === 'copied') {
      setStatusMessage(
        result.kind === 'image' ? 'Image copied.' : 'Snippet copied.',
      );
    } else {
      setErrorMessage(
        'We could not copy this Snippet. Check Settings and try again.',
      );
    }
    setOperation(undefined);
  }

  const visibleEntries = useMemo(
    () => filterSnippetEntries(entries, filter, search),
    [entries, filter, search],
  );

  const totalPages = pageCount(visibleEntries.length);
  const currentPage = Math.min(page, totalPages);
  const firstVisibleIndex = (currentPage - 1) * SNIPPETS_PER_PAGE;
  const pageEntries = visibleEntries.slice(
    firstVisibleIndex,
    firstVisibleIndex + SNIPPETS_PER_PAGE,
  );

  const isBusy = operation !== undefined;
  const canSave =
    !isBusy &&
    mode !== 'compatibility' &&
    (mode !== 'image' || imageAsset !== undefined);

  return (
    <section aria-labelledby="snippet-library-heading" className="mt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className="text-xl font-semibold text-slate-950"
            id="snippet-library-heading"
          >
            Snippets
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Reusable text and images stored on this device.
          </p>
        </div>
        <button
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          disabled={isBusy}
          onClick={() => setMode('chooser')}
          type="button"
        >
          + New Snippet
        </button>
      </div>

      {errorMessage ? (
        <div
          className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <p>{errorMessage}</p>
          {loadState === 'failed' ? (
            <button
              className="mt-3 rounded-md bg-red-700 px-3 py-2 font-medium text-white"
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

      {mode === 'chooser' ? (
        <section
          aria-label="Create Snippet"
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex justify-between">
            <h3 className="font-semibold text-slate-900">Create Snippet</h3>
            <button
              className="text-sm text-slate-600"
              onClick={closeEditor}
              type="button"
            >
              Cancel
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              className="rounded-lg border border-slate-300 p-4 text-left hover:border-blue-500 hover:bg-blue-50"
              onClick={openNewText}
              type="button"
            >
              <span className="block font-semibold">Text Snippet</span>
              <span className="mt-1 block text-sm text-slate-600">
                Reusable formatted text
              </span>
            </button>
            <button
              className="rounded-lg border border-slate-300 p-4 text-left hover:border-blue-500 hover:bg-blue-50"
              onClick={openNewImage}
              type="button"
            >
              <span className="block font-semibold">Image Snippet</span>
              <span className="mt-1 block text-sm text-slate-600">
                Reusable screenshot or image
              </span>
            </button>
          </div>
        </section>
      ) : null}

      {mode === 'compatibility' ? (
        <section
          aria-label="Legacy snippet compatibility"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5"
          ref={compatibilitySectionRef}
        >
          <h3 className="font-semibold text-amber-950">
            This Text Snippet is read-only
          </h3>
          <p className="mt-2 text-sm text-amber-900">
            It contains a legacy image format that the current text editor
            cannot safely change. Its saved content remains preserved.
          </p>
          <button
            className="mt-4 rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-medium"
            onClick={closeEditor}
            ref={compatibilityCloseRef}
            type="button"
          >
            Close
          </button>
        </section>
      ) : null}

      {mode === 'text' || mode === 'image' ? (
        <form
          aria-label={
            editingId ? `Edit ${mode} snippet` : `Create ${mode} snippet`
          }
          className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={(event) => void saveEntry(event)}
          ref={authoringFormRef}
        >
          <div className="flex justify-between">
            <h3 className="font-semibold text-slate-900">
              {editingId ? 'Edit' : 'New'}{' '}
              {mode === 'text' ? 'Text Snippet' : 'Image Snippet'}
            </h3>
            <button
              className="text-sm font-medium text-slate-600"
              disabled={isBusy}
              onClick={closeEditor}
              type="button"
            >
              Cancel
            </button>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={isBusy}
              onChange={(event) => updateDraft('title', event.target.value)}
              ref={mode === 'image' ? imageTitleRef : undefined}
              type="text"
              value={draft.title}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Trigger (optional)
            <input
              aria-invalid={triggerErrorMessage ? true : undefined}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-mono"
              disabled={isBusy}
              onChange={(event) => updateDraft('trigger', event.target.value)}
              placeholder=";welcome"
              type="text"
              value={draft.trigger}
            />
            {triggerErrorMessage ? (
              <span className="mt-1 block text-xs text-red-700" role="alert">
                {triggerErrorMessage}
              </span>
            ) : null}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Tags (comma-separated)
            <input
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
              disabled={isBusy}
              onChange={(event) => updateDraft('tags', event.target.value)}
              placeholder="greeting, support"
              type="text"
              value={draft.tags}
            />
          </label>
          {mode === 'text' ? (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Content</p>
              <TextSnippetEditor
                content={draft.content}
                disabled={isBusy}
                key={editingId ?? 'new-text'}
                onChange={(content) =>
                  setDraft((current) => ({ ...current, content }))
                }
                {...(editNavigationRequest?.mode === 'text'
                  ? { focusRequest: editNavigationRequest.id }
                  : {})}
              />
            </div>
          ) : (
            <ImageSnippetEditor
              asset={imageAsset}
              disabled={isBusy}
              onChange={setImageAsset}
            />
          )}
          <div className="flex gap-2">
            <button
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold"
              disabled={isBusy}
              onClick={closeEditor}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!canSave}
              type="submit"
            >
              {operation === 'saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      ) : null}

      {loadState === 'loading' ? (
        <p className="mt-6 text-sm text-slate-600" role="status">
          Loading snippets…
        </p>
      ) : null}
      {loadState === 'ready' ? (
        <div className="mt-6">
          <label className="sr-only" htmlFor="snippet-search">
            Search snippets
          </label>
          <input
            className="block w-full rounded-md border border-slate-300 px-3 py-2"
            id="snippet-search"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search snippets..."
            type="search"
            value={search}
          />
          <div aria-label="Snippet type filter" className="mt-3 flex gap-2">
            {(['all', 'text', 'images'] as const).map((value) => (
              <button
                aria-pressed={filter === value}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-sm capitalize aria-pressed:border-blue-600 aria-pressed:bg-blue-100"
                key={value}
                onClick={() => {
                  setFilter(value);
                  setPage(1);
                }}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
          {visibleEntries.length === 0 ? (
            <p className="mt-6 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
              No matching snippets.
            </p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <p aria-live="polite">
                  Showing {firstVisibleIndex + 1}–
                  {firstVisibleIndex + pageEntries.length} of{' '}
                  {visibleEntries.length} snippets
                </p>
                {totalPages > 1 ? (
                  <nav
                    aria-label="Snippet pages"
                    className="flex items-center gap-3"
                  >
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={currentPage === 1}
                      onClick={() => setPage((current) => current - 1)}
                      type="button"
                    >
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage((current) => current + 1)}
                      type="button"
                    >
                      Next
                    </button>
                  </nav>
                ) : null}
              </div>
              <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {pageEntries.map((entry) => {
                  const usageCount = usageCounts.get(entry.id) ?? 0;

                  return (
                    <li
                      className="p-4"
                      data-snippet-id={entry.id}
                      key={entry.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-950">
                            {entry.title}
                          </h3>
                          {entry.trigger ? (
                            <p className="mt-1 font-mono text-sm text-blue-700">
                              {entry.trigger}
                            </p>
                          ) : null}
                        </div>
                        <div
                          aria-label="Snippet actions"
                          className="flex shrink-0 gap-1"
                        >
                          <button
                            aria-label="Delete Snippet"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-200 text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                            disabled={isBusy}
                            onClick={() => requestDelete(entry)}
                            ref={(node) => {
                              if (node === null)
                                deleteButtons.current.delete(entry.id);
                              else deleteButtons.current.set(entry.id, node);
                            }}
                            title="Delete Snippet"
                            type="button"
                          >
                            <svg
                              aria-hidden="true"
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            aria-label="Edit Snippet"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isBusy}
                            onClick={() => void beginEditing(entry)}
                            title="Edit Snippet"
                            type="button"
                          >
                            <svg
                              aria-hidden="true"
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="m4 20 4.5-1 10-10a2.12 2.12 0 0 0-3-3l-10 10L4 20Z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            aria-label="Copy Snippet"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isBusy}
                            onClick={() => void copyEntry(entry)}
                            title="Copy Snippet"
                            type="button"
                          >
                            <svg
                              aria-hidden="true"
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <rect height="12" rx="2" width="12" x="8" y="8" />
                              <path
                                d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                          {entry.content.kind === 'image' ? 'Image' : 'Text'}
                        </span>
                        <span
                          aria-label={`Usage count: ${usageCount}`}
                          className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                        >
                          {usageCount}
                        </span>
                      </div>
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Details
                        </p>
                        {entry.content.kind === 'image' ? (
                          <ImageThumbnail
                            assetId={entry.content.assetId}
                            snippetLibrary={snippetLibrary}
                          />
                        ) : (
                          <p className="mt-2 line-clamp-3 max-h-18 overflow-hidden whitespace-pre-wrap text-sm text-slate-600">
                            {renderSnippetPlainText(entry.content)}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      ) : null}
      {pendingDelete === undefined ? null : (
        <div
          aria-labelledby="delete-snippet-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3
              className="text-lg font-semibold text-slate-950"
              id="delete-snippet-title"
            >
              Delete &quot;{pendingDelete.title}&quot;?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This Snippet will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                autoFocus
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={operation === 'deleting'}
                onClick={() => setPendingDelete(undefined)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={operation === 'deleting'}
                onClick={() => void confirmPendingDelete()}
                type="button"
              >
                {operation === 'deleting' ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
