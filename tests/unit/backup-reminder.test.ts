import { describe, expect, it, vi } from 'vitest';

import {
  BACKUP_REMINDER_INTERVAL_MS,
  BackupReminderService,
  deriveBackupReminderSnapshot,
  type BackupReminderStateRepository,
} from '../../src/application/backup/backup-reminder';
import type {
  BackupDownloadPort,
  BackupSnapshot,
} from '../../src/application/backup/backup-ports';
import { BackupExportService } from '../../src/application/backup/backup-service';

const NOW = new Date('2026-08-26T12:00:00.000Z');

function repository(
  initial?: unknown,
): BackupReminderStateRepository & { value: unknown } {
  return {
    value: initial,
    async loadLastSuccessfulBackupAt() {
      return this.value;
    },
    async recordSuccessfulBackupAt(timestamp) {
      this.value = timestamp;
    },
  };
}

function emptySnapshot(): BackupSnapshot {
  return {
    knowledge: [],
    snippets: [],
    snippetAssets: [],
    settings: {
      defaultModel: null,
      snippetPasteMode: 'clipboard-only',
      automaticBackupCadence: 'weekly',
    },
    snippetUsageStats: [],
    snippetGeneratedMetadata: [],
  };
}

function exportService(
  reminder: BackupReminderService,
  download: BackupDownloadPort['download'],
) {
  return new BackupExportService(
    { readSnapshot: async () => emptySnapshot() },
    { download },
    () => NOW,
    () => '123e4567-e89b-42d3-a456-426614174000',
    reminder,
  );
}

describe('M14-N.3 backup reminder semantics', () => {
  it('recommends a backup when no successful backup is recorded', async () => {
    await expect(
      new BackupReminderService(repository(), () => NOW).load(),
    ).resolves.toEqual({ lastSuccessfulBackupAt: null, status: 'never' });
  });

  it.each([
    [BACKUP_REMINDER_INTERVAL_MS - 1, 'current'],
    [BACKUP_REMINDER_INTERVAL_MS, 'due'],
    [BACKUP_REMINDER_INTERVAL_MS + 1, 'due'],
  ] as const)('derives elapsed age %i as %s', (elapsed, status) => {
    const timestamp = new Date(NOW.valueOf() - elapsed).toISOString();
    expect(deriveBackupReminderSnapshot(timestamp, NOW)).toEqual({
      lastSuccessfulBackupAt: timestamp,
      status,
    });
  });

  it.each(['not-a-date', '2026-08-27T12:00:00.000Z'])(
    'fails safely for malformed or future timestamp %s',
    (timestamp) => {
      expect(deriveBackupReminderSnapshot(timestamp, NOW)).toEqual({
        lastSuccessfulBackupAt: null,
        status: 'never',
      });
    },
  );

  it('records the injected clock only after successful Manual Export and replaces prior success', async () => {
    const state = repository('2026-01-01T00:00:00.000Z');
    const record = vi.spyOn(state, 'recordSuccessfulBackupAt');
    const reminder = new BackupReminderService(state, () => NOW);

    await exportService(reminder, async () => undefined).exportBackup();

    expect(record).toHaveBeenCalledOnce();
    expect(record).toHaveBeenCalledWith(NOW.toISOString());
    await expect(reminder.load()).resolves.toEqual({
      lastSuccessfulBackupAt: NOW.toISOString(),
      status: 'current',
    });
  });

  it('replaces an earlier successful Export timestamp with a later success', async () => {
    const state = repository();
    const instants = [
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-26T12:00:00.000Z'),
    ];
    const clock = vi.fn(() => instants.shift() ?? NOW);
    const reminder = new BackupReminderService(state, clock);
    const service = exportService(reminder, async () => undefined);

    await service.exportBackup();
    await service.exportBackup();

    expect(state.value).toBe('2026-08-26T12:00:00.000Z');
  });

  it.each(['failed', 'cancelled'])(
    'does not record a timestamp when Export is %s',
    async (outcome) => {
      const state = repository();
      const record = vi.spyOn(state, 'recordSuccessfulBackupAt');
      const reminder = new BackupReminderService(state, () => NOW);
      const failure =
        outcome === 'cancelled'
          ? new DOMException('Cancelled', 'AbortError')
          : new Error('Download failed');

      await expect(
        exportService(reminder, async () => {
          throw failure;
        }).exportBackup(),
      ).rejects.toMatchObject({ name: 'BackupExportError' });
      expect(record).not.toHaveBeenCalled();
      await expect(reminder.load()).resolves.toEqual({
        lastSuccessfulBackupAt: null,
        status: 'never',
      });
    },
  );
});
