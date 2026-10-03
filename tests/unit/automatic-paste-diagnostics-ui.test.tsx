// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SettingsApplication } from '../../src/application/settings/settings-service';
import type { AutomaticPasteDiagnosticsApplication } from '../../src/extension/options/automatic-paste-diagnostics-client';
import { SettingsView } from '../../src/ui/settings/SettingsView';

const settings: SettingsApplication = {
  load: async () => ({
    defaultModel: null,
    snippetPasteMode: 'automatic',
    automaticBackupCadence: 'weekly',
  }),
  save: async (_model, snippetPasteMode) => ({
    defaultModel: null,
    snippetPasteMode,
    automaticBackupCadence: 'weekly',
  }),
};

function createDiagnostics(
  overrides: Partial<AutomaticPasteDiagnosticsApplication> = {},
): AutomaticPasteDiagnosticsApplication {
  return {
    loadEnabled: vi.fn(async () => false),
    setEnabled: vi.fn(async (enabled) => enabled),
    exportDiagnostics: vi.fn(async () => undefined),
    clearDiagnostics: vi.fn(async () => undefined),
    ...overrides,
  };
}

afterEach(cleanup);

describe('Automatic Paste Diagnostics settings controls', () => {
  it('loads disabled by default and independently enables, exports, clears, then disables', async () => {
    const diagnostics = createDiagnostics();
    render(
      <SettingsView
        automaticPasteDiagnostics={diagnostics}
        settings={settings}
      />,
    );
    expect(await screen.findByText('Diagnostics disabled')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Enable Diagnostics' }));
    expect(
      await screen.findByText('Automatic Paste Diagnostics enabled.'),
    ).toBeTruthy();
    expect(diagnostics.setEnabled).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Export Diagnostics' }));
    await waitFor(() =>
      expect(diagnostics.exportDiagnostics).toHaveBeenCalledOnce(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear Diagnostics' }));
    await waitFor(() =>
      expect(diagnostics.clearDiagnostics).toHaveBeenCalledOnce(),
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Disable Diagnostics' }),
    );
    await waitFor(() =>
      expect(diagnostics.setEnabled).toHaveBeenLastCalledWith(false),
    );
    expect(screen.getByText(/Retained records were preserved/)).toBeTruthy();
  });

  it('shows safe export failure text without leaking raw errors', async () => {
    const diagnostics = createDiagnostics({
      exportDiagnostics: vi.fn(async () => {
        throw new Error('raw IndexedDB quota detail');
      }),
    });
    render(
      <SettingsView
        automaticPasteDiagnostics={diagnostics}
        settings={settings}
      />,
    );
    await screen.findByText('Diagnostics disabled');
    fireEvent.click(screen.getByRole('button', { name: 'Export Diagnostics' }));
    expect(
      await screen.findByText(
        "Couldn't export Automatic Paste Diagnostics. No file was created.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/quota detail/)).toBeNull();
  });
});
