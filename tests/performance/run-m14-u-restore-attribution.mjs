/* global performance */
import { chromium } from '@playwright/test';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

import { summarizeSamples } from './m14-q-measurement.mjs';

const outputLabel = process.argv[2];
if (
  outputLabel !== undefined &&
  !/^[a-z0-9][a-z0-9-]{0,50}$/.test(outputLabel)
) {
  throw new Error(
    'Optional output label must contain only lowercase letters, digits, and hyphens.',
  );
}
const outputPath = resolve(
  `tests/performance/results/m14-u-restore-attribution${outputLabel === undefined ? '' : `-${outputLabel}`}.json`,
);
const report = {
  task: 'M14-U — Backup Restore Write-Path Attribution',
  status: 'started',
  startedAt: new Date().toISOString(),
  environment: {
    method:
      'Vite development modules in real headless Playwright Chromium; native IndexedDB and production Dexie; disposable browser context and randomized databases',
    timing:
      'performance.now around awaited production/application or Dexie boundaries; fixture creation, database open/delete, integrity checks, and declared warmups excluded unless explicitly identified',
  },
  phases: {},
  failures: [],
  result: {
    classification: 'pending analysis',
    narrowestNextOption: 'pending analysis',
  },
};

await mkdir(resolve('tests/performance/results'), { recursive: true });
try {
  await access(outputPath);
  throw new Error(
    `Refusing to overwrite existing M14-U evidence: ${outputPath}`,
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const save = () =>
  writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

function summarizeRestoreSamples(samples) {
  const stageNames = samples[0]?.stages.map(({ stage }) => stage) ?? [];
  return {
    runs: samples,
    total: summarizeSamples(samples.map(({ totalMs }) => totalMs)),
    postFinalHook: summarizeSamples(
      samples.map(({ postFinalHookMs }) => postFinalHookMs),
    ),
    stages: Object.fromEntries(
      stageNames.map((stage) => [
        stage,
        summarizeSamples(
          samples.map((sample) => {
            const timing = sample.stages.find((item) => item.stage === stage);
            if (timing === undefined) {
              throw new Error(`Missing restore stage ${stage}.`);
            }
            return timing.sincePriorMs;
          }),
        ),
      ]),
    ),
  };
}

function summarizeWriteVariants(phase) {
  const variants = [...new Set(phase.samples.map(({ variant }) => variant))];
  return {
    ...phase,
    summaries: Object.fromEntries(
      variants.map((variant) => {
        const samples = phase.samples.filter(
          (sample) => sample.variant === variant,
        );
        return [
          variant,
          {
            transactionTotal: summarizeSamples(
              samples.map(({ transactionTotalMs }) => transactionTotalMs),
            ),
            bulkAddAwait: summarizeSamples(
              samples.map(({ bulkAddAwaitMs }) => bulkAddAwaitMs),
            ),
            postBulkAddToTransactionResolution: summarizeSamples(
              samples.map(
                ({ postBulkAddToTransactionResolutionMs }) =>
                  postBulkAddToTransactionResolutionMs,
              ),
            ),
          },
        ];
      }),
    ),
  };
}

let server;
let browser;
let context;
try {
  await save();
  const { createServer } = await import('vite');
  server = await createServer({
    root: process.cwd(),
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0 },
  });
  await server.listen();
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext();
  const page = await context.newPage();
  const baseUrl = server.resolvedUrls?.local[0];
  if (baseUrl === undefined)
    throw new Error('Vite did not expose a local URL.');
  await page.goto(`${baseUrl}tests/performance/m14-u-restore-attribution.html`);
  await page.waitForFunction(
    () => typeof globalThis.createM14UAttribution === 'function',
  );
  await page.evaluate(() => globalThis.createM14UAttribution());
  report.environment.chromium = browser.version();

  report.phases.fixture = await page.evaluate(() =>
    globalThis.m14UAttribution.fixtureIntegrity(),
  );
  report.phases.recordPreparation = await page.evaluate(() => {
    const measured = globalThis.m14UAttribution.measureMapping();
    return {
      ...measured,
      repeat: measured.runsMs,
    };
  });
  report.phases.recordPreparation.repeat = summarizeSamples(
    report.phases.recordPreparation.runsMs,
  );
  report.phases.recordPreparation.firstUse = summarizeSamples([
    report.phases.recordPreparation.firstUseMs,
  ]);
  report.status = 'record-preparation-complete';
  await save();

  report.status = 'production-restore-running';
  await save();
  const productionRestore = await page.evaluate(() =>
    globalThis.m14UAttribution.measureProductionRestore(),
  );
  report.phases.productionRestore = {
    ...productionRestore,
    firstUseAfterSeed: summarizeRestoreSamples([
      productionRestore.firstUseAfterSeed,
    ]),
    repeated: summarizeRestoreSamples(productionRestore.repeated),
  };
  report.status = 'production-restore-complete';
  await save();

  report.status = 'write-variants-running';
  await save();
  report.phases.writeVariants = summarizeWriteVariants(
    await page.evaluate(() =>
      globalThis.m14UAttribution.measureWriteVariants(),
    ),
  );
  report.status = 'measurements-complete-pending-analysis';
  report.completedMeasurementsAt = new Date().toISOString();
} catch (error) {
  report.status = 'failed-or-interrupted';
  report.failures.push({
    at: new Date().toISOString(),
    elapsedMs: performance.now(),
    error: String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exitCode = 1;
} finally {
  await context?.close();
  await browser?.close();
  await server?.close();
  await save();
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
