import { useState } from 'react';

import type { SettingsApplication } from '../../application/settings/settings-service';
import type { SnippetLibrary } from '../../application/snippet/snippet-library';
import type { CopySnippetToClipboard } from '../../application/snippet/copy-snippet-to-clipboard';
import type { ClipboardDeliveryPermission } from '../../extension/snippet-trigger/clipboard-permission';
import type { WindowsImageClipboardCapability } from '../../extension/snippet-trigger/native-clipboard-capability';
import {
  ImportExportView,
  type ImportExportActions,
} from '../import-export/ImportExportView';
import { SettingsView } from '../settings/SettingsView';
import { SnippetLibraryView } from '../snippet/SnippetLibraryView';

interface OptionsShellProps {
  settings: SettingsApplication;
  snippetLibrary: SnippetLibrary;
  copySnippet?: CopySnippetToClipboard | undefined;
  importExport: ImportExportActions;
  clipboardDelivery?: ClipboardDeliveryPermission | undefined;
  windowsImageClipboard?: WindowsImageClipboardCapability | undefined;
}

export function OptionsShell({
  settings,
  snippetLibrary,
  copySnippet,
  importExport,
  clipboardDelivery,
  windowsImageClipboard,
}: OptionsShellProps) {
  const [activeSection, setActiveSection] = useState<
    'snippets' | 'settings' | 'import-export'
  >('snippets');
  const [settingsVisited, setSettingsVisited] = useState(false);
  const [importExportVisited, setImportExportVisited] = useState(false);
  const [dataRevision, setDataRevision] = useState(0);

  function openSection(section: 'snippets' | 'settings' | 'import-export') {
    setActiveSection(section);
    if (section === 'settings') setSettingsVisited(true);
    if (section === 'import-export') setImportExportVisited(true);
  }

  return (
    <main className="mx-auto max-w-2xl p-8 text-slate-900">
      <h1 className="text-2xl font-semibold">AI Support Workspace</h1>
      <p className="mt-3 text-slate-600">
        Manage reusable response snippets, Workspace defaults, and local
        backups.
      </p>

      <nav
        aria-label="Options navigation"
        className="mt-6 flex flex-wrap gap-2 rounded-lg bg-slate-100 p-1"
        role="tablist"
      >
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
        <button
          aria-controls="import-export-panel"
          aria-selected={activeSection === 'import-export'}
          className={`min-w-24 flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
            activeSection === 'import-export'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
          id="import-export-tab"
          onClick={() => openSection('import-export')}
          role="tab"
          type="button"
        >
          Import / Export
        </button>
      </nav>

      <div
        aria-labelledby="snippet-library-tab"
        hidden={activeSection !== 'snippets'}
        id="snippet-library-panel"
        role="tabpanel"
      >
        <SnippetLibraryView
          copySnippet={copySnippet}
          key={`snippets-${dataRevision}`}
          snippetLibrary={snippetLibrary}
        />
      </div>
      {settingsVisited ? (
        <div
          aria-labelledby="settings-tab"
          hidden={activeSection !== 'settings'}
          id="settings-panel"
          role="tabpanel"
        >
          <SettingsView
            clipboardDelivery={clipboardDelivery}
            key={`settings-${dataRevision}`}
            settings={settings}
            windowsImageClipboard={windowsImageClipboard}
          />
        </div>
      ) : null}
      {importExportVisited ? (
        <div
          aria-labelledby="import-export-tab"
          hidden={activeSection !== 'import-export'}
          id="import-export-panel"
          role="tabpanel"
        >
          <ImportExportView
            actions={importExport}
            onRestored={() => setDataRevision((revision) => revision + 1)}
          />
        </div>
      ) : null}
    </main>
  );
}
