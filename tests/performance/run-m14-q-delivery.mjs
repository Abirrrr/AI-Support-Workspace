import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { summarizeSamples } from './m14-q-measurement.mjs';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const resultDirectory = fileURLToPath(new URL('./results/', import.meta.url));
const replaceExactly = (source, before, after) => {
  if (source.split(before).length !== 2) {
    throw new Error(
      'Historical benchmark changed; review the audit transform.',
    );
  }
  return source.replace(before, after);
};
const server = await createServer({
  root: repositoryRoot,
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, strictPort: false },
  plugins: [
    {
      name: 'm14-q-raw-delivery-measurements',
      enforce: 'pre',
      transform(source, id) {
        if (
          !id.replaceAll('\\', '/').endsWith('/snippet-delivery-benchmark.ts')
        ) {
          return undefined;
        }
        const start = source.indexOf('function summarize(');
        const end = source.indexOf('function requiredDistribution(', start);
        if (start < 0 || end < 0)
          throw new Error('Historical summary boundary changed');
        let transformed =
          source.slice(0, start) +
          `const auditSummary = ${summarizeSamples.toString()};\nfunction summarize(coldMs, samples) { return { coldRawMs: coldMs, firstCallStatus: 'measured', ...auditSummary(samples) }; }\n` +
          source.slice(end);
        transformed = replaceExactly(
          transformed,
          'for (let index = 0; index < iterations; index += 1) samples.push(await run());',
          `const warmCount = new URLSearchParams(location.search).get('firstOnly') === '1'
    ? 0 : iterations >= 500 ? 30 : iterations;
  for (let index = 0; index < warmCount; index += 1) samples.push(await run());`,
        );
        return { code: transformed, map: null };
      },
    },
  ],
});

let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const runs = [];
  for (let run = 0; run < 5; run += 1) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      const url = new URL(
        'tests/performance/m14-q-delivery.html',
        server.resolvedUrls?.local[0],
      );
      if (run > 0) url.searchParams.set('firstOnly', '1');
      await page.goto(url.href);
      await page.waitForFunction(
        () =>
          'snippetDeliveryBenchmarkResult' in globalThis ||
          'snippetDeliveryBenchmarkError' in globalThis,
        undefined,
        { timeout: 240_000 },
      );
      const outcome = await page.evaluate(() => ({
        result: globalThis.snippetDeliveryBenchmarkResult,
        error: globalThis.snippetDeliveryBenchmarkError,
      }));
      if (typeof outcome.error === 'string') throw new Error(outcome.error);
      runs.push({ freshContextIndex: run + 1, result: outcome.result });
      process.stderr.write(`M14-Q delivery context ${run + 1}/5 completed.\n`);
    } finally {
      await context.close();
    }
  }
  const report = {
    task: 'M14-Q',
    generatedAt: new Date().toISOString(),
    methodology: {
      historicalHarnessModifiedOnDisk: false,
      fixture:
        'Existing deterministic opaque RGB seed, dimensions and codec quality unchanged.',
      repetitions:
        'Five independent fresh browser contexts. First context collects 30 warm Text/message samples, historical image counts (6/12 preparation, 12/24 planner) and native serialization counts (6/8/15). Later contexts collect first-measured calls only.',
      coldMeaning:
        'First measured call per stage in a fresh context, not process/OS-cache cold: all fixtures are created before stage timing and Image preparation has a previously prepared plan.',
      warmImageReduction:
        'Large JPEG/WebP require real encode/decode; retained historical bounded 6-sample count rather than multiplying raster work. Treat their p95 as a small-sample maximum, not a stable tail estimate.',
      boundaries:
        'Fake repository get/list responses; real planner, serializer, Blob reads, browser decoder/encoder and native JSON request builder. No IndexedDB/extension IPC/clipboard/native process/paste/destination timing.',
      firstOnlyDistribution:
        'Runs 2–5 intentionally have zero warm samples; use coldRawMs only, ignoring their empty warm summaries.',
    },
    runs,
  };
  await mkdir(resultDirectory, { recursive: true });
  const destination = new URL(
    `./results/m14-q-delivery-${process.argv[2] ?? 'a'}.json`,
    import.meta.url,
  );
  await writeFile(destination, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${fileURLToPath(destination)}\n`);
} finally {
  await browser?.close();
  await server.close();
}
