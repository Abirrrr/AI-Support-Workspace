import { useState } from 'react';

interface WorkspaceShellProps {
  readonly openOptionsPage: () => Promise<void>;
}

export function WorkspaceShell({ openOptionsPage }: WorkspaceShellProps) {
  const [navigationError, setNavigationError] = useState<string | null>(null);

  function autoGrowTextArea(element: HTMLTextAreaElement) {
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }

  return (
    <main
      className="min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-100 px-3 py-4 text-slate-950"
      data-layout="responsive-side-panel"
    >
      <div className="w-full min-w-0 rounded-xl bg-white p-4 shadow-sm">
        <header className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 text-lg font-semibold leading-tight">
            AI Support Workspace
          </h1>
          <button
            aria-label="Open Settings and Libraries"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              setNavigationError(null);
              void openOptionsPage().catch(() =>
                setNavigationError("Couldn't open Settings. Try again."),
              );
            }}
            title="Open Settings and Libraries"
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
                d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.46 5.46l1.42 1.42M17.12 17.12l1.42 1.42M18.54 5.46l-1.42 1.42M6.88 17.12l-1.42 1.42"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </button>
        </header>
        <div
          aria-live="polite"
          className="mt-2 min-h-5 text-sm text-red-700"
          role="status"
        >
          {navigationError}
        </div>

        <div className="mt-3 grid min-w-0 gap-4">
          <section className="min-w-0">
            <label
              className="block text-sm font-semibold text-slate-800"
              htmlFor="merchant-context"
            >
              Merchant Context
            </label>
            <textarea
              className="mt-1 block min-h-12 max-h-40 w-full min-w-0 resize-none overflow-y-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              id="merchant-context"
              onInput={(event) => autoGrowTextArea(event.currentTarget)}
              rows={1}
            />
          </section>

          <section aria-labelledby="context-images-label" className="min-w-0">
            <h2
              className="text-sm font-semibold text-slate-800"
              id="context-images-label"
            >
              Context Images
            </h2>
            <div
              aria-describedby="context-images-status"
              className="mt-1 min-h-14 w-full min-w-0 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2"
              role="group"
            >
              <p
                className="text-xs leading-5 text-slate-500"
                id="context-images-status"
              >
                Image attachments are not available yet.
              </p>
            </div>
          </section>

          <section className="min-w-0">
            <label
              className="block text-sm font-semibold text-slate-800"
              htmlFor="guidance-gist"
            >
              Guidance / Gist
            </label>
            <textarea
              className="mt-1 block min-h-12 max-h-40 w-full min-w-0 resize-none overflow-y-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              id="guidance-gist"
              onInput={(event) => autoGrowTextArea(event.currentTarget)}
              rows={1}
            />
          </section>

          <div
            className="flex min-w-0 flex-wrap items-end gap-2"
            data-layout="responsive-model-actions"
          >
            <label className="min-w-0 flex-1 text-sm font-semibold text-slate-800">
              Model
              <select
                aria-describedby="model-status"
                className="mt-1 block h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-100 px-3 text-sm text-slate-500"
                disabled
              >
                <option>Not configured</option>
              </select>
            </label>
            <button
              className="h-10 shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              disabled
              type="button"
            >
              Generate
            </button>
            <p className="sr-only" id="model-status">
              Model selection and generation will be available in a later
              milestone.
            </p>
          </div>

          <section className="min-w-0" aria-labelledby="generated-output-label">
            <div
              className="flex min-w-0 flex-wrap items-center justify-between gap-2"
              data-layout="responsive-output-actions"
            >
              <h2
                className="text-sm font-semibold text-slate-800"
                id="generated-output-label"
              >
                Generated Output
              </h2>
              <div className="flex min-w-0 flex-wrap gap-2">
                <button
                  className="min-h-9 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  disabled
                  type="button"
                >
                  Save as Snippet
                </button>
                <button
                  className="min-h-9 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  disabled
                  type="button"
                >
                  Copy
                </button>
              </div>
            </div>
            <textarea
              aria-label="Generated Output"
              className="mt-2 block min-h-32 w-full min-w-0 resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-5 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              rows={6}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
