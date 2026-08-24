import { describe, expect, it, vi } from 'vitest';

import type {
  BackupDownloadPort,
  TransactionalBackupRestorePort,
} from '../../src/application/backup/backup-ports';
import {
  BackupExportService,
  BackupRestoreService,
} from '../../src/application/backup/backup-service';
import { parseBackupFile } from '../../src/application/backup/backup-validator';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION_6,
  type BackupFile,
} from '../../src/domain/backup-file';

const EXPORTED_AT = '2026-08-23T00:00:00.000Z';

function emptyBackup(version: 1 | 2 | 3 | 4 | 5 | 6, pasteMode?: unknown) {
  return {
    format: BACKUP_FORMAT,
    formatVersion: version,
    exportedAt: EXPORTED_AT,
    data: {
      knowledge: [],
      snippets: [],
      ...(version >= 4 ? { snippetAssets: [] } : {}),
      settings:
        version === 6
          ? { defaultModel: null, snippetPasteMode: pasteMode }
          : { defaultModel: null },
    },
  };
}

async function restoreSettings(backup: BackupFile) {
  const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
    async () => undefined,
  );
  await new BackupRestoreService({ replaceAll }).restoreBackup(backup);
  return replaceAll.mock.calls[0]?.[0].settings;
}

describe('Backup v6 paste-mode evolution', () => {
  it.each(['clipboard-only', 'automatic'] as const)(
    'exports and imports exact %s preference',
    async (snippetPasteMode) => {
      const download = vi.fn<BackupDownloadPort['download']>(
        async () => undefined,
      );
      await new BackupExportService(
        {
          readSnapshot: async () => ({
            knowledge: [],
            snippets: [],
            snippetAssets: [],
            settings: { defaultModel: null, snippetPasteMode },
          }),
        },
        { download },
        () => new Date(EXPORTED_AT),
      ).exportBackup();
      const serialized = download.mock.calls[0]?.[0];
      if (serialized === undefined) throw new Error('Missing backup.');
      const parsed = parseBackupFile(serialized);
      expect(parsed.formatVersion).toBe(BACKUP_FORMAT_VERSION_6);
      expect(parsed.data.settings).toEqual({
        defaultModel: null,
        snippetPasteMode,
      });
      await expect(restoreSettings(parsed)).resolves.toEqual({
        defaultModel: null,
        snippetPasteMode,
      });
    },
  );

  it.each(['always', '', null, 1])(
    'strictly rejects invalid v6 paste mode %j',
    (snippetPasteMode) => {
      expect(() =>
        parseBackupFile(JSON.stringify(emptyBackup(6, snippetPasteMode))),
      ).toThrowError(expect.objectContaining({ code: 'invalid' }));
    },
  );

  it.each([1, 2, 3, 4, 5] as const)(
    'imports historical v%s as clipboard-only',
    async (version) => {
      const parsed = parseBackupFile(JSON.stringify(emptyBackup(version)));
      await expect(restoreSettings(parsed)).resolves.toEqual({
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
      });
    },
  );
});
