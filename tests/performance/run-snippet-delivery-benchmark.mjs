import { chromium } from '@playwright/test';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { createServer } from 'vite';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const server = await createServer({
  root: repositoryRoot,
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0, strictPort: false },
});
let browser;
try {
  await server.listen();
  const benchmarkUrl = new URL(
    'tests/performance/snippet-delivery-benchmark.html',
    server.resolvedUrls?.local[0],
  ).href;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(benchmarkUrl);
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
  process.stdout.write(`${JSON.stringify(outcome.result, null, 2)}\n`);
} finally {
  await browser?.close();
  await server.close();
}
