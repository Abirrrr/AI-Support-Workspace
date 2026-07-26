import { useState } from 'react';

import type { KnowledgeLibrary } from '../../application/knowledge/knowledge-library';
import type { SnippetLibrary } from '../../application/snippet/snippet-library';
import { KnowledgeLibraryView } from '../knowledge/KnowledgeLibraryView';
import { SnippetLibraryView } from '../snippet/SnippetLibraryView';

interface OptionsShellProps {
  knowledgeLibrary: KnowledgeLibrary;
  snippetLibrary: SnippetLibrary;
}

export function OptionsShell({
  knowledgeLibrary,
  snippetLibrary,
}: OptionsShellProps) {
  const [activeLibrary, setActiveLibrary] = useState<'knowledge' | 'snippets'>(
    'knowledge',
  );
  const [snippetsVisited, setSnippetsVisited] = useState(false);

  function openLibrary(library: 'knowledge' | 'snippets') {
    setActiveLibrary(library);
    if (library === 'snippets') setSnippetsVisited(true);
  }

  return (
    <main className="mx-auto max-w-2xl p-8 text-slate-900">
      <h1 className="text-2xl font-semibold">AI Support Workspace</h1>
      <p className="mt-3 text-slate-600">
        Manage local knowledge and reusable response snippets.
      </p>

      <nav
        aria-label="Library navigation"
        className="mt-6 flex gap-2 rounded-lg bg-slate-100 p-1"
        role="tablist"
      >
        <button
          aria-controls="knowledge-library-panel"
          aria-selected={activeLibrary === 'knowledge'}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
            activeLibrary === 'knowledge'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
          onClick={() => openLibrary('knowledge')}
          id="knowledge-library-tab"
          role="tab"
          type="button"
        >
          Knowledge Library
        </button>
        <button
          aria-controls="snippet-library-panel"
          aria-selected={activeLibrary === 'snippets'}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
            activeLibrary === 'snippets'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
          onClick={() => openLibrary('snippets')}
          id="snippet-library-tab"
          role="tab"
          type="button"
        >
          Snippet Library
        </button>
      </nav>

      <div
        aria-labelledby="knowledge-library-tab"
        hidden={activeLibrary !== 'knowledge'}
        id="knowledge-library-panel"
        role="tabpanel"
      >
        <KnowledgeLibraryView knowledgeLibrary={knowledgeLibrary} />
      </div>
      {snippetsVisited ? (
        <div
          aria-labelledby="snippet-library-tab"
          hidden={activeLibrary !== 'snippets'}
          id="snippet-library-panel"
          role="tabpanel"
        >
          <SnippetLibraryView snippetLibrary={snippetLibrary} />
        </div>
      ) : null}
    </main>
  );
}
