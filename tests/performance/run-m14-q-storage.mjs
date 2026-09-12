/* global performance, requestAnimationFrame, cancelAnimationFrame */
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { summarizeSamples } from './m14-q-measurement.mjs';

const batch = process.argv[2] ?? 'a';
const report = {
  batch,
  mode: 'Vite development modules; real Chromium IndexedDB/Dexie, fake provider transport',
  interval:
    'performance.now immediately before awaited application operation to resolution/rejection; setup, seed, fixture serialization, metadata modes and declared warmups excluded',
  sessions: [],
  failures: [],
};
const out = resolve('tests/performance/results');
await mkdir(out, { recursive: true });
const outputPath = `${out}/m14-q-storage-${process.argv[3] ?? batch}.json`;
try {
  await access(outputPath);
  throw new Error(
    `Refusing to overwrite ${outputPath}; pass a fresh output label`,
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const save = () => writeFile(outputPath, JSON.stringify(report, null, 2));
const server = await createServer({
  root: process.cwd(),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  report.browser = browser.version();
  const tiers =
    batch === 'mapping'
      ? [10000]
      : batch === 'mixed'
        ? ['mixed']
        : batch === 'near'
          ? ['near']
          : batch === 'repeat'
            ? [1000, 10000]
            : [0, 100, 1000, 10000, 'mixed'];
  for (const tier of tiers) {
    const nearLimit = tier === 'near';
    for (
      let reset = 0;
      reset < (nearLimit || batch === 'repeat' || batch === 'mapping' ? 1 : 5);
      reset++
    ) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const row = { tier, reset, measurements: {} };
      report.sessions.push(row);
      try {
        await page.goto(
          `${server.resolvedUrls.local[0]}tests/performance/m14-q-storage.html`,
        );
        await page.waitForFunction(
          () => typeof globalThis.createM14QStorage === 'function',
        );
        row.setup = await page.evaluate(
          (options) => globalThis.createM14QStorage(options),
          {
            count: nearLimit ? 0 : tier === 'mixed' ? 1000 : tier,
            mixed: tier === 'mixed',
            boundedMixed: batch === 'mixed',
            nearLimit,
          },
        );
        if (nearLimit)
          await page.evaluate(() => {
            globalThis.__auditFrameGaps = [];
            let last = performance.now();
            const tick = () => {
              const now = performance.now();
              globalThis.__auditFrameGaps.push(now - last);
              last = now;
              globalThis.__auditRaf = requestAnimationFrame(tick);
            };
            globalThis.__auditRaf = requestAnimationFrame(tick);
          });
        const resource = nearLimit
          ? await context.newCDPSession(page)
          : undefined;
        if (resource) {
          await resource.send('Performance.enable');
          row.memorySnapshots = [await resource.send('Performance.getMetrics')];
        }
        const operations =
          batch === 'mapping'
            ? ['restore-record-mapping']
            : nearLimit
              ? [
                  'snapshot',
                  'stringify',
                  'canonical-backup',
                  'parse-validate',
                  'prepare-import',
                  'atomic-restore',
                ]
              : [
                  'db-reopen',
                  'list',
                  'read',
                  'trigger-read',
                  'catalog',
                  'create-delete',
                  ...(tier
                    ? [
                        'update',
                        'conditional-save',
                        'plan-by-id',
                        'library-copy-fake-writer',
                        'coordinator-fake-writer',
                      ]
                    : []),
                  ...(tier === 'mixed' ? ['asset-read'] : []),
                  'prompt',
                  'fake-provider',
                  'fingerprint',
                  'parser',
                  'snapshot',
                  'stringify',
                  'canonical-backup',
                  'parse-validate',
                  'prepare-import',
                  'atomic-restore',
                  ...(tier ? ['update-during-snapshot'] : []),
                ];
        for (const name of operations) {
          const cheap = [
            'restore-record-mapping',
            'db-reopen',
            'read',
            'trigger-read',
            'conditional-save',
            'plan-by-id',
            'library-copy-fake-writer',
            'coordinator-fake-writer',
            'prompt',
            'fake-provider',
            'fingerprint',
            'parser',
            'stringify',
          ].includes(name);
          const n = nearLimit
            ? 3
            : reset === 0
              ? cheap
                ? 30
                : tier === 10000
                  ? 3
                  : tier === 'mixed'
                    ? 10
                    : 30
              : 1;
          const firstUse =
            reset === 0 && !nearLimit
              ? await page.evaluate(
                  (name) => globalThis.m14QStorage.measure(name, 1, 0),
                  name,
                )
              : [];
          const samples = await page.evaluate(
            async ({ name, n, warmups }) =>
              globalThis.m14QStorage.measure(name, n, warmups),
            {
              name,
              n,
              warmups: reset === 0 && !nearLimit && tier !== 10000 ? 2 : 0,
            },
          );
          if (resource)
            row.memorySnapshots.push(
              await resource.send('Performance.getMetrics'),
            );
          row.measurements[name] = {
            firstUse,
            warmups: reset === 0 && !nearLimit && tier !== 10000 ? 2 : 0,
            runs: samples,
            ...summarizeSamples(
              samples.filter((x) => !x.error).map((x) => x.ms),
            ),
            failures: samples.filter((x) => x.error),
          };
          await save();
        }
        await resource?.detach();
        row.fakeProviderRequestUtf8Bytes = await page.evaluate(
          () => globalThis.m14QStorage.lastProviderBytes,
        );
        if (!nearLimit && batch !== 'mapping') {
          for (const mode of batch === 'repeat'
            ? ['stale', 'valid', 'missing']
            : ['missing', 'valid', 'stale']) {
            await page.evaluate(
              (mode) => globalThis.m14QStorage.metadataMode(mode),
              mode,
            );
            for (const query of ['common', 'rare', 'none']) {
              const n = reset === 0 ? (tier === 10000 ? 3 : 30) : 1;
              const firstUse =
                reset === 0
                  ? await page.evaluate(
                      (query) =>
                        globalThis.m14QStorage.measure(
                          `retrieve-${query}`,
                          1,
                          0,
                        ),
                      query,
                    )
                  : [];
              const runs = await page.evaluate(
                async ({ query, n, warmups }) =>
                  globalThis.m14QStorage.measure(
                    `retrieve-${query}`,
                    n,
                    warmups,
                  ),
                { query, n, warmups: reset === 0 ? 2 : 0 },
              );
              row.measurements[`retrieve-${mode}-${query}`] = {
                firstUse,
                warmups: reset === 0 ? 2 : 0,
                runs,
                ...summarizeSamples(
                  runs.filter((x) => !x.error).map((x) => x.ms),
                ),
                failures: runs.filter((x) => x.error),
              };
            }
          }
          if (reset === 0) {
            row.instrumented = await page.evaluate(() =>
              globalThis.m14QStorage.diagnostic(),
            );
            if (tier)
              row.generatedChecks = await page.evaluate(() =>
                globalThis.m14QStorage.generatedChecks(),
              );
            if (tier === 10000 && batch === 'repeat')
              row.restoreStages = await page.evaluate(async () => {
                const { DexieTransactionalBackupRestorePort } =
                  await import('/src/infrastructure/persistence/dexie-backup-persistence.ts');
                const session = globalThis.m14QStorage;
                const snapshot = await session.snapshot.readSnapshot();
                const stages = [];
                const start = performance.now();
                let previous = start;
                await new DexieTransactionalBackupRestorePort(
                  session.database,
                  {
                    afterStage(stage) {
                      const now = performance.now();
                      stages.push({
                        stage,
                        sincePriorMs: now - previous,
                        cumulativeMs: now - start,
                      });
                      previous = now;
                    },
                  },
                ).replaceAll(snapshot);
                return {
                  stages,
                  totalMs: performance.now() - start,
                  note: 'Existing test hooks, one separate instrumented restore; no timing assertion',
                };
              });
          }
        }
        if (nearLimit)
          row.frameGaps = await page.evaluate(() => {
            cancelAnimationFrame(globalThis.__auditRaf);
            return globalThis.__auditFrameGaps;
          });
        const cdp = await context.newCDPSession(page);
        await cdp.send('Performance.enable');
        row.endMetrics = await cdp.send('Performance.getMetrics');
        await cdp.detach();
        await page.evaluate(() => globalThis.m14QStorage.close());
      } catch (error) {
        row.error = String(error);
        report.failures.push({ tier, reset, error: String(error) });
        process.exitCode = 1;
      } finally {
        await context.close();
        await save();
      }
      process.stdout.write(`storage ${tier}, reset ${reset} finished\n`);
    }
  }
} catch (error) {
  report.failures.push(String(error));
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server.close();
  await save();
}
