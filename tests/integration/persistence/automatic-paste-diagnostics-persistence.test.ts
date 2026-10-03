import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { AutomaticPasteDiagnosticRecordV1 } from '../../../src/domain/automatic-paste-diagnostics';
import { DexieAutomaticPasteDiagnosticsRepository } from '../../../src/infrastructure/persistence/dexie-automatic-paste-diagnostics-repository';
import {
  DATABASE_VERSION,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from './test-database';

function uuid(seed: number): string {
  return `123e4567-e89b-42d3-a456-${seed.toString(16).padStart(12, '0')}`;
}

function record(
  seed: number,
  occurredAt: string,
): AutomaticPasteDiagnosticRecordV1 {
  return {
    schemaVersion: 1,
    id: uuid(seed),
    occurredAt,
    requestId: uuid(seed + 10_000),
    kind: seed % 2 === 0 ? 'text' : 'image',
    result: 'paste-issued',
    terminalStage: 'complete',
    safetyCategory: null,
    failureCode: null,
    timingsMs: {
      clipboardPreparation: null,
      clipboardWrite: null,
      browserSafetyPreparation: null,
      nativeContextCaptureRoundtrip: null,
      triggerCleanupAndRevalidation: null,
      nativePasteRequestRoundtrip: null,
      totalObservedDelivery: null,
    },
  };
}

describe('Dexie Automatic Paste diagnostics repository', () => {
  let databaseName: string;
  let database: AiSupportWorkspaceDatabase;

  beforeEach(() => {
    databaseName = `automatic-paste-diagnostics-${crypto.randomUUID()}`;
    database = createIsolatedDatabase(databaseName);
  });

  afterEach(async () => {
    database.close({ disableAutoOpen: true });
    await deleteIsolatedDatabase(databaseName);
  });

  it('resolves absent state to disabled and persists enablement across reopen', async () => {
    let repository = new DexieAutomaticPasteDiagnosticsRepository(database);
    await expect(repository.isEnabled()).resolves.toBe(false);
    expect(await database.automaticPasteDiagnosticsState.count()).toBe(0);

    await repository.setEnabled(true);
    expect(await database.automaticPasteDiagnosticsState.toArray()).toEqual([
      { id: 'global', enabled: true },
    ]);

    database.close();
    database = createIsolatedDatabase(databaseName);
    repository = new DexieAutomaticPasteDiagnosticsRepository(database);
    await expect(repository.isEnabled()).resolves.toBe(true);

    await repository.setEnabled(false);
    await expect(repository.isEnabled()).resolves.toBe(false);
  });

  it('upgrades v6 by adding empty diagnostics stores without rewriting prior data', async () => {
    database.close({ disableAutoOpen: true });
    const versionSix = new Dexie(databaseName, { indexedDB, IDBKeyRange });
    versionSix.version(6).stores({
      knowledgeEntries: 'id, createdAt',
      settings: 'id',
      snippetEntries: 'id, createdAt, &trigger',
      snippetAssets: 'id, snippetId, createdAt',
      snippetUsageStats: 'snippetId, lastUsedAt',
      snippetGeneratedMetadata: 'snippetId, generatedAt',
      automaticBackupState: 'id',
    });
    await versionSix.open();
    await versionSix.table('knowledgeEntries').add({
      id: 'knowledge-1',
      title: 'Preserved',
      body: 'Exact body',
      tags: ['local'],
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    await versionSix.table('settings').add({
      id: 'global',
      defaultModel: 'preserved-model',
      snippetPasteMode: 'automatic',
      automaticBackupCadence: 'weekly',
    });
    versionSix.close();

    database = createIsolatedDatabase(databaseName);
    await database.open();

    expect(database.verno).toBe(DATABASE_VERSION);
    expect(await database.knowledgeEntries.toArray()).toEqual([
      {
        id: 'knowledge-1',
        title: 'Preserved',
        body: 'Exact body',
        tags: ['local'],
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-01T00:00:00.000Z',
      },
    ]);
    expect(await database.settings.toArray()).toEqual([
      {
        id: 'global',
        defaultModel: 'preserved-model',
        snippetPasteMode: 'automatic',
        automaticBackupCadence: 'weekly',
      },
    ]);
    expect(await database.automaticPasteDiagnosticsState.count()).toBe(0);
    expect(await database.automaticPasteDiagnosticRecords.count()).toBe(0);
  });

  it('retains the exact 30-day boundary and removes only older records', async () => {
    const repository = new DexieAutomaticPasteDiagnosticsRepository(database);
    const cutoff = '2026-09-03T12:00:00.000Z';
    await database.automaticPasteDiagnosticRecords.bulkAdd([
      record(1, '2026-09-03T11:59:59.999Z'),
      record(2, cutoff),
      record(3, '2026-09-03T12:00:00.001Z'),
    ]);

    await expect(repository.pruneAndList(cutoff)).resolves.toEqual([
      record(2, cutoff),
      record(3, '2026-09-03T12:00:00.001Z'),
    ]);
  });

  it('retains 2,000 records and prunes the deterministic oldest of 2,001', async () => {
    const repository = new DexieAutomaticPasteDiagnosticsRepository(database);
    const occurredAt = '2026-10-03T12:00:00.000Z';
    const existing = Array.from({ length: 2_000 }, (_, index) =>
      record(index + 1, occurredAt),
    );
    await database.automaticPasteDiagnosticRecords.bulkAdd(existing);
    await repository.appendAndPrune(
      record(2_001, occurredAt),
      '2026-09-03T12:00:00.000Z',
    );

    const retained = await repository.pruneAndList('2026-09-03T12:00:00.000Z');
    expect(retained).toHaveLength(2_000);
    expect(retained[0]?.id).toBe(uuid(2));
    expect(retained.at(-1)?.id).toBe(uuid(2_001));
  });

  it('rolls back append and pruning together when the diagnostics transaction fails', async () => {
    const preserved = record(1, '2026-08-01T00:00:00.000Z');
    await database.automaticPasteDiagnosticRecords.add(preserved);
    const repository = new DexieAutomaticPasteDiagnosticsRepository(database, {
      afterAppend: () => {
        throw new Error('forced diagnostics failure');
      },
    });

    await expect(
      repository.appendAndPrune(
        record(2, '2026-10-03T12:00:00.000Z'),
        '2026-09-03T12:00:00.000Z',
      ),
    ).rejects.toThrow();
    expect(await database.automaticPasteDiagnosticRecords.toArray()).toEqual([
      preserved,
    ]);
  });

  it('clear removes records only and preserves enablement plus every domain store', async () => {
    const repository = new DexieAutomaticPasteDiagnosticsRepository(database);
    await repository.setEnabled(true);
    await database.automaticPasteDiagnosticRecords.add(
      record(1, '2026-10-03T12:00:00.000Z'),
    );
    await database.knowledgeEntries.add({
      id: 'knowledge-1',
      title: 'Preserved',
      body: 'Body',
      tags: [],
      source: '',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    });

    await repository.clearRecords();

    expect(await database.automaticPasteDiagnosticRecords.count()).toBe(0);
    await expect(repository.isEnabled()).resolves.toBe(true);
    expect(await database.knowledgeEntries.count()).toBe(1);
  });
});
