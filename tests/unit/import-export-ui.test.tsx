// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BACKUP_MESSAGES,
  BackupExportError,
  BackupImportError,
  BackupRestoreError,
} from '../../src/application/backup/backup-errors';
import type { PreparedBackupImport } from '../../src/application/backup/backup-service';
import type { SettingsApplication } from '../../src/application/settings/settings-service';
import type { SnippetLibrary } from '../../src/application/snippet/snippet-library';
import { CatalogUnavailableAfterMutationError } from '../../src/application/snippet/catalog-mutation';
import type { BackupFileV1 } from '../../src/domain/backup-file';
import { createPlainSnippetContent } from '../../src/domain/snippet-content';
import {
  ImportExportView,
  type ImportExportActions,
} from '../../src/ui/import-export/ImportExportView';
import { OptionsShell } from '../../src/ui/options/OptionsShell';

const backup: BackupFileV1 = {
  format: 'ai-support-workspace-backup',
  formatVersion: 1,
  exportedAt: '2026-08-02T08:15:30.000Z',
  data: {
    knowledge: [
      {
        id: '123e4567-e89b-42d3-a456-426614174000',
        title: 'Hidden knowledge title',
        body: 'Hidden knowledge body',
        tags: ['hidden-tag'],
        createdAt: '2026-08-02T08:00:00.000Z',
        updatedAt: '2026-08-02T08:00:01.000Z',
        source: 'Hidden source',
      },
    ],
    snippets: [
      {
        id: '223e4567-e89b-42d3-a456-426614174000',
        title: 'Hidden snippet title',
        content: 'Hidden snippet content',
        tags: ['hidden-snippet-tag'],
        createdAt: '2026-08-02T08:00:02.000Z',
        updatedAt: '2026-08-02T08:00:03.000Z',
      },
    ],
    settings: { defaultModel: null },
  },
};

const prepared: PreparedBackupImport = {
  backup,
  preview: {
    filename: 'merchant-backup.json',
    formatVersion: 1,
    exportedAt: backup.exportedAt,
    knowledgeCount: 1,
    snippetCount: 1,
    assetCount: 0,
    defaultModel: null,
    triggerWarning:
      'This version 1 backup does not contain Snippet triggers. Restored Snippets will have no triggers.',
  },
};

function createActions(
  overrides: Partial<ImportExportActions> = {},
): ImportExportActions {
  return {
    exportBackup: vi.fn(async () => undefined),
    loadBackupReminder: vi.fn<ImportExportActions['loadBackupReminder']>(
      async () => ({
        lastSuccessfulBackupAt: null,
        status: 'never',
      }),
    ),
    prepareImport: vi.fn(async () => prepared),
    restoreBackup: vi.fn(async () => undefined),
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function requireValue<T>(value: T | undefined, description: string): T {
  if (value === undefined) throw new Error(`Missing ${description} fixture.`);
  return value;
}

function selectBackupFile(name = 'merchant-backup.json') {
  const input = screen.getByLabelText('Backup file');
  const file = new File(['backup'], name, { type: 'application/json' });
  fireEvent.change(input, { target: { files: [file] } });
  return { file, input };
}

afterEach(cleanup);

describe('ImportExportView', () => {
  it('renders focused accessible controls and the exact warnings', () => {
    render(<ImportExportView actions={createActions()} onRestored={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'Import / Export' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Export backup' })).toBeTruthy();
    expect(screen.getByText('Last backup')).toBeTruthy();
    const fileInput = screen.getByLabelText('Backup file');
    expect(fileInput.getAttribute('type')).toBe('file');
    expect(fileInput.getAttribute('accept')).toBe('.json,application/json');
    expect(
      screen.getByText(
        'Backup files may contain merchant knowledge, internal notes, reusable support replies, and local images. Store them securely.',
      ),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Restore backup' })).toBeNull();
    expect(document.body.className).not.toContain('overflow-x-auto');
  });

  it('shows the advisory reminder and resets it after a successful export', async () => {
    const loadBackupReminder = vi
      .fn<ImportExportActions['loadBackupReminder']>()
      .mockResolvedValueOnce({
        lastSuccessfulBackupAt: '2026-07-01T00:00:00.000Z',
        status: 'due',
      })
      .mockResolvedValueOnce({
        lastSuccessfulBackupAt: '2026-08-26T00:00:00.000Z',
        status: 'current',
      });
    render(
      <ImportExportView
        actions={createActions({ loadBackupReminder })}
        onRestored={vi.fn()}
      />,
    );

    expect(await screen.findByText('Backup recommended')).toBeTruthy();
    expect(
      screen.getByText('Your last backup is at least 30 days old.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Export backup' }));
    expect(await screen.findByText(BACKUP_MESSAGES.exportSuccess)).toBeTruthy();
    await waitFor(() =>
      expect(screen.queryByText('Backup recommended')).toBeNull(),
    );
  });

  it('exports with busy state and exact success or safe error messages', async () => {
    let resolveExport!: () => void;
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    const actions = createActions({
      exportBackup: vi.fn(() => exportPromise),
    });
    const { rerender } = render(
      <ImportExportView actions={actions} onRestored={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export backup' }));
    expect(screen.getByRole('button', { name: 'Exporting…' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByLabelText('Backup file')).toHaveProperty(
      'disabled',
      true,
    );
    resolveExport();
    expect(await screen.findByText(BACKUP_MESSAGES.exportSuccess)).toBeTruthy();

    rerender(
      <ImportExportView
        actions={createActions({
          exportBackup: vi.fn(async () => {
            throw new BackupExportError('too-large');
          }),
        })}
        onRestored={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Export backup' }));
    expect(await screen.findByText(BACKUP_MESSAGES.tooLarge)).toBeTruthy();
    expect(screen.queryByText(/raw/i)).toBeNull();
  });

  it('shows metadata-only preview, focuses it, and requires acknowledgement', async () => {
    const actions = createActions();
    render(<ImportExportView actions={actions} onRestored={vi.fn()} />);
    const { file } = selectBackupFile();

    expect(actions.prepareImport).toHaveBeenCalledWith(file);
    const previewHeading = await screen.findByRole('heading', {
      name: 'Backup preview',
    });
    await waitFor(() => expect(document.activeElement).toBe(previewHeading));
    expect(screen.getByText('merchant-backup.json')).toBeTruthy();
    expect(screen.getByText(backup.exportedAt)).toBeTruthy();
    expect(screen.getByText(BACKUP_MESSAGES.noSavedModel)).toBeTruthy();
    expect(screen.queryByText('Hidden knowledge body')).toBeNull();
    expect(screen.queryByText('Hidden snippet content')).toBeNull();
    expect(screen.queryByText('hidden-tag')).toBeNull();
    expect(
      screen.getByText(
        'Restoring this backup will replace your current Knowledge, Snippets, local image assets, and saved Settings.',
      ),
    ).toBeTruthy();
    const restore = screen.getByRole('button', { name: 'Restore backup' });
    expect(restore).toHaveProperty('disabled', true);

    fireEvent.click(
      screen.getByLabelText(
        'I understand that my current local data will be replaced.',
      ),
    );
    expect(restore).toHaveProperty('disabled', false);
  });

  it.each([
    [new BackupImportError('too-large'), BACKUP_MESSAGES.tooLarge],
    [new BackupImportError('read-failure'), BACKUP_MESSAGES.readFailure],
    [new BackupImportError('invalid'), BACKUP_MESSAGES.invalid],
    [
      new BackupImportError('unsupported-version'),
      BACKUP_MESSAGES.unsupportedVersion,
    ],
  ])('announces the exact safe import error for %s', async (error, message) => {
    render(
      <ImportExportView
        actions={createActions({
          prepareImport: vi.fn(async () => {
            throw error;
          }),
        })}
        onRestored={vi.fn()}
      />,
    );
    selectBackupFile();

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe(message);
  });

  it('exposes accessible file-processing and restore busy states', async () => {
    const prepareDeferred = createDeferred<PreparedBackupImport>();
    const restoreDeferred = createDeferred<undefined>();
    render(
      <ImportExportView
        actions={createActions({
          prepareImport: vi.fn(() => prepareDeferred.promise),
          restoreBackup: vi.fn(() => restoreDeferred.promise),
        })}
        onRestored={vi.fn()}
      />,
    );
    selectBackupFile();
    expect(screen.getByText('Validating backup…')).toBeTruthy();
    expect(screen.getByLabelText('Backup file')).toHaveProperty(
      'disabled',
      true,
    );
    expect(
      screen.getByRole('button', { name: 'Export backup' }),
    ).toHaveProperty('disabled', true);

    prepareDeferred.resolve(prepared);
    await screen.findByRole('heading', { name: 'Backup preview' });
    fireEvent.click(
      screen.getByLabelText(
        'I understand that my current local data will be replaced.',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }));
    expect(screen.getByRole('button', { name: 'Restoring…' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(screen.getByLabelText('Backup file')).toHaveProperty(
      'disabled',
      true,
    );

    restoreDeferred.resolve(undefined);
    expect(
      await screen.findByText(BACKUP_MESSAGES.restoreSuccess),
    ).toBeTruthy();
  });

  it('restores, reports counts, clears pending state, and requests refresh', async () => {
    const actions = createActions();
    const onRestored = vi.fn();
    render(<ImportExportView actions={actions} onRestored={onRestored} />);
    const { input } = selectBackupFile();
    await screen.findByRole('heading', { name: 'Backup preview' });
    fireEvent.click(
      screen.getByLabelText(
        'I understand that my current local data will be replaced.',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }));

    await waitFor(() =>
      expect(actions.restoreBackup).toHaveBeenCalledWith(prepared),
    );
    expect(
      await screen.findByText(BACKUP_MESSAGES.restoreSuccess),
    ).toBeTruthy();
    expect(screen.getByText('Knowledge restored: 1')).toBeTruthy();
    expect(screen.getByText('Snippets restored: 1')).toBeTruthy();
    expect(screen.getByText(BACKUP_MESSAGES.settingsRestored)).toBeTruthy();
    expect(
      screen.queryByRole('heading', { name: 'Backup preview' }),
    ).toBeNull();
    expect(input).toHaveProperty('value', '');
    expect(onRestored).toHaveBeenCalledOnce();
  });

  it('allows a validated empty backup through the same confirmation flow', async () => {
    const emptyPrepared: PreparedBackupImport = {
      backup: {
        ...backup,
        data: {
          knowledge: [],
          snippets: [],
          settings: { defaultModel: null },
        },
      },
      preview: { ...prepared.preview, knowledgeCount: 0, snippetCount: 0 },
    };
    const actions = createActions({
      prepareImport: vi.fn(async () => emptyPrepared),
    });
    render(<ImportExportView actions={actions} onRestored={vi.fn()} />);
    selectBackupFile();
    await screen.findByRole('heading', { name: 'Backup preview' });
    fireEvent.click(
      screen.getByLabelText(
        'I understand that my current local data will be replaced.',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }));

    await waitFor(() =>
      expect(actions.restoreBackup).toHaveBeenCalledWith(emptyPrepared),
    );
    expect(screen.getByText('Knowledge restored: 0')).toBeTruthy();
    expect(screen.getByText('Snippets restored: 0')).toBeTruthy();
  });

  it('resets replacement, validation failure, and Cancel state safely', async () => {
    const prepareImport = vi
      .fn<ImportExportActions['prepareImport']>()
      .mockResolvedValueOnce(prepared)
      .mockRejectedValueOnce(new BackupImportError('unsupported-version'))
      .mockResolvedValueOnce(prepared);
    render(
      <ImportExportView
        actions={createActions({ prepareImport })}
        onRestored={vi.fn()}
      />,
    );
    selectBackupFile('first.json');
    await screen.findByRole('heading', { name: 'Backup preview' });
    fireEvent.click(
      screen.getByLabelText(
        'I understand that my current local data will be replaced.',
      ),
    );

    const invalidSelection = new File(['bad'], 'new.json');
    fireEvent.change(screen.getByLabelText('Backup file'), {
      target: { files: [invalidSelection] },
    });
    const error = await screen.findByRole('alert');
    expect(error.textContent).toContain(BACKUP_MESSAGES.unsupportedVersion);
    expect(document.activeElement).toBe(error);
    expect(
      screen.queryByRole('heading', { name: 'Backup preview' }),
    ).toBeNull();

    selectBackupFile('valid-again.json');
    await screen.findByRole('heading', { name: 'Backup preview' });
    expect(
      screen.getByLabelText(
        'I understand that my current local data will be replaced.',
      ),
    ).toHaveProperty('checked', false);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.queryByRole('heading', { name: 'Backup preview' }),
    ).toBeNull();
    expect(screen.queryByText(BACKUP_MESSAGES.unsupportedVersion)).toBeNull();
  });

  it('keeps valid preview after restore failure and hides raw causes', async () => {
    render(
      <ImportExportView
        actions={createActions({
          restoreBackup: vi.fn(async () => {
            throw new BackupRestoreError(new Error('raw transaction failure'));
          }),
        })}
        onRestored={vi.fn()}
      />,
    );
    selectBackupFile();
    await screen.findByRole('heading', { name: 'Backup preview' });
    fireEvent.click(
      screen.getByLabelText(
        'I understand that my current local data will be replaced.',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }));

    expect(
      await screen.findByText(BACKUP_MESSAGES.restoreFailure),
    ).toBeTruthy();
    expect(screen.queryByText('raw transaction failure')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Backup preview' }),
    ).toBeTruthy();
  });

  it('reports successful restore accurately when catalog publication is unavailable', async () => {
    const onRestored = vi.fn();
    render(
      <ImportExportView
        actions={createActions({
          restoreBackup: vi.fn(async () => {
            throw new CatalogUnavailableAfterMutationError(undefined);
          }),
        })}
        onRestored={onRestored}
      />,
    );
    selectBackupFile();
    await screen.findByRole('heading', { name: 'Backup preview' });
    fireEvent.click(
      screen.getByLabelText(
        'I understand that my current local data will be replaced.',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }));

    expect(
      await screen.findByText(
        'Backup restored. Trigger expansion is temporarily unavailable.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText(BACKUP_MESSAGES.restoreFailure)).toBeNull();
    expect(onRestored).toHaveBeenCalledOnce();
  });
});

describe('options-page restore refresh', () => {
  it('remounts active Snippets and Settings locally without browser messaging', async () => {
    let restored = false;
    const snippetFixture = requireValue(
      backup.data.snippets[0],
      'Snippet entry',
    );
    const restoredSnippets = backup.data.snippets.map((entry) => ({
      ...entry,
      content: createPlainSnippetContent(entry.content),
      tags: [...entry.tags],
      trigger: null,
    }));
    const snippetLibrary: SnippetLibrary = {
      load: vi.fn(async () =>
        restored
          ? restoredSnippets
          : [
              {
                ...snippetFixture,
                title: 'Before snippet',
                content: createPlainSnippetContent(snippetFixture.content),
                tags: [...snippetFixture.tags],
                trigger: null,
              },
            ],
      ),
      create: vi.fn(async () => {
        throw new Error('not used');
      }),
      update: vi.fn(async () => {
        throw new Error('not used');
      }),
      delete: vi.fn(async () => false),
    };
    const settings: SettingsApplication = {
      load: vi.fn(async () => ({
        defaultModel: restored ? 'restored-model' : 'before-model',
        snippetPasteMode: 'clipboard-only' as const,
        automaticBackupCadence: 'weekly' as const,
      })),
      save: vi.fn(async (_defaultModelInput, snippetPasteMode) => ({
        defaultModel: null,
        snippetPasteMode,
        automaticBackupCadence: 'weekly' as const,
      })),
    };
    const importExport = createActions({
      restoreBackup: vi.fn(async () => {
        restored = true;
      }),
    });

    render(
      <OptionsShell
        importExport={importExport}
        settings={settings}
        snippetLibrary={snippetLibrary}
      />,
    );
    expect(await screen.findByText('Before snippet')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(await screen.findByDisplayValue('before-model')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Import / Export' }));
    selectBackupFile();
    await screen.findByRole('heading', { name: 'Backup preview' });
    fireEvent.click(
      screen.getByLabelText(
        'I understand that my current local data will be replaced.',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }));
    await screen.findByText(BACKUP_MESSAGES.restoreSuccess);

    fireEvent.click(screen.getByRole('tab', { name: 'Snippet Library' }));
    expect(await screen.findByText('Hidden snippet title')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(await screen.findByDisplayValue('restored-model')).toBeTruthy();
    expect(snippetLibrary.load).toHaveBeenCalledTimes(2);
    expect(settings.load).toHaveBeenCalledTimes(2);
  });
});
