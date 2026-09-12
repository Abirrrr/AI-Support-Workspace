import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';

const server = await createServer({
  root: process.cwd(),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
});
const report = {
  interval:
    'Synchronous handleSnippetBeforeInput entry to return; total ends at feedback after mocked delivery and real exact cleanup. DOM/caret/cache setup excluded. Event-shaped trusted flag uses established test boundary, not a real trusted browser event. Fake automatic response means no OS input or proof of insertion.',
  runs: [],
  errors: [],
};
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  report.browser = browser.version();
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(
        `${server.resolvedUrls.local[0]}tests/performance/m14-q-trigger.html`,
      );
      await page.waitForFunction(
        () => globalThis.m14QTriggerResult || globalThis.m14QTriggerError,
        undefined,
        { timeout: 60000 },
      );
      const result = await page.evaluate(() => ({
        result: globalThis.m14QTriggerResult,
        error: globalThis.m14QTriggerError,
      }));
      report.runs.push(result);
      if (result.error) {
        report.errors.push(result.error);
        process.exitCode = 1;
      }
    } finally {
      await context.close();
    }
  }
} catch (error) {
  report.errors.push(String(error));
  process.exitCode = 1;
} finally {
  await browser?.close();
  await server.close();
  await mkdir('tests/performance/results', { recursive: true });
  await writeFile(
    'tests/performance/results/m14-q-trigger.json',
    JSON.stringify(report, null, 2),
  );
}
