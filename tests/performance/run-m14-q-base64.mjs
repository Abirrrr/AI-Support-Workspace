/* global performance, atob */
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { writeFile, mkdir } from 'node:fs/promises';
import process from 'node:process';

const server = await createServer({
  root: process.cwd(),
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
});
const report = {
  scenario:
    'Existing opaque 1440x900 PNG, valid 4459989-byte asset; production Backup base64 decoder, real atob control; no production changes',
  contexts: [],
};
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  report.browser = browser.version();
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(
        `${server.resolvedUrls.local[0]}tests/performance/m14-q-storage.html`,
      );
      await page.waitForFunction(
        () => typeof globalThis.createM14QStorage === 'function',
      );
      const result = await page.evaluate(async () => {
        let backupError;
        try {
          await globalThis.createM14QStorage({ count: 0, mixed: true });
        } catch (error) {
          backupError = String(error);
        }
        const session = globalThis.m14QStorage;
        const asset = session.assets.find(
          (a) => a.originalFilename === '1440x900.png',
        );
        const { validateSnippetAsset } =
          await import('/src/domain/snippet-asset.ts');
        await validateSnippetAsset(asset);
        const { encodeBlobBase64, decodeCanonicalBase64 } =
          await import('/src/application/backup/base64.ts');
        const encoded = await encodeBlobBase64(asset.blob);
        const runs = [];
        for (let i = 0; i < 3; i++) {
          const start = performance.now();
          try {
            const bytes = decodeCanonicalBase64(encoded);
            runs.push({
              ms: performance.now() - start,
              outcome: 'decoded',
              bytes: bytes.length,
            });
          } catch (error) {
            runs.push({
              ms: performance.now() - start,
              outcome: 'failed',
              name: error.name,
              message: error.message,
            });
          }
        }
        const decoded = atob(encoded);
        const source = new Uint8Array(await asset.blob.arrayBuffer());
        let equal = decoded.length === source.length;
        for (let n = 0; n < source.length && equal; n++)
          if (decoded.charCodeAt(n) !== source[n]) equal = false;
        await session.close();
        return {
          backupError,
          assetValidationPassed: true,
          assetBytes: source.length,
          base64Characters: encoded.length,
          browserAtobMatchesEverySourceByte: equal,
          runs,
        };
      });
      report.contexts.push(result);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser?.close();
  await server.close();
  await mkdir('tests/performance/results', { recursive: true });
  await writeFile(
    'tests/performance/results/m14-q-base64.json',
    JSON.stringify(report, null, 2),
  );
}
