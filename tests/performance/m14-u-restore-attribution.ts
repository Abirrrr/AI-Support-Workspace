import Dexie, { type Table } from 'dexie';

import type { BackupRestoreData } from '../../src/application/backup/backup-ports';
import type { SnippetContent } from '../../src/domain/snippet-content';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import {
  type BackupRestoreStage,
  DexieTransactionalBackupRestorePort,
} from '../../src/infrastructure/persistence/dexie-backup-persistence';
import { AiSupportWorkspaceDatabase } from '../../src/infrastructure/persistence/database';
import {
  toSnippetEntryRecord,
  type SnippetEntryRecord,
} from '../../src/infrastructure/persistence/snippet-entry-record';

const RECORD_COUNT = 10_000;
const STAMP = '2026-09-06T00:00:00.000Z';
const RESTORE_REPEAT_COUNT = 3;
const WRITE_ROUNDS = 3;

type WriteVariant =
  | 'production-current'
  | 'diagnostic-primary-only'
  | 'diagnostic-created-at'
  | 'diagnostic-current-indexes';

interface RestoreStageTiming {
  readonly stage: BackupRestoreStage;
  readonly sincePriorMs: number;
  readonly cumulativeMs: number;
}

interface RestoreSample {
  readonly totalMs: number;
  readonly postFinalHookMs: number;
  readonly stages: readonly RestoreStageTiming[];
}

interface WriteSample {
  readonly variant: WriteVariant;
  readonly round: number;
  readonly recordCount: number;
  readonly bulkAddAwaitMs: number;
  readonly postBulkAddToTransactionResolutionMs: number;
  readonly transactionTotalMs: number;
}

const round = (value: number) => Number(value.toFixed(3));
const id = (number: number) =>
  `14000000-0000-4000-8000-${number.toString().padStart(12, '0')}`;

function content(index: number): SnippetContent {
  if (index % 3 === 0) {
    return {
      kind: 'plain',
      text: `Thanks for contacting support. Order ${index}. Café বাংলা 日本語 🚀`,
    };
  }
  const text =
    `Synthetic support order ${index}: ` +
    'Please verify the order status and follow the documented steps. '.repeat(
      index % 3 === 1 ? 8 : 40,
    );
  return {
    kind: 'rich',
    blocks: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', text, bold: true, italic: false },
          {
            type: 'link',
            text: 'Help',
            url: 'https://example.invalid/help',
            bold: false,
            italic: false,
          },
        ],
      },
      {
        type: 'list',
        listType: index % 2 ? 'ordered' : 'unordered',
        items: ['Verify identity', 'Review order', 'Confirm resolution'].map(
          (text) => ({
            children: [
              { type: 'text' as const, text, bold: false, italic: false },
            ],
          }),
        ),
      },
    ],
  };
}

function snippet(index: number): SnippetEntry {
  return {
    id: id(index + 1),
    title: index === 0 ? 'Support quasarunique' : `Support reply ${index}`,
    content: content(index),
    tags: ['support', index % 2 ? 'billing' : 'shipping'],
    createdAt: STAMP,
    updatedAt: STAMP,
    trigger: `;q${index}`,
  };
}

function restoreData(snippets: readonly SnippetEntry[]): BackupRestoreData {
  return {
    knowledge: [
      {
        id: id(200_000),
        title: 'Support compatibility reference',
        body: 'Knowledge remains available for support orders.',
        tags: ['support'],
        source: 'synthetic',
        createdAt: STAMP,
        updatedAt: STAMP,
      },
    ],
    snippets,
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

class DiagnosticSnippetDatabase extends Dexie {
  readonly snippets: Table<SnippetEntryRecord, string>;

  constructor(name: string, schema: string) {
    super(name);
    this.version(1).stores({ snippets: schema });
    this.snippets = this.table('snippets');
  }
}

async function measureRestore(
  database: AiSupportWorkspaceDatabase,
  data: BackupRestoreData,
): Promise<RestoreSample> {
  const stages: RestoreStageTiming[] = [];
  const startedAt = performance.now();
  let priorAt = startedAt;
  let finalHookAt = startedAt;
  const instrumented = new DexieTransactionalBackupRestorePort(database, {
    afterStage(stage) {
      const now = performance.now();
      stages.push({
        stage,
        sincePriorMs: round(now - priorAt),
        cumulativeMs: round(now - startedAt),
      });
      priorAt = now;
      finalHookAt = now;
    },
  });
  await instrumented.replaceAll(data);
  const completedAt = performance.now();
  return {
    totalMs: round(completedAt - startedAt),
    postFinalHookMs: round(completedAt - finalHookAt),
    stages,
  };
}

async function measureTableWrite(
  database: Dexie,
  table: Table<SnippetEntryRecord, string>,
  records: readonly SnippetEntryRecord[],
  variant: WriteVariant,
  roundNumber: number,
): Promise<WriteSample> {
  const transactionStartedAt = performance.now();
  let bulkAddStartedAt = transactionStartedAt;
  let bulkAddResolvedAt = transactionStartedAt;
  await database.transaction('rw', table, async () => {
    bulkAddStartedAt = performance.now();
    await table.bulkAdd(records);
    bulkAddResolvedAt = performance.now();
  });
  const transactionResolvedAt = performance.now();
  return {
    variant,
    round: roundNumber,
    recordCount: records.length,
    bulkAddAwaitMs: round(bulkAddResolvedAt - bulkAddStartedAt),
    postBulkAddToTransactionResolutionMs: round(
      transactionResolvedAt - bulkAddResolvedAt,
    ),
    transactionTotalMs: round(transactionResolvedAt - transactionStartedAt),
  };
}

async function withProductionDatabase<T>(
  action: (database: AiSupportWorkspaceDatabase) => Promise<T>,
): Promise<T> {
  const database = new AiSupportWorkspaceDatabase({
    databaseName: `m14-u-production-${crypto.randomUUID()}`,
  });
  try {
    await database.open();
    return await action(database);
  } finally {
    database.close();
    await database.delete();
  }
}

async function withDiagnosticDatabase<T>(
  schema: string,
  action: (database: DiagnosticSnippetDatabase) => Promise<T>,
): Promise<T> {
  const database = new DiagnosticSnippetDatabase(
    `m14-u-diagnostic-${crypto.randomUUID()}`,
    schema,
  );
  try {
    await database.open();
    return await action(database);
  } finally {
    database.close();
    await database.delete();
  }
}

class M14UAttributionSession {
  readonly snippets = Array.from({ length: RECORD_COUNT }, (_, index) =>
    snippet(index),
  );
  readonly data = restoreData(this.snippets);
  readonly mappedRecords = this.snippets.map(toSnippetEntryRecord);

  fixtureIntegrity() {
    const ids = new Set(this.snippets.map((entry) => entry.id));
    const triggers = new Set(this.snippets.map((entry) => entry.trigger));
    const serializedBytes = new TextEncoder().encode(
      JSON.stringify(this.snippets),
    ).byteLength;
    const result = {
      recordCount: this.snippets.length,
      mappedRecordCount: this.mappedRecords.length,
      uniqueIds: ids.size,
      uniqueTriggers: triggers.size,
      firstId: this.snippets[0]?.id,
      lastId: this.snippets.at(-1)?.id,
      serializedSnippetBytes: serializedBytes,
      fixture:
        'Deterministic M14-Q-comparable 10,000 Text Snippets: identical IDs, titles, content generator, tags, timestamps, and unique triggers.',
    };
    if (
      result.recordCount !== RECORD_COUNT ||
      result.mappedRecordCount !== RECORD_COUNT ||
      result.uniqueIds !== RECORD_COUNT ||
      result.uniqueTriggers !== RECORD_COUNT ||
      result.firstId !== id(1) ||
      result.lastId !== id(RECORD_COUNT)
    ) {
      throw new Error(`Fixture integrity failed: ${JSON.stringify(result)}`);
    }
    return result;
  }

  measureMapping() {
    const measure = () => {
      const startedAt = performance.now();
      const records = this.snippets.map(toSnippetEntryRecord);
      const elapsed = round(performance.now() - startedAt);
      if (records.length !== RECORD_COUNT) {
        throw new Error('Mapping produced the wrong record count.');
      }
      return elapsed;
    };
    return {
      firstUseMs: measure(),
      warmups: 0,
      runsMs: Array.from({ length: 30 }, measure),
      boundary:
        'Synchronous production toSnippetEntryRecord conversion only; no IndexedDB request or transaction.',
    };
  }

  async measureProductionRestore() {
    return withProductionDatabase(async (database) => {
      const restore = new DexieTransactionalBackupRestorePort(database);
      const seedStartedAt = performance.now();
      await restore.replaceAll(this.data);
      const seedMs = round(performance.now() - seedStartedAt);
      const firstUseAfterSeed = await measureRestore(database, this.data);
      const repeated: RestoreSample[] = [];
      for (let index = 0; index < RESTORE_REPEAT_COUNT; index += 1) {
        repeated.push(await measureRestore(database, this.data));
      }
      const finalCounts = {
        knowledge: await database.knowledgeEntries.count(),
        snippets: await database.snippetEntries.count(),
        assets: await database.snippetAssets.count(),
        settings: await database.settings.count(),
        usage: await database.snippetUsageStats.count(),
        generatedMetadata: await database.snippetGeneratedMetadata.count(),
      };
      if (
        finalCounts.knowledge !== 1 ||
        finalCounts.snippets !== RECORD_COUNT ||
        finalCounts.assets !== 0 ||
        finalCounts.settings !== 1 ||
        finalCounts.usage !== 0 ||
        finalCounts.generatedMetadata !== 0
      ) {
        throw new Error(
          `Production restore integrity failed: ${JSON.stringify(finalCounts)}`,
        );
      }
      return {
        seedMs,
        firstUseAfterSeed,
        repeated,
        finalCounts,
        boundary:
          'Real DexieTransactionalBackupRestorePort.replaceAll over the production v6 database. Each hook interval ends after the named awaited stage; total resolution includes transaction completion after the final hook.',
      };
    });
  }

  async measureWriteVariants() {
    const warmupRecords = this.mappedRecords.slice(0, 100);
    await withProductionDatabase(async (database) => {
      await measureTableWrite(
        database,
        database.snippetEntries,
        warmupRecords,
        'production-current',
        -1,
      );
    });
    for (const schema of ['id', 'id, createdAt', 'id, createdAt, &trigger']) {
      await withDiagnosticDatabase(schema, async (database) => {
        await measureTableWrite(
          database,
          database.snippets,
          warmupRecords,
          'diagnostic-primary-only',
          -1,
        );
      });
    }

    const variants: readonly WriteVariant[] = [
      'production-current',
      'diagnostic-primary-only',
      'diagnostic-created-at',
      'diagnostic-current-indexes',
    ];
    const schemas: Record<
      Exclude<WriteVariant, 'production-current'>,
      string
    > = {
      'diagnostic-primary-only': 'id',
      'diagnostic-created-at': 'id, createdAt',
      'diagnostic-current-indexes': 'id, createdAt, &trigger',
    };
    const samples: WriteSample[] = [];
    for (let roundNumber = 0; roundNumber < WRITE_ROUNDS; roundNumber += 1) {
      const order = [
        ...variants.slice(roundNumber),
        ...variants.slice(0, roundNumber),
      ];
      for (const variant of order) {
        if (variant === 'production-current') {
          samples.push(
            await withProductionDatabase((database) =>
              measureTableWrite(
                database,
                database.snippetEntries,
                this.mappedRecords,
                variant,
                roundNumber,
              ),
            ),
          );
        } else {
          samples.push(
            await withDiagnosticDatabase(schemas[variant], (database) =>
              measureTableWrite(
                database,
                database.snippets,
                this.mappedRecords,
                variant,
                roundNumber,
              ),
            ),
          );
        }
      }
    }
    return {
      warmup:
        'One declared 100-record write per database class/schema; warmups are excluded.',
      rounds: WRITE_ROUNDS,
      order:
        'Rotated variant order by round to reduce fixed sequence bias; every measured write uses a fresh disposable database opened before timing.',
      schemas: {
        'production-current':
          'Production AiSupportWorkspaceDatabase v6 snippetEntries: id, createdAt, &trigger',
        ...schemas,
      },
      requestBoundary:
        'bulkAddAwaitMs ends when Dexie bulkAdd resolves inside the transaction callback. postBulkAddToTransactionResolutionMs is the remaining time until the outer Dexie transaction promise resolves; browser internals below these observable boundaries are not claimed.',
      samples,
    };
  }
}

declare global {
  var m14UAttribution: M14UAttributionSession | undefined;
  var createM14UAttribution: (() => Promise<void>) | undefined;
}

globalThis.createM14UAttribution = async () => {
  if (globalThis.m14UAttribution !== undefined) {
    throw new Error('Only one M14-U attribution session is allowed.');
  }
  const session = new M14UAttributionSession();
  globalThis.m14UAttribution = session;
};
