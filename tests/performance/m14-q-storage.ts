import { SnippetDeliveryCoordinator } from '../../src/extension/snippet-trigger/delivery-coordinator';
import { SnippetDeliveryPlanner } from '../../src/application/snippet/snippet-delivery-planner';
import { DexieSnippetAssetRepository } from '../../src/infrastructure/persistence/dexie-snippet-asset-repository';
import { CopySnippetToClipboardService } from '../../src/application/snippet/copy-snippet-to-clipboard';
import { AiSupportWorkspaceDatabase } from '../../src/infrastructure/persistence/database';
import { DexieSnippetEntryRepository } from '../../src/infrastructure/persistence/dexie-snippet-entry-repository';
import { DexieKnowledgeEntryRepository } from '../../src/infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSnippetGeneratedMetadataRepository } from '../../src/infrastructure/persistence/dexie-snippet-generated-metadata-repository';
import {
  DexieBackupSnapshotReader,
  DexieTransactionalBackupRestorePort,
} from '../../src/infrastructure/persistence/dexie-backup-persistence';
import { RetrievalEngine } from '../../src/application/retrieval/retrieval-engine';
import { TriggerCatalogService } from '../../src/application/snippet/trigger-catalog';
import { PromptBuilder } from '../../src/application/prompt/prompt-builder';
import { OllamaProvider } from '../../src/infrastructure/generation/ollama-provider';
import { createSnippetSourceFingerprint } from '../../src/domain/snippet-generated-metadata';
import type { SnippetGeneratedMetadata } from '../../src/domain/snippet-generated-metadata';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import type { SnippetAsset } from '../../src/domain/snippet-asset';
import type { SnippetContent } from '../../src/domain/snippet-content';
import { renderSnippetPlainText } from '../../src/domain/snippet-content';
import {
  SnippetTagBackfillService,
  SnippetTagGenerationService,
  parseGeneratedSnippetTags,
} from '../../src/application/snippet/snippet-tag-generation';
import {
  BackupV7CreationService,
  BackupRestoreService,
  BackupImportService,
  measureUtf8Bytes,
} from '../../src/application/backup/backup-service';
import { parseBackupFile } from '../../src/application/backup/backup-validator';
import { toSnippetEntryRecord } from '../../src/infrastructure/persistence/snippet-entry-record';

const stamp = '2026-09-06T00:00:00.000Z';
const round = (n: number) => Number(n.toFixed(3));
const id = (n: number) =>
  `14000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const plain = (text: string): SnippetContent => ({ kind: 'plain', text });
function content(index: number): SnippetContent {
  if (index % 3 === 0)
    return plain(
      `Thanks for contacting support. Order ${index}. Café বাংলা 日本語 🚀`,
    );
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
function snippet(index: number, body = content(index)): SnippetEntry {
  return {
    id: id(index + 1),
    title: index === 0 ? 'Support quasarunique' : `Support reply ${index}`,
    content: body,
    tags: ['support', index % 2 ? 'billing' : 'shipping'],
    createdAt: stamp,
    updatedAt: stamp,
    trigger: `;q${index}`,
  };
}
interface Sample {
  ms: number;
  error?: string;
}
interface SessionOptions {
  count: number;
  mixed?: boolean;
  boundedMixed?: boolean;
  nearLimit?: boolean;
}
class AuditSession {
  readonly database = new AiSupportWorkspaceDatabase({
    databaseName: `m14-q-storage-${crypto.randomUUID()}`,
  });
  readonly snippets = new DexieSnippetEntryRepository(this.database);
  readonly knowledge = new DexieKnowledgeEntryRepository(this.database);
  readonly metadata = new DexieSnippetGeneratedMetadataRepository(
    this.database,
  );
  readonly retrieval = new RetrievalEngine(
    this.knowledge,
    this.snippets,
    this.metadata,
  );
  readonly snapshot = new DexieBackupSnapshotReader(this.database);
  readonly restore = new DexieTransactionalBackupRestorePort(this.database);
  readonly records: SnippetEntry[] = [];
  readonly assets: SnippetAsset[] = [];
  readonly promptRecords: SnippetEntry[] = [];
  validMetadata: SnippetGeneratedMetadata[] = [];
  readonly checks: Record<string, unknown> = {};
  counts: Record<string, number> = {};
  fixture: Record<string, unknown> = {};
  backup: Awaited<ReturnType<BackupV7CreationService['create']>> | undefined;
  lastProviderBytes = 0;
  readonly provider = new OllamaProvider(async (_url, init) => {
    this.lastProviderBytes =
      typeof init?.body === 'string'
        ? new TextEncoder().encode(init.body).length
        : 0;
    return new Response(
      '{"message":{"content":"Synthetic deterministic reply"}}',
      { headers: { 'Content-Type': 'application/json' } },
    );
  });
  async setup(options: SessionOptions) {
    const start = performance.now();
    await this.database.open();
    this.checks.emptyDatabaseOpenMs = round(performance.now() - start);
    for (let i = 0; i < options.count; i++) this.records.push(snippet(i));
    if (options.nearLimit) {
      // 94 MiB ASCII payload plus small envelope, below the unchanged 96 MiB cap.
      this.records.push(snippet(0, plain('x'.repeat(94 * 1024 * 1024))));
    }
    if (options.mixed) {
      for (const [width, height] of [
        [64, 64],
        [640, 480],
        [1440, 900],
      ]) {
        if (width === undefined || height === undefined)
          throw new Error('Missing dimensions');
        for (const mimeType of [
          'image/png',
          'image/jpeg',
          'image/webp',
        ] as const) {
          if (
            options.boundedMixed &&
            width === 1440 &&
            mimeType === 'image/png'
          )
            continue;
          const canvas = new OffscreenCanvas(width, height);
          const context = canvas.getContext('2d');
          if (context === null) throw new Error('2D context unavailable');
          const pixels = new ImageData(width, height);
          let state = 0x9e37_79b9 ^ width ^ (height << 16);
          for (let o = 0; o < pixels.data.length; o += 4) {
            state = Math.imul(state ^ (state >>> 15), 0x85eb_ca6b);
            state = Math.imul(state ^ (state >>> 13), 0xc2b2_ae35);
            state ^= state >>> 16;
            pixels.data[o] = state & 255;
            pixels.data[o + 1] = (state >>> 8) & 255;
            pixels.data[o + 2] = (state >>> 16) & 255;
            pixels.data[o + 3] = 255;
          }
          context.putImageData(pixels, 0, 0);
          const blob = await canvas.convertToBlob(
            mimeType === 'image/png'
              ? { type: mimeType }
              : { type: mimeType, quality: 0.88 },
          );
          canvas.width = 0;
          canvas.height = 0;
          if (blob.type !== mimeType)
            throw new Error('Unexpected encoder format');
          const assetId = id(100_000 + this.assets.length);
          const record = snippet(options.count + this.assets.length, {
            kind: 'image',
            assetId,
          });
          this.records.push(record);
          this.assets.push({
            id: assetId,
            snippetId: record.id,
            mimeType,
            blob,
            byteSize: blob.size,
            originalFilename: `${width}x${height}.${mimeType.split('/')[1]}`,
            createdAt: stamp,
          });
        }
      }
    }
    this.promptRecords.push(
      ...this.records.filter((s) => s.content.kind !== 'image').slice(0, 3),
    );
    this.checks.excludedFixture = options.boundedMixed
      ? '1440x900 opaque PNG excluded only from bounded mixed backup timing because unchanged production Backup decoder rejects it; see m14-q-base64.json. No resizing or changed bytes.'
      : null;
    const knowledge =
      options.count === 0
        ? []
        : [
            {
              id: id(200_000),
              title: 'Support compatibility reference',
              body: 'Knowledge remains available for support orders.',
              tags: ['support'],
              source: 'synthetic',
              createdAt: stamp,
              updatedAt: stamp,
            },
          ];
    await this.restore.replaceAll({
      knowledge,
      snippets: this.records,
      snippetAssets: this.assets,
      settings: {
        defaultModel: null,
        snippetPasteMode: 'clipboard-only',
        automaticBackupCadence: 'weekly',
      },
      snippetUsageStats: [],
      snippetGeneratedMetadata: [],
    });
    // Validate the seeded graph and strict v7 contract outside timed operations.
    this.backup = await new BackupV7CreationService(
      this.snapshot,
      () => new Date(stamp),
      () => id(300_000),
    ).create({ creationMode: 'manual' });
    this.fixture = {
      ...options,
      seed: 'index deterministic; image 0x9e3779b9 xor width xor (height << 16), original M14-P.1 algorithm, quality 0.88',
      snippets: this.records.length,
      textRecords: this.records.filter((s) => s.content.kind !== 'image')
        .length,
      knowledge: knowledge.length,
      serializedBackupBytes: this.backup.byteLength,
      renderedTextUtf8Bytes: this.records.reduce(
        (sum, s) => sum + measureUtf8Bytes(renderSnippetPlainText(s.content)),
        0,
      ),
      assets: this.assets.map((a) => ({
        mimeType: a.mimeType,
        bytes: a.byteSize,
        dimensions: a.originalFilename,
      })),
      assetBytes: this.assets.reduce((sum, a) => sum + a.byteSize, 0),
    };
    if (!options.nearLimit) {
      // Limit setup digest concurrency so fixture construction is not a stress test.
      for (const record of this.records)
        if (record.content.kind !== 'image')
          this.validMetadata.push({
            snippetId: record.id,
            generatedTags: ['support', 'synthetic'],
            sourceFingerprint: await createSnippetSourceFingerprint(record),
            generatedAt: stamp,
          });
    }
  }
  async metadataMode(mode: string) {
    await this.database.snippetGeneratedMetadata.clear();
    if (mode === 'missing') return;
    await this.database.snippetGeneratedMetadata.bulkPut(
      this.validMetadata.map((m) => ({
        ...m,
        generatedTags: [...m.generatedTags],
        sourceFingerprint:
          mode === 'stale' ? '0'.repeat(64) : m.sourceFingerprint,
      })),
    );
  }
  async operation(name: string): Promise<unknown> {
    if (name === 'restore-record-mapping')
      return this.records.map(toSnippetEntryRecord);
    if (name === 'db-reopen') {
      this.database.close();
      return this.database.open();
    }
    if (name === 'list') return this.snippets.list();
    if (name === 'read') return this.snippets.get(id(1));
    if (name === 'trigger-read') return this.snippets.findByTrigger(';q0');
    if (name === 'catalog')
      return new TriggerCatalogService(this.snippets).readCatalog();
    if (name === 'create-delete') {
      const created = await this.snippets.create({
        title: 'Synthetic temporary write',
        content: plain('Transient support response'),
        tags: [],
        trigger: null,
      });
      await this.snippets.delete(created.id);
      return created.id;
    }
    if (name === 'update') {
      const first = this.records[0];
      if (first === undefined) return undefined;
      return this.snippets.update(first.id, first);
    }
    if (name.startsWith('retrieve-'))
      return this.retrieval.retrieve(
        name === 'retrieve-common'
          ? 'support'
          : name === 'retrieve-rare'
            ? 'quasarunique'
            : 'zzznomatchzzz',
      );
    if (name === 'prompt')
      return new PromptBuilder().build({
        merchantContext: 'A synthetic merchant asks about an order.',
        guidance: 'Write a concise support reply.',
        retrievalResults: {
          knowledge: [],
          snippets: this.promptRecords.map((record) => ({
            kind: 'snippet',
            id: record.id,
            record,
            score: 5,
          })),
        },
      });
    if (name === 'fake-provider') {
      const prompt = (await this.operation('prompt')) as ReturnType<
        PromptBuilder['build']
      >;
      return this.provider.generate({ model: 'synthetic-only', prompt });
    }
    if (name === 'fingerprint')
      return createSnippetSourceFingerprint(this.records[0] ?? snippet(0));
    if (name === 'parser')
      return parseGeneratedSnippetTags(
        '["Support", "Ｓｕｐｐｏｒｔ", "  order   status ", "বাংলা"]',
      );
    if (name === 'conditional-save') {
      const first = this.validMetadata[0];
      const source = this.records[0];
      if (first === undefined || source === undefined) return undefined;
      return this.metadata.saveIfSourceMatches(first, source);
    }
    if (name === 'coordinator-fake-writer') {
      const coordinator = new SnippetDeliveryCoordinator(
        new SnippetDeliveryPlanner(
          this.snippets,
          new DexieSnippetAssetRepository(this.database),
        ),
        { write: async () => undefined },
        { isCurrentSnapshot: () => true },
        () => undefined,
      );
      const result = await coordinator.handleMessage({
        type: 'snippet-trigger-activation',
        requestId: 'audit',
        snippetId: id(1),
        trigger: ';q0',
        kind: 'text',
        epoch: 'audit',
        revision: 1,
      });
      if (
        typeof result !== 'object' ||
        result === null ||
        !('outcome' in result) ||
        result.outcome !== 'copied'
      )
        throw new Error('Controlled coordinator failed');
      return result;
    }
    if (name === 'plan-by-id')
      return new SnippetDeliveryPlanner(
        this.snippets,
        new DexieSnippetAssetRepository(this.database),
      ).planById(id(1));
    if (name === 'library-copy-fake-writer') {
      const result = await new CopySnippetToClipboardService(
        new SnippetDeliveryPlanner(
          this.snippets,
          new DexieSnippetAssetRepository(this.database),
        ),
        { write: async () => undefined },
      ).copy(id(1));
      if (result.outcome !== 'copied')
        throw new Error('Controlled Library Copy failed');
      return result;
    }
    if (name === 'asset-read')
      return new DexieSnippetAssetRepository(this.database).get(
        this.assets[0]?.id ?? 'missing',
      );
    if (name === 'snapshot') return this.snapshot.readSnapshot();
    if (name === 'canonical-backup')
      return new BackupV7CreationService(
        this.snapshot,
        () => new Date(stamp),
        () => id(300_000),
      ).create({ creationMode: 'manual' });
    if (this.backup === undefined) throw new Error('Missing prepared fixture');
    if (name === 'stringify') return JSON.stringify(this.backup.backup);
    if (name === 'parse-validate')
      return parseBackupFile(this.backup.serialized);
    if (name === 'prepare-import')
      return new BackupImportService().prepareImport({
        name: 'synthetic-v7.json',
        size: this.backup.byteLength,
        readText: async () => this.backup?.serialized ?? '',
      });
    if (name === 'atomic-restore')
      return new BackupRestoreService(this.restore).restoreBackup(
        this.backup.backup,
      );
    if (name === 'update-during-snapshot')
      return Promise.all([
        this.operation('update'),
        this.operation('snapshot'),
      ]);
    throw new Error(`Unknown operation ${name}`);
  }
  async measure(
    name: string,
    iterations: number,
    warmups: number,
  ): Promise<Sample[]> {
    for (let i = 0; i < warmups; i++) await this.operation(name);
    const samples: Sample[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await this.operation(name);
        samples.push({ ms: round(performance.now() - start) });
      } catch (error) {
        samples.push({
          ms: round(performance.now() - start),
          error: String(error),
        });
      }
    }
    return samples;
  }
  async diagnostic() {
    this.counts = {};
    const restoreFunctions: Array<() => void> = [];
    const wrap = (target: object, key: string, label: string) => {
      const object = target as Record<string, unknown>;
      const original = object[key] as (...args: unknown[]) => unknown;
      object[key] = (...args: unknown[]) => {
        this.counts[label] = (this.counts[label] ?? 0) + 1;
        return original.apply(target, args);
      };
      restoreFunctions.push(() => {
        object[key] = original;
      });
    };
    wrap(this.snippets, 'list', 'snippetRepository.list');
    wrap(this.knowledge, 'list', 'knowledgeRepository.list');
    wrap(this.metadata, 'list', 'metadataRepository.list');
    wrap(this.metadata, 'get', 'metadataRepository.get');
    wrap(this.snippets, 'get', 'snippetRepository.get');
    wrap(crypto.subtle, 'digest', 'sha256Calls');
    try {
      await this.metadataMode('valid');
      this.counts = {};
      const instrumented = await this.measure('retrieve-common', 5, 0);
      const counts = { ...this.counts };
      this.counts = {};
      if (this.records.length) {
        await this.operation('plan-by-id');
        await this.operation('library-copy-fake-writer');
        await this.operation('coordinator-fake-writer');
      }
      const deliveryCounts = { ...this.counts };
      if (
        (deliveryCounts.sha256Calls ?? 0) !== 0 ||
        (deliveryCounts['metadataRepository.list'] ?? 0) !== 0 ||
        (deliveryCounts['metadataRepository.get'] ?? 0) !== 0
      )
        throw new Error('Metadata work entered delivery');
      return {
        instrumented,
        counts,
        deliveryCounts,
        staticTextRecordsScoredPerCall: this.validMetadata.length,
        note: 'Only boundary wrappers; scan count follows records returned and source loop, not IndexedDB internal I/O. Instrumented samples excluded from main timings.',
      };
    } finally {
      for (const restore of restoreFunctions.reverse()) restore();
    }
  }
  async generatedChecks() {
    await this.metadataMode('missing');
    let calls = 0,
      active = 0,
      maxActive = 0;
    const generator = new SnippetTagGenerationService(
      this.snippets,
      this.metadata,
      {
        generate: async () => {
          calls++;
          active++;
          maxActive = Math.max(maxActive, active);
          await Promise.resolve();
          active--;
          if (calls === 3) throw new Error('Synthetic isolated item failure');
          return '["support","synthetic"]';
        },
      },
      () => new Date(stamp),
    );
    const backfill = new SnippetTagBackfillService(
      this.snippets,
      this.metadata,
      generator,
    );
    const started = performance.now();
    const result = await backfill.backfill();
    const backfillMs = round(performance.now() - started);
    const controller = new AbortController();
    controller.abort();
    const cancelled = await backfill.backfill(controller.signal);
    await this.metadataMode('missing');
    let cancelCalls = 0;
    const midController = new AbortController();
    const cancelGenerator = new SnippetTagGenerationService(
      this.snippets,
      this.metadata,
      {
        generate: async () => {
          cancelCalls++;
          midController.abort();
          return '["support"]';
        },
      },
      () => new Date(stamp),
    );
    const midCancelled = await new SnippetTagBackfillService(
      this.snippets,
      this.metadata,
      cancelGenerator,
    ).backfill(midController.signal);
    await this.metadataMode('valid');
    const currentStart = performance.now();
    const current = await backfill.backfill();
    const allCurrentBackfillMs = round(performance.now() - currentStart);
    await this.metadataMode('missing');
    const before = await this.snippets.list();
    const failingRestore = new DexieTransactionalBackupRestorePort(
      this.database,
      {
        afterStage: (stage) => {
          if (stage === 'snippets-cleared')
            throw new Error('Synthetic atomic rollback');
        },
      },
    );
    let rollbackRejected = false;
    try {
      await failingRestore.replaceAll(await this.snapshot.readSnapshot());
    } catch {
      rollbackRejected = true;
    }
    const rollbackPreserved =
      JSON.stringify(before) === JSON.stringify(await this.snippets.list());
    await this.database.settings.update('global', {
      lastSuccessfulBackupAt: stamp,
    });
    if (this.backup === undefined) throw new Error('Backup unavailable');
    await new BackupRestoreService(this.restore).restoreBackup(
      this.backup.backup,
    );
    const localReminderPreserved =
      (await this.database.settings.get('global'))?.lastSuccessfulBackupAt ===
      stamp;
    const checks = {
      calls,
      maxActive,
      backfillMs,
      items: result.items.length,
      statuses: result.items.map((item) => item.result.status),
      cancelledBeforeStartItems: cancelled.items.length,
      cancelCalls,
      cancelledDuringItems: midCancelled.items.length,
      allCurrentItems: current.items.length,
      allCurrentBackfillMs,
      rollbackRejected,
      rollbackPreserved,
      localReminderPreserved,
    };
    if (
      maxActive > 1 ||
      calls > 20 ||
      cancelled.items.length !== 0 ||
      cancelCalls > 1 ||
      current.items.length !== 0 ||
      !rollbackRejected ||
      !rollbackPreserved ||
      !localReminderPreserved
    )
      throw new Error(
        `Generated/restore invariant failed: ${JSON.stringify(checks)}`,
      );
    return checks;
  }
  async close() {
    this.database.close();
    await this.database.delete();
  }
}

declare global {
  var m14QStorage: AuditSession | undefined;
  var createM14QStorage:
    ((options: SessionOptions) => Promise<Record<string, unknown>>) | undefined;
}
globalThis.createM14QStorage = async (options) => {
  if (globalThis.m14QStorage !== undefined)
    throw new Error('Only one owned session at a time');
  const session = new AuditSession();
  globalThis.m14QStorage = session;
  await session.setup(options);
  return { fixture: session.fixture, checks: session.checks };
};
