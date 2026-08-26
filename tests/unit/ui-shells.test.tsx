import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { SettingsApplication } from '../../src/application/settings/settings-service';
import type { SnippetLibrary } from '../../src/application/snippet/snippet-library';
import type { ImportExportActions } from '../../src/ui/import-export/ImportExportView';
import { OptionsShell } from '../../src/ui/options/OptionsShell';

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
  it('renders only the three active management sections', () => {
    const markup = renderToStaticMarkup(
      <OptionsShell
        importExport={importExport}
        settings={settings}
        snippetLibrary={snippetLibrary}
      />,
    );

    expect(markup).not.toContain('Knowledge Library');
    expect(markup).toContain('Snippet Library');
    expect(markup).toContain('Settings');
    expect(markup).toContain('Import / Export');
    expect(markup).toContain('flex-wrap');
    expect(markup).toContain('Loading snippets');
  });
});
