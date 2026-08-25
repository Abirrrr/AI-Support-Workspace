import { describe, expect, it, vi } from 'vitest';

import type {
  BackupDownloadPort,
  BackupSnapshot,
  TransactionalBackupRestorePort,
} from '../../src/application/backup/backup-ports';
import {
  BackupExportService,
  BackupImportService,
  BackupRestoreService,
  BackupV7CreationService,
} from '../../src/application/backup/backup-service';
import { parseBackupFile } from '../../src/application/backup/backup-validator';
import {
  BACKUP_FORMAT_VERSION_7,
  MAX_BACKUP_V7_BYTES,
  type BackupFileV7,
} from '../../src/domain/backup-file';
import type { AutomaticBackupCadence } from '../../src/domain/automatic-backup';
import { createPlainSnippetContent } from '../../src/domain/snippet-content';
import { createSnippetSourceFingerprint } from '../../src/domain/snippet-generated-metadata';

const SNIPPET_ID = '123e4567-e89b-42d3-a456-426614174000';
const BACKUP_ID = '223e4567-e89b-42d3-a456-426614174000';
const EXPORTED_AT = '2026-08-25T02:03:04.000Z';

async function createSnapshot(
  automaticBackupCadence: AutomaticBackupCadence = 'daily',
): Promise<BackupSnapshot> {
  const snippet = {
    id: SNIPPET_ID,
    title: 'Password reset',
    content: createPlainSnippetContent('Use the account recovery page.'),
    tags: ['account'],
    createdAt: '2026-08-24T00:00:00.000Z',
    updatedAt: '2026-08-24T00:00:00.000Z',
    trigger: ';reset',
  };
  return {
    knowledge: [],
    snippets: [snippet],
    snippetAssets: [],
    settings: {
      defaultModel: 'model',
      snippetPasteMode: 'automatic',
      automaticBackupCadence,
    },
    snippetUsageStats: [
      {
        snippetId: SNIPPET_ID,
        usageCount: 4,
        lastUsedAt: '2026-08-25T01:00:00.000Z',
      },
    ],
    snippetGeneratedMetadata: [
      {
        snippetId: SNIPPET_ID,
        generatedTags: ['password reset', 'account access'],
        sourceFingerprint: await createSnippetSourceFingerprint(snippet),
        generatedAt: '2026-08-25T01:30:00.000Z',
      },
    ],
  };
}

async function exportV7(
  automaticBackupCadence: AutomaticBackupCadence = 'daily',
): Promise<string> {
  const download = vi.fn<BackupDownloadPort['download']>(async () => undefined);
  await new BackupExportService(
    { readSnapshot: () => createSnapshot(automaticBackupCadence) },
    { download },
    () => new Date(EXPORTED_AT),
    () => BACKUP_ID,
  ).exportBackup();
  const serialized = download.mock.calls[0]?.[0];
  if (serialized === undefined) throw new Error('Missing export.');
  return serialized;
}

interface MutableUsageRecord {
  usageCount: number;
  lastUsedAt: string;
  [key: string]: unknown;
}

interface MutableGeneratedRecord {
  generatedTags: string[];
  sourceFingerprint: string;
  generatedAt: string;
  [key: string]: unknown;
}

interface MutableBackup {
  [key: string]: unknown;
  creationMode: string;
  backupSetId?: string;
  data: {
    [key: string]: unknown;
    snippetUsageStats: MutableUsageRecord[];
    snippetGeneratedMetadata: MutableGeneratedRecord[];
    settings: Record<string, unknown>;
  };
}

function mutate(
  serialized: string,
  change: (backup: MutableBackup) => void,
): string {
  const backup = JSON.parse(serialized) as MutableBackup;
  change(backup);
  return JSON.stringify(backup);
}

function firstFixtureRecord<T>(records: T[]): T {
  const record = records[0];
  if (record === undefined) {
    throw new Error('Expected the canonical v7 fixture to contain a record.');
  }
  return record;
}

const malformedCases: readonly [string, (backup: MutableBackup) => void][] = [
  [
    'unsafe usage',
    (backup) =>
      (firstFixtureRecord(backup.data.snippetUsageStats).usageCount = 1.5),
  ],
  [
    'usage timestamp',
    (backup) =>
      (firstFixtureRecord(backup.data.snippetUsageStats).lastUsedAt = 'today'),
  ],
  [
    'duplicate usage',
    (backup) =>
      backup.data.snippetUsageStats.push({
        ...firstFixtureRecord(backup.data.snippetUsageStats),
      }),
  ],
  [
    'duplicate metadata',
    (backup) =>
      backup.data.snippetGeneratedMetadata.push({
        ...firstFixtureRecord(backup.data.snippetGeneratedMetadata),
      }),
  ],
  [
    'generated tag',
    (backup) =>
      (firstFixtureRecord(backup.data.snippetGeneratedMetadata).generatedTags =
        ['UPPER']),
  ],
  [
    'generated timestamp',
    (backup) =>
      (firstFixtureRecord(backup.data.snippetGeneratedMetadata).generatedAt =
        'today'),
  ],
  [
    'cadence',
    (backup) => (backup.data.settings.automaticBackupCadence = 'monthly'),
  ],
  [
    'directory handle in Settings',
    (backup) => (backup.data.settings.directoryHandle = 'C:\\unsafe'),
  ],
  [
    'local authorization in portable data',
    (backup) =>
      (backup.data.automaticBackupState = {
        directoryHandle: { kind: 'directory', name: 'Injected' },
      }),
  ],
  [
    'local operational state in the envelope',
    (backup) => (backup.localAuthorization = true),
  ],
];

describe('Backup v7 hardening foundation', () => {
  it('uses the canonical v7 builder for automatic creation metadata', async () => {
    const backupSetId = '323e4567-e89b-42d3-a456-426614174000';
    const created = await new BackupV7CreationService(
      { readSnapshot: () => createSnapshot('weekly') },
      () => new Date(EXPORTED_AT),
      () => BACKUP_ID,
    ).create({ creationMode: 'automatic', backupSetId });
    expect(parseBackupFile(created.serialized)).toMatchObject({
      formatVersion: 7,
      backupId: BACKUP_ID,
      creationMode: 'automatic',
      backupSetId,
    });
    expect(created.byteLength).toBe(
      new TextEncoder().encode(created.serialized).byteLength,
    );
  });

  it('exports deterministic ordered sidecars and round-trips all portable data', async () => {
    const serialized = await exportV7();
    const backup = parseBackupFile(serialized);
    expect(backup.formatVersion).toBe(BACKUP_FORMAT_VERSION_7);
    if (backup.formatVersion !== 7) throw new Error('Expected v7.');
    expect(backup).toMatchObject({
      backupId: BACKUP_ID,
      creationMode: 'manual',
      data: {
        settings: { automaticBackupCadence: 'daily' },
        snippetUsageStats: [{ snippetId: SNIPPET_ID, usageCount: 4 }],
        snippetGeneratedMetadata: [{ snippetId: SNIPPET_ID }],
      },
    });
    expect(backup).not.toHaveProperty('backupSetId');
    expect(serialized).not.toContain('directoryHandle');
    expect(MAX_BACKUP_V7_BYTES).toBe(100_663_296);

    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => undefined,
    );
    await new BackupRestoreService({ replaceAll }).restoreBackup(backup);
    expect(replaceAll).toHaveBeenCalledWith(await createSnapshot());
  });

  it.each(malformedCases)(
    'rejects malformed %s before restore',
    async (_name, change) => {
      const serialized = mutate(await exportV7(), change);
      expect(() => parseBackupFile(serialized)).toThrowError(
        expect.objectContaining({ code: 'invalid' }),
      );
    },
  );

  it.each(['off', 'daily', 'weekly'] as const)(
    'round-trips the portable %s cadence through Backup v7',
    async (cadence) => {
      const backup = parseBackupFile(await exportV7(cadence));
      expect(backup.formatVersion).toBe(BACKUP_FORMAT_VERSION_7);
      if (backup.formatVersion !== BACKUP_FORMAT_VERSION_7) {
        throw new Error('Expected v7.');
      }
      expect(backup.data.settings.automaticBackupCadence).toBe(cadence);

      const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
        async () => undefined,
      );
      await new BackupRestoreService({ replaceAll }).restoreBackup(backup);
      expect(replaceAll).toHaveBeenCalledWith(await createSnapshot(cadence));
    },
  );

  it('rejects a well-formed but mismatching source fingerprint before persistence', async () => {
    const serialized = mutate(await exportV7(), (backup) => {
      firstFixtureRecord(
        backup.data.snippetGeneratedMetadata,
      ).sourceFingerprint = '0'.repeat(64);
    });
    const service = new BackupImportService();
    await expect(
      service.prepareImport({
        name: 'mismatch.json',
        size: new TextEncoder().encode(serialized).byteLength,
        readText: async () => serialized,
      }),
    ).rejects.toMatchObject({ code: 'invalid' });
  });

  it('enforces conditional automatic backup-set identity', async () => {
    const serialized = await exportV7();
    expect(() =>
      parseBackupFile(
        mutate(serialized, (backup) => {
          backup.creationMode = 'automatic';
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: 'invalid' }));

    const automatic = mutate(serialized, (backup) => {
      backup.creationMode = 'automatic';
      backup.backupSetId = '323e4567-e89b-42d3-a456-426614174000';
    });
    expect((parseBackupFile(automatic) as BackupFileV7).creationMode).toBe(
      'automatic',
    );
  });
});
