import { useState } from 'react';

import type { KnowledgeLibrary } from '../../application/knowledge/knowledge-library';
import type { SettingsApplication } from '../../application/settings/settings-service';
import type { SnippetLibrary } from '../../application/snippet/snippet-library';
import { KnowledgeLibraryView } from '../knowledge/KnowledgeLibraryView';
import { SettingsView } from '../settings/SettingsView';
import { SnippetLibraryView } from '../snippet/SnippetLibraryView';

interface OptionsShellProps {
  knowledgeLibrary: KnowledgeLibrary;
  settings: SettingsApplication;
  snippetLibrary: SnippetLibrary;
}

export function OptionsShell({
  knowledgeLibrary,
  settings,
  snippetLibrary,
}: OptionsShellProps) {
  const [activeSection, setActiveSection] = useState<
    'knowledge' | 'snippets' | 'settings'
  >('knowledge');
  const [snippetsVisited, setSnippetsVisited] = useState(false);
  const [settingsVisited, setSettingsVisited] = useState(false);

  function openSection(section: 'knowledge' | 'snippets' | 'settings') {
    setActiveSection(section);
    if (section === 'snippets') setSnippetsVisited(true);
    if (section === 'settings') setSettingsVisited(true);
  }

  return (
    <main className="mx-auto max-w-2xl p-8 text-slate-900">
      <h1 className="text-2xl font-semibold">AI Support Workspace</h1>
      <p className="mt-3 text-slate-600">
        Manage local knowledge, reusable response snippets, and Workspace
        defaults.
      </p>

      <nav
        aria-label="Options navigation"
        className="mt-6 flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1"
        role="tablist"
      >
        <button
          aria-controls="knowledge-library-panel"
          aria-selected={activeSection === 'knowledge'}
          className={`min-w-24 flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
            activeSection === 'knowledge'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
          onClick={() => openSection('knowledge')}
          id="knowledge-library-tab"
          role="tab"
          type="button"
        >
          Knowledge Library
        </button>
        <button
          aria-controls="snippet-library-panel"
          aria-selected={activeSection === 'snippets'}
          className={`min-w-24 flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
            activeSection === 'snippets'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
          onClick={() => openSection('snippets')}
          id="snippet-library-tab"
          role="tab"
          type="button"
        >
          Snippet Library
        </button>
        <button
          aria-controls="settings-panel"
          aria-selected={activeSection === 'settings'}
          className={`min-w-24 flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
            activeSection === 'settings'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
          id="settings-tab"
          onClick={() => openSection('settings')}
          role="tab"
          type="button"
        >
          Settings
        </button>
      </nav>

      <div
        aria-labelledby="knowledge-library-tab"
        hidden={activeSection !== 'knowledge'}
        id="knowledge-library-panel"
        role="tabpanel"
      >
        <KnowledgeLibraryView knowledgeLibrary={knowledgeLibrary} />
      </div>
      {snippetsVisited ? (
        <div
          aria-labelledby="snippet-library-tab"
          hidden={activeSection !== 'snippets'}
          id="snippet-library-panel"
          role="tabpanel"
        >
          <SnippetLibraryView snippetLibrary={snippetLibrary} />
        </div>
      ) : null}
      {settingsVisited ? (
        <div
          aria-labelledby="settings-tab"
          hidden={activeSection !== 'settings'}
          id="settings-panel"
          role="tabpanel"
        >
          <SettingsView settings={settings} />
        </div>
      ) : null}
    </main>
  );
}
