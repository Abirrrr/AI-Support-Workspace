import { useState } from 'react';

interface PopupShellProps {
  openWorkspace(): Promise<void>;
}

export function PopupShell({ openWorkspace }: PopupShellProps) {
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  async function handleOpenWorkspace() {
    setWorkspaceError(null);

    try {
      await openWorkspace();
    } catch {
      setWorkspaceError('Could not open Workspace. Try again.');
    }
  }

  return (
    <main className="w-80 bg-slate-950 p-6 text-slate-50">
      <h1 className="text-lg font-semibold">AI Support Workspace</h1>
      <p className="mt-2 text-sm text-slate-300">
        Your local support workspace is ready.
      </p>
      <button
        className="mt-5 block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-500"
        onClick={() => void handleOpenWorkspace()}
        type="button"
      >
        Open Workspace
      </button>
      <div aria-live="polite" className="mt-2 min-h-5 text-xs text-red-300">
        {workspaceError}
      </div>
      <a
        className="mt-1 block w-full rounded-md border border-slate-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
        href="/options.html"
        rel="noreferrer"
        target="_blank"
      >
        Open Libraries
      </a>
    </main>
  );
}
