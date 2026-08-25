// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  AutomaticBackupOptionsApplication,
  AutomaticBackupOptionsSnapshot,
} from '../../src/application/automatic-backup/automatic-backup-options';
import { AutomaticBackupSettings } from '../../src/ui/settings/AutomaticBackupSettings';
import { ImportExportView } from '../../src/ui/import-export/ImportExportView';

const WEEKLY: AutomaticBackupOptionsSnapshot = {
  cadence: 'weekly',
  status: 'no-location',
  hasLocation: false,
  canReauthorize: false,
};

function application(
  initial: AutomaticBackupOptionsSnapshot = WEEKLY,
  overrides: Partial<AutomaticBackupOptionsApplication> = {},
): AutomaticBackupOptionsApplication {
  return {
    load: vi.fn(async () => initial),
    updateCadence: vi.fn(async (cadence) => ({ ...initial, cadence })),
    chooseFolder: vi.fn(async () => initial),
    reauthorize: vi.fn(async () => initial),
    ...overrides,
  };
}

afterEach(cleanup);

describe('AutomaticBackupSettings', () => {
  it('presents Weekly as the loaded default with all three cadence choices', async () => {
    render(<AutomaticBackupSettings automaticBackup={application()} />);
    const select = await screen.findByRole('combobox', {
      name: 'Automatic Backup',
    });
    await waitFor(() => expect(select).toHaveProperty('disabled', false));
    expect(select).toHaveProperty('value', 'weekly');
    expect(
      Array.from((select as HTMLSelectElement).options).map(
        (option) => option.text,
      ),
    ).toEqual(['Off', 'Daily', 'Weekly']);
  });

  it.each(['off', 'daily', 'weekly'] as const)(
    'sends %s cadence changes only through the application command',
    async (cadence) => {
      const automaticBackup = application();
      render(<AutomaticBackupSettings automaticBackup={automaticBackup} />);
      const select = await screen.findByRole('combobox', {
        name: 'Automatic Backup',
      });
      await waitFor(() => expect(select).toHaveProperty('disabled', false));
      fireEvent.change(select, { target: { value: cadence } });
      await waitFor(() =>
        expect(automaticBackup.updateCadence).toHaveBeenCalledWith(cadence),
      );
    },
  );

  it.each([
    ['off', 'Off'],
    ['ready', 'Ready'],
    ['attention', 'Backup location needs attention'],
    ['no-location', 'No backup location selected'],
  ] as const)('renders the accessible %s status', async (status, label) => {
    render(
      <AutomaticBackupSettings
        automaticBackup={application({ ...WEEKLY, status })}
      />,
    );
    const statusElement = await screen.findByRole('status');
    expect(statusElement.textContent).toBe(label);
    expect(statusElement.getAttribute('aria-live')).toBe('polite');
  });

  it('keeps an Off location configured and offers Change Folder', async () => {
    render(
      <AutomaticBackupSettings
        automaticBackup={application({
          cadence: 'off',
          status: 'off',
          hasLocation: true,
          canReauthorize: false,
        })}
      />,
    );
    expect(
      await screen.findByRole('button', { name: 'Change Folder' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reauthorize' })).toBeNull();
  });

  it('opens Choose Folder only after its explicit button click', async () => {
    const automaticBackup = application();
    render(<AutomaticBackupSettings automaticBackup={automaticBackup} />);
    const choose = await screen.findByRole('button', {
      name: 'Choose Folder',
    });
    expect(automaticBackup.chooseFolder).not.toHaveBeenCalled();
    fireEvent.click(choose);
    await waitFor(() =>
      expect(automaticBackup.chooseFolder).toHaveBeenCalledOnce(),
    );
  });

  it('opens Change Folder only after its explicit button click', async () => {
    const automaticBackup = application({
      ...WEEKLY,
      status: 'ready',
      hasLocation: true,
    });
    render(<AutomaticBackupSettings automaticBackup={automaticBackup} />);
    const change = await screen.findByRole('button', {
      name: 'Change Folder',
    });
    expect(automaticBackup.chooseFolder).not.toHaveBeenCalled();
    fireEvent.click(change);
    await waitFor(() =>
      expect(automaticBackup.chooseFolder).toHaveBeenCalledOnce(),
    );
  });

  it('shows Reauthorize only for attention and invokes it only on click', async () => {
    const automaticBackup = application({
      ...WEEKLY,
      status: 'attention',
      hasLocation: true,
      canReauthorize: true,
    });
    render(<AutomaticBackupSettings automaticBackup={automaticBackup} />);
    const reauthorize = await screen.findByRole('button', {
      name: 'Reauthorize',
    });
    expect(automaticBackup.reauthorize).not.toHaveBeenCalled();
    fireEvent.click(reauthorize);
    await waitFor(() =>
      expect(automaticBackup.reauthorize).toHaveBeenCalledOnce(),
    );
  });

  it('contains failures with safe copy and renders no internal handle or ID', async () => {
    const automaticBackup = application(WEEKLY, {
      chooseFolder: vi.fn(async () => {
        throw new Error(
          'raw 10000000-0000-4000-8000-000000000001 Private backups',
        );
      }),
    });
    render(<AutomaticBackupSettings automaticBackup={automaticBackup} />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Choose Folder' }),
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      "Couldn't update Automatic Backup.",
    );
    expect(document.body.textContent).not.toContain('10000000');
    expect(document.body.textContent).not.toContain('Private backups');
    expect(document.body.textContent).not.toContain('chrome.alarms');
  });

  it('keeps manual Export available without an automatic-backup location', async () => {
    const exportBackup = vi.fn(async () => undefined);
    render(
      <>
        <AutomaticBackupSettings automaticBackup={application()} />
        <ImportExportView
          actions={{
            exportBackup,
            prepareImport: vi.fn(async () => {
              throw new Error('not used');
            }),
            restoreBackup: vi.fn(async () => undefined),
          }}
          onRestored={vi.fn()}
        />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Export backup' }));
    await waitFor(() => expect(exportBackup).toHaveBeenCalledOnce());
  });
});
