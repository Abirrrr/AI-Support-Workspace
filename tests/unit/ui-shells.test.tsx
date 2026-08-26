import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { KnowledgeLibrary } from '../../src/application/knowledge/knowledge-library';
import type { SettingsApplication } from '../../src/application/settings/settings-service';
import type { SnippetLibrary } from '../../src/application/snippet/snippet-library';
import type { ImportExportActions } from '../../src/ui/import-export/ImportExportView';
import { OptionsShell } from '../../src/ui/options/OptionsShell';
import { PopupShell } from '../../src/ui/popup/PopupShell';

const knowledgeLibrary: KnowledgeLibrary = {
  load: async () => [],
  create: async () => {
    throw new Error('Not used by this render test.');
  },
  update: async () => {
    throw new Error('Not used by this render test.');
  },
  delete: async () => false,
};

const snippetLibrary: SnippetLibrary = {
  load: async () => [],
  create: async () => {
    throw new Error('Not used by this render test.');
  },
  update: async () => {
    throw new Error('Not used by this render test.');
  },
  delete: async () => false,
};

const settings: SettingsApplication = {
  load: async () => ({
    defaultModel: null,
    snippetPasteMode: 'clipboard-only',
    automaticBackupCadence: 'weekly',
  }),
  save: async (_defaultModelInput, snippetPasteMode) => ({
    defaultModel: null,
    snippetPasteMode,
    automaticBackupCadence: 'weekly',
  }),
};

const importExport: ImportExportActions = {
  exportBackup: async () => undefined,
  loadBackupReminder: async () => ({
    lastSuccessfulBackupAt: null,
    status: 'never',
  }),
  prepareImport: async () => {
    throw new Error('Not used by this render test.');
  },
  restoreBackup: async () => undefined,
};

describe('extension UI shells', () => {
  it('renders popup navigation to the Workspace and Libraries', () => {
    const markup = renderToStaticMarkup(
      <PopupShell openWorkspace={async () => undefined} />,
    );

    expect(markup).toContain('AI Support Workspace');
    expect(markup).toContain('Open Workspace');
    expect(markup).toContain('<button');
    expect(markup).not.toContain('href="/workspace.html"');
    expect(markup).toContain('Open Libraries');
    expect(markup).toContain('href="/options.html"');
  });

  it('renders all four navigation sections in the options page', () => {
    const markup = renderToStaticMarkup(
      <OptionsShell
        importExport={importExport}
        knowledgeLibrary={knowledgeLibrary}
        settings={settings}
        snippetLibrary={snippetLibrary}
      />,
    );

    expect(markup).toContain('Knowledge Library');
    expect(markup).toContain('Snippet Library');
    expect(markup).toContain('Settings');
    expect(markup).toContain('Import / Export');
    expect(markup).toContain('flex-wrap');
    expect(markup).toContain('Loading knowledge');
    expect(markup).not.toContain('<input');
  });
});
