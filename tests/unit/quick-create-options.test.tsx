// @vitest-environment jsdom
import { StrictMode } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { OptionsShell } from '../../src/ui/options/OptionsShell';
import type {
  QuickCreateClipboard,
  QuickCreateNavigation,
} from '../../src/application/snippet/quick-create-snippet';
import type { SnippetLibrary } from '../../src/application/snippet/snippet-library';
import type { SettingsApplication } from '../../src/application/settings/settings-service';
import type { ImportExportActions } from '../../src/ui/import-export/ImportExportView';

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(cleanup);

it('selects the existing Snippet Library from another section, protects the resulting draft, and unsubscribes', async () => {
  let listener: ((id: string) => void) | undefined;
  const unsubscribe = vi.fn();
  const navigation: QuickCreateNavigation = {
    subscribe(fn) {
      listener = fn;
      return unsubscribe;
    },
  };
  const content = {
    kind: 'rich' as const,
    blocks: [
      {
        type: 'paragraph' as const,
        children: [
          {
            type: 'text' as const,
            text: 'Clipboard text',
            bold: false,
            italic: false,
          },
        ],
      },
    ],
  };
  const quickCreate: QuickCreateClipboard = {
    requestEnable: vi.fn(),
    readDraft: vi.fn().mockResolvedValue({ kind: 'text', content }),
  };
  const library: SnippetLibrary = {
    load: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const settings: SettingsApplication = {
    load: vi.fn().mockResolvedValue({
      defaultModel: null,
      snippetPasteMode: 'clipboard-only',
      automaticBackupCadence: 'weekly',
    }),
    save: vi.fn(),
  };
  const importExport: ImportExportActions = {
    exportBackup: vi.fn(),
    loadBackupReminder: vi
      .fn()
      .mockResolvedValue({ status: 'never', lastSuccessfulBackupAt: null }),
    prepareImport: vi.fn(),
    restoreBackup: vi.fn(),
  };
  const view = render(
    <StrictMode>
      <OptionsShell
        snippetLibrary={library}
        settings={settings}
        importExport={importExport}
        quickCreate={quickCreate}
        quickCreateNavigation={navigation}
      />
    </StrictMode>,
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
  await act(async () => {
    listener?.('first');
  });
  await screen.findByRole('form', { name: 'Create text snippet' });
  expect(
    screen
      .getByRole('tab', { name: 'Snippet Library' })
      .getAttribute('aria-selected'),
  ).toBe('true');
  expect(quickCreate.readDraft).toHaveBeenCalledTimes(1);
  expect(library.create).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'Keep this draft' },
  });
  fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
  await act(async () => {
    listener?.('second');
  });
  await screen.findByText(/Finish or cancel your current snippet/);
  expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
    'Keep this draft',
  );
  expect(quickCreate.readDraft).toHaveBeenCalledTimes(1);
  view.unmount();
  await waitFor(() => expect(unsubscribe).toHaveBeenCalled());
});
