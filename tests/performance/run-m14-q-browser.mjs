/* global performance, URL, requestAnimationFrame, indexedDB, OffscreenCanvas, TextEncoder, document, HTMLInputElement, Event, setTimeout, chrome, DataTransfer, File, MutationObserver, clearTimeout */
import { Buffer } from 'node:buffer';
import { synthetic } from './m14-q-browser-fixture.mjs';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import {
  summarizeSamples as distribution,
  measureScroll,
} from './m14-q-measurement.mjs';

// Opt-in diagnostics only. Chromium owns and removes its disposable profile.
// No permissions are granted, clipboard API invoked, or native host contacted.
const out = resolve('tests/performance/results');
await mkdir(out, { recursive: true });
const batch = process.argv[2] ?? 'a';
const outputLabel = process.argv[3] ?? batch;
const outputPath = `${out}/m14-q-browser-${outputLabel}.json`;
try {
  await access(outputPath);
  throw new Error(
    `Refusing to overwrite ${outputPath}; pass a fresh output label`,
  );
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const report = {
  batch,
  started: new Date().toISOString(),
  failures: [],
  tiers: [],
  typing: [],
  lifecycle: [],
};
const extensionPath = resolve('.output/chrome-mv3');
const ownedContexts = [];
const server = createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html');
  response.end(synthetic);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;

async function launch(extension = true) {
  const start = performance.now();
  const context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    args: extension
      ? [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
        ]
      : [],
  });
  ownedContexts.push(context);
  if (!extension) return { context, launchMs: performance.now() - start };
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker'));
  const id = new URL(worker.url()).host;
  return { context, worker, id, launchMs: performance.now() - start };
}
async function ready(page, url, selector) {
  await page.goto(url);
  await page.locator(selector).waitFor();
  return page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    return performance.now();
  });
}
async function seed(page, count, mixed = false) {
  return page.evaluate(
    async ({ count, mixed }) => {
      const request = indexedDB.open('ai-support-workspace');
      const db = await new Promise((ok, no) => {
        request.onsuccess = () => ok(request.result);
        request.onerror = () => no(request.error);
      });
      const date = '2026-09-01T00:00:00.000Z';
      const id = (n) =>
        `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
      const records = Array.from({ length: count }, (_, n) => ({
        id: id(n + 1),
        title: `Audit response ${String(n).padStart(5, '0')} ${n === 7 ? 'rareterm' : 'common'}`,
        content:
          n % 4
            ? {
                kind: 'plain',
                text:
                  n % 3
                    ? 'Thank you. We can help. ধন্যবাদ café 😊'
                    : 'Longer support reply with Unicode ধন্যবাদ café 😊. '.repeat(
                        80,
                      ),
              }
            : {
                kind: 'rich',
                blocks: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        text: 'Support reply ধন্যবাদ ',
                        bold: true,
                        italic: false,
                      },
                      {
                        type: 'link',
                        text: 'Help',
                        url: 'https://example.com/help',
                        bold: false,
                        italic: false,
                      },
                    ],
                  },
                  {
                    type: 'list',
                    listType: 'unordered',
                    items: [
                      {
                        children: [
                          {
                            type: 'text',
                            text: 'First step',
                            bold: false,
                            italic: false,
                          },
                        ],
                      },
                      {
                        children: [
                          {
                            type: 'text',
                            text: 'Second step',
                            bold: false,
                            italic: false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
        tags: ['support', 'common'],
        trigger: `;audit-${n}`,
        createdAt: date,
        updatedAt: date,
      }));
      const assets = [];
      if (mixed)
        for (let n = 0; n < 9; n++) {
          const canvas = new OffscreenCanvas(64, 64);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = `rgb(${n * 25},100,150)`;
          ctx.fillRect(0, 0, 64, 64);
          const mimeType = ['image/png', 'image/jpeg', 'image/webp'][n % 3];
          const blob = await canvas.convertToBlob({
            type: mimeType,
            quality: 0.88,
          });
          canvas.width = 0;
          canvas.height = 0;
          const snippetId = id(20001 + n);
          const assetId = id(30001 + n);
          records.push({
            id: snippetId,
            title: `Audit image ${n}`,
            content: { kind: 'image', assetId },
            tags: [],
            trigger: `;image-${n}`,
            createdAt: date,
            updatedAt: date,
          });
          assets.push({
            id: assetId,
            snippetId,
            mimeType,
            blob,
            byteSize: blob.size,
            originalFilename: null,
            createdAt: date,
          });
        }
      const tx = db.transaction(
        [
          'snippetEntries',
          'snippetAssets',
          'snippetUsageStats',
          'snippetGeneratedMetadata',
        ],
        'readwrite',
      );
      for (const name of [
        'snippetEntries',
        'snippetAssets',
        'snippetUsageStats',
        'snippetGeneratedMetadata',
      ])
        tx.objectStore(name).clear();
      for (const record of records)
        tx.objectStore('snippetEntries').put(record);
      for (const asset of assets) tx.objectStore('snippetAssets').put(asset);
      for (const record of records)
        tx.objectStore('snippetUsageStats').put({
          snippetId: record.id,
          usageCount: 7,
          lastUsedAt: date,
        });
      await new Promise((ok, no) => {
        tx.oncomplete = ok;
        tx.onerror = () => no(tx.error);
      });
      db.close();
      return {
        count: records.length,
        textCount: count,
        imageCount: assets.length,
        recordJsonBytes: new TextEncoder().encode(JSON.stringify(records))
          .length,
        imageBytes: assets.reduce((sum, a) => sum + a.byteSize, 0),
        images: assets.map((a) => ({
          mimeType: a.mimeType,
          bytes: a.byteSize,
          width: 64,
          height: 64,
        })),
        seed: 'index-based v1; fixed 2026-09-01; four-way rich/plain/long/Unicode',
      };
    },
    { count, mixed },
  );
}
let activeCount = 0;
const metricSessions = new WeakMap();
async function metric(page, gc = false) {
  let cdp = metricSessions.get(page);
  if (!cdp) {
    cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    metricSessions.set(page, cdp);
  }
  if (gc) await cdp.send('HeapProfiler.collectGarbage');
  const [{ metrics }, dom] = await Promise.all([
    cdp.send('Performance.getMetrics'),
    cdp.send('Memory.getDOMCounters'),
  ]);
  const liveElements = await page.evaluate(
    () => document.querySelectorAll('*').length,
  );
  return {
    liveElements,
    ...Object.fromEntries(
      metrics
        .filter((x) =>
          [
            'JSHeapUsedSize',
            'JSHeapTotalSize',
            'TaskDuration',
            'ScriptDuration',
            'LayoutDuration',
            'Nodes',
            'JSEventListeners',
          ].includes(x.name),
        )
        .map((x) => [x.name, x.value]),
    ),
    ...dom,
  };
}
async function action(page, selector, type = 'click', value = '', until = '') {
  return page.evaluate(
    async ({ selector, type, value, until }) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`No action target ${selector}`);
      const start = performance.now();
      if (type === 'fill') {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value',
        ).set.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else element.click();
      let frames = 0;
      do {
        await new Promise(requestAnimationFrame);
        frames++;
        if (performance.now() - start > 20000)
          throw new Error(`Action timed out ${selector} -> ${until}`);
      } while (frames < 2 || (until && !document.querySelector(until)));
      return performance.now() - start;
    },
    { selector, type, value, until },
  );
}
async function sample(operation, n = activeCount === 10000 ? 3 : 30) {
  const values = [];
  for (let i = 0; i < n; i++) {
    try {
      values.push(await operation(i));
    } catch (error) {
      error.auditCompletedSamplesMs = values;
      throw error;
    }
  }
  return distribution(values);
}

try {
  if (batch === 'smoke') {
    const run = await launch();
    report.browser = await run.context.browser()?.version();
    report.extensionId = run.id;
    const page = await run.context.newPage();
    report.readyMs = await ready(
      page,
      `chrome-extension://${run.id}/options.html`,
      '#snippet-search',
    );
    await run.context.close();
  } else if (batch === 'image-edit') {
    const run = await launch();
    const page = await run.context.newPage();
    const options = `chrome-extension://${run.id}/options.html`;
    await ready(page, options, '#snippet-search');
    const fixture = await seed(page, 1000, true);
    await ready(page, options, '#snippet-search');
    report.note =
      'Supplemental missing Image Edit latency only; 1000 Text + nine 64x64 Images; no repeat of completed Text/search/navigation distributions.';
    const row = { tier: 'mixed-image-edit', fixture };
    report.tiers.push(row);
    row.imageEdit = await sample(async () => {
      const ms = await page.evaluate(async () => {
        const start = performance.now();
        document
          .querySelector(
            '[data-snippet-id="00000000-0000-4000-8000-000000020001"] [aria-label="Edit Snippet"]',
          )
          .click();
        let frames = 0;
        do {
          await new Promise(requestAnimationFrame);
          frames++;
          if (performance.now() - start > 20000)
            throw new Error('Image Edit preview timeout');
        } while (
          frames < 2 ||
          !document.querySelector('form img')?.complete ||
          document.querySelector('form img')?.naturalWidth !== 64
        );
        return performance.now() - start;
      });
      await action(page, 'form button[type="button"]');
      return ms;
    }, 30);
    await run.context.close();
  } else if (batch === 'profile') {
    report.note =
      'Separate diagnostic metrics pass; excludes these samples from uninstrumented UI distributions. Task/Script/Layout counters share one CDP session per page.';
    for (const count of [1000, 10000]) {
      const run = await launch();
      const page = await run.context.newPage();
      const options = `chrome-extension://${run.id}/options.html`;
      await ready(page, options, '#snippet-search');
      const fixture = await seed(page, count);
      await ready(page, options, '#snippet-search');
      const row = { tier: count, fixture, operations: [] };
      report.tiers.push(row);
      await metric(page);
      for (const query of ['common', 'rareterm', 'zzznomatch']) {
        for (let i = 0; i < 3; i++) {
          await action(
            page,
            '#snippet-search',
            'fill',
            query === 'common' ? 'zzznomatch' : '',
          );
          const before = await metric(page);
          const ms = await action(page, '#snippet-search', 'fill', query);
          const after = await metric(page);
          row.operations.push({
            query,
            ms,
            before,
            after,
            deltaMs: Object.fromEntries(
              ['TaskDuration', 'ScriptDuration', 'LayoutDuration'].map(
                (key) => [key, (after[key] - before[key]) * 1000],
              ),
            ),
          });
          await writeFile(outputPath, JSON.stringify(report, null, 2));
        }
      }
      await run.context.close();
    }
  } else {
    // Five independently launched profiles per tier; seed/setup excluded from UI navigation clock.
    for (const tier of batch.startsWith('lifecycle')
      ? []
      : batch === 'mixed'
        ? ['mixed']
        : batch === 'repeat'
          ? [1000, 10000]
          : [0, 100, 1000, 10000, 'mixed']) {
      const count = tier === 'mixed' ? 1000 : tier;
      activeCount = count;
      const row = {
        tier,
        coldOptions: [],
        coldPanel: [],
        launches: [],
        initialEmptyOptions: [],
      };
      report.tiers.push(row);
      for (let cold = 0; cold < 5; cold++) {
        const run = await launch();
        report.browser = await run.context.browser()?.version();
        row.launches.push(run.launchMs);
        const page = await run.context.newPage();
        const options = `chrome-extension://${run.id}/options.html`;
        const panel = `chrome-extension://${run.id}/sidepanel.html`;
        row.initialEmptyOptions.push(
          await ready(page, options, '#snippet-search'),
        );
        row.fixture = await seed(page, count, tier === 'mixed');
        row.coldOptions.push(await ready(page, options, '#snippet-search'));
        row.coldPanel.push(await ready(page, panel, '#merchant-context'));
        if (cold === 4) {
          await ready(page, options, '#snippet-search');
          row.warmOptions = await sample(
            () => ready(page, options, '#snippet-search'),
            count === 10000 ? 3 : 30,
          );
          row.dom = await metric(page);
          row.frameWaitControl = await sample(() => action(page, 'body'));
          row.warmPanel = await sample(() =>
            ready(page, panel, '#merchant-context'),
          );
          await ready(page, options, '#snippet-search');
          await action(page, '#snippet-search', 'fill', 'common');
          await action(page, '#snippet-search', 'fill', '');
          row.searchNoMatch = await sample(async () => {
            await action(page, '#snippet-search', 'fill', '');
            return action(page, '#snippet-search', 'fill', 'zzznomatch');
          });
          row.searchCommon = await sample(async () => {
            await action(page, '#snippet-search', 'fill', 'zzznomatch');
            return action(page, '#snippet-search', 'fill', 'common');
          });
          row.searchRare = await sample(async () => {
            await action(page, '#snippet-search', 'fill', '');
            return action(page, '#snippet-search', 'fill', 'rareterm');
          });
          await action(page, '#snippet-search', 'fill', '');
          row.typeFilterImages = await sample(async () => {
            await action(
              page,
              '[aria-label="Snippet type filter"] button:first-child',
            );
            return action(
              page,
              '[aria-label="Snippet type filter"] button:last-child',
            );
          });
          await action(
            page,
            '[aria-label="Snippet type filter"] button:first-child',
          );
          await writeFile(outputPath, JSON.stringify(report, null, 2));
          const scrollRuns = [];
          for (let i = 0; i < 30; i++)
            scrollRuns.push(await page.evaluate(measureScroll));
          row.scrolling = {
            interval:
              'scrollTo from verified y=0 to min(600,maxScroll), ending after two animation frames and verified final position; reset excluded',
            runs: scrollRuns,
            ...distribution(
              scrollRuns
                .filter((x) => x.status === 'measured')
                .map((x) => x.ms),
            ),
          };
          if (count) {
            const edit =
              '[data-snippet-id="00000000-0000-4000-8000-000000000001"] [aria-label="Edit Snippet"]';
            row.edit = await sample(
              async () => {
                const ms = await action(page, edit, 'click', '', '.tiptap');
                await action(page, 'form button[type="button"]');
                return ms;
              },
              count === 10000 ? 3 : 30,
            );
            await action(page, edit, 'click', '', '.tiptap');
            const typing = [];
            for (let i = 0; i < 30; i++) {
              const t = performance.now();
              await page.locator('.tiptap').press('a');
              typing.push(performance.now() - t);
            }
            row.editorTypingProtocol = distribution(typing);
            row.save = await sample(
              async (i) => {
                if (i) await action(page, edit, 'click', '', '.tiptap');
                return page.evaluate(async () => {
                  const t = performance.now();
                  document.querySelector('form button[type="submit"]').click();
                  while (document.querySelector('form')) {
                    await new Promise(requestAnimationFrame);
                    if (performance.now() - t > 20000)
                      throw new Error('Save timeout');
                  }
                  await new Promise(requestAnimationFrame);
                  return performance.now() - t;
                });
              },
              count === 10000 ? 3 : 30,
            );
            const del =
              '[data-snippet-id="00000000-0000-4000-8000-000000000002"] [aria-label="Delete Snippet"]';
            await action(page, del, 'click', '', '[role="dialog"]');
            row.confirmedDeleteMs = await page.evaluate(async () => {
              const t = performance.now();
              [...document.querySelectorAll('[role="dialog"] button')]
                .find((x) => x.textContent.trim() === 'Delete')
                .click();
              while (document.querySelector('[role="dialog"]'))
                await new Promise(requestAnimationFrame);
              return performance.now() - t;
            });
          }
          if (tier === 'mixed') {
            row.imageDecodeStatus = await page
              .locator('img')
              .evaluateAll((xs) =>
                xs.map((x) => ({
                  complete: x.complete,
                  width: x.naturalWidth,
                  height: x.naturalHeight,
                })),
              );
          }
          row.after = await metric(page);
        }
        await run.context.close();
      }
      await writeFile(outputPath, JSON.stringify(report, null, 2));
      process.stdout.write(`tier ${tier} finished\n`);
    }
    activeCount = 0;
    if (batch !== 'repeat' && batch !== 'mixed') {
      // No-extension control and real static content scripts. Only ordinary/unknown typing.
      for (const enabled of [false, true]) {
        const run = await launch(enabled);
        const page = await run.context.newPage();
        await page.goto(base);
        for (const target of [
          '#input',
          '#textarea',
          '#rich',
          '#shadow >> #inner',
        ]) {
          const locator = page.locator(target);
          await locator.click();
          for (const text of ['ordinary text ', ';unknown ']) {
            await locator.fill('');
            await locator.pressSequentially(text);
            const times = [];
            for (let i = 0; i < 30; i++) {
              await locator.fill('');
              const t = performance.now();
              await locator.pressSequentially(text);
              times.push(performance.now() - t);
            }
            report.typing.push({
              extension: enabled,
              target,
              text,
              protocolRoundtrip: distribution(times),
            });
          }
        }
        const before = await metric(page);
        await new Promise((done) => setTimeout(done, 10000));
        const after = await metric(page);
        report.typing.push({
          extension: enabled,
          idleSeconds: 10,
          before,
          after,
        });
        await run.context.close();
        await writeFile(outputPath, JSON.stringify(report, null, 2));
      }
      // Separate instrumented lifecycle batch; object URLs counted only here.
      const run = await launch();
      const page = await run.context.newPage();
      const options = `chrome-extension://${run.id}/options.html`;
      await page.addInitScript(() => {
        const active = new Set();
        const create = URL.createObjectURL.bind(URL);
        const revoke = URL.revokeObjectURL.bind(URL);
        URL.createObjectURL = (b) => {
          const u = create(b);
          active.add(u);
          return u;
        };
        URL.revokeObjectURL = (u) => {
          active.delete(u);
          revoke(u);
        };
        globalThis.__auditUrls = active;
      });
      await ready(page, options, '#snippet-search');
      await seed(page, 100, true);
      await ready(page, options, '#snippet-search');
      const grants = await page.evaluate(() => chrome.permissions.getAll());
      if (
        (grants.permissions ?? []).some((x) =>
          ['clipboardWrite', 'offscreen', 'nativeMessaging'].includes(x),
        )
      )
        throw new Error(
          'Unexpected clipboard/native permissions in disposable profile',
        );
      report.copyPermissionDeniedFeedback = await sample(() =>
        action(
          page,
          '[data-snippet-id="00000000-0000-4000-8000-000000000001"] [aria-label="Copy Snippet"]',
          'click',
          '',
          '[role="alert"]',
        ),
      );
      report.copyPermissionDeniedFeedback.note =
        'Verified no clipboard/offscreen/native permissions; failure feedback only. No real clipboard write.';
      report.lifecycle.push({
        cycle: 0,
        metrics: await metric(page, true),
        urls: await page.evaluate(() => globalThis.__auditUrls.size),
      });
      const replacement = Buffer.from(
        await page.evaluate(async () => {
          const canvas = new OffscreenCanvas(64, 64);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#123456';
          ctx.fillRect(0, 0, 64, 64);
          const blob = await canvas.convertToBlob({ type: 'image/png' });
          canvas.width = 0;
          canvas.height = 0;
          return [...new Uint8Array(await blob.arrayBuffer())];
        }),
      );
      for (let i = 1; i <= 50; i++) {
        await action(
          page,
          '[data-snippet-id="00000000-0000-4000-8000-000000020001"] [aria-label="Edit Snippet"]',
          'click',
          '',
          'form',
        );
        const oldSrc = await page.locator('form img').getAttribute('src');
        if (batch === 'lifecycle-control') {
          await page.evaluate(
            (bytes) => {
              const transfer = new DataTransfer();
              transfer.items.add(
                new File([new Uint8Array(bytes)], 'audit-replacement.png', {
                  type: 'image/png',
                }),
              );
              const input = document.querySelector('input[type="file"]');
              input.files = transfer.files;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            },
            [...replacement],
          );
        } else
          await page.locator('input[type="file"]').setInputFiles({
            name: 'audit-replacement.png',
            mimeType: 'image/png',
            buffer: replacement,
          });
        await page.waitForFunction((oldSrc) => {
          const img = document.querySelector('form img');
          return (
            img && img.src !== oldSrc && img.complete && img.naturalWidth === 64
          );
        }, oldSrc);
        await action(page, 'form button[type="button"]');
        if ([10, 25, 50].includes(i))
          report.lifecycle.push({
            cycle: i,
            metrics: await metric(page, true),
            urls: await page.evaluate(() => globalThis.__auditUrls.size),
          });
      }
      await action(page, '#snippet-search', 'fill', 'zzznomatch');
      report.lifecycle.push({
        afterThumbnailsUnmount: true,
        metrics: await metric(page, true),
        urls: await page.evaluate(() => globalThis.__auditUrls.size),
      });
      report.lifecycleMethod =
        batch === 'lifecycle-control'
          ? 'In-page File/DataTransfer change event; no Playwright setInputFiles; real unchanged ingestion, replacement and cancel'
          : 'Playwright setInputFiles; real unchanged ingestion, replacement and cancel';
      await writeFile(outputPath, JSON.stringify(report, null, 2));
      report.reopenCycles = await sample(async () => {
        const p = await run.context.newPage();
        const ms = await ready(p, options, '#snippet-search');
        await p.close();
        return ms;
      }, 50);
      // Real extension catalog IPC with one and four synthetic eligible tabs.
      report.shared = [];
      const tabs = [];
      for (const count of [1, 4]) {
        while (tabs.length < count) {
          const tab = await run.context.newPage();
          await tab.goto(base);
          tabs.push(tab);
        }
        await page.goto(options);
        await page.locator('#snippet-search').waitFor();
        const catalog = await page.evaluate(async () => {
          const port = chrome.runtime.connect({
            name: 'snippet-trigger-catalog-v1',
          });
          const samples = [];
          let entries = -1;
          for (let i = 0; i < 32; i++) {
            const start = performance.now();
            const result = await new Promise((resolve) => {
              const listener = (message) => {
                if (message.type === 'trigger-catalog-snapshot') {
                  port.onMessage.removeListener(listener);
                  resolve(message);
                }
              };
              port.onMessage.addListener(listener);
              port.postMessage({ type: 'trigger-catalog-request-snapshot' });
            });
            if (i >= 2) samples.push(performance.now() - start);
            entries = result.entries.length;
          }
          port.disconnect();
          return { samples, entries };
        });
        const reloads = [];
        for (let i = 0; i < 5; i++) {
          const start = performance.now();
          await Promise.all(tabs.map((tab) => tab.reload()));
          reloads.push(performance.now() - start);
        }
        const overlaps = [];
        for (let i = 0; i < 5; i++) {
          await action(
            page,
            '[data-snippet-id="00000000-0000-4000-8000-000000000001"] [aria-label="Edit Snippet"]',
            'click',
            '',
            '.tiptap',
          );
          const input = tabs[0].locator('#textarea');
          await input.fill('');
          const start = performance.now();
          await Promise.all([
            input.pressSequentially('ordinary support typing '),
            page.evaluate(async (control) => {
              if (control)
                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    observer.disconnect();
                    reject(new Error('Observed Save timeout'));
                  }, 20000);
                  const observer = new MutationObserver(() => {
                    if (!document.querySelector('form')) {
                      observer.disconnect();
                      clearTimeout(timeout);
                      resolve();
                    }
                  });
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                  });
                  document.querySelector('form button[type="submit"]').click();
                });
              else {
                document.querySelector('form button[type="submit"]').click();
                while (document.querySelector('form'))
                  await new Promise(requestAnimationFrame);
              }
            }, batch === 'lifecycle-control'),
          ]);
          overlaps.push(performance.now() - start);
        }
        report.shared.push({
          overlappingSaveTypingProtocol: distribution(overlaps),
          eligibleTabs: count,
          catalogIpc: distribution(catalog.samples),
          expectedEntries: 109,
          actualEntries: catalog.entries,
          concurrentReloadsProtocol: distribution(reloads),
        });
        report.overlapCompletion =
          batch === 'lifecycle-control'
            ? 'MutationObserver form removal, no animation-frame wait'
            : 'requestAnimationFrame polling; includes background-tab throttling';
        await writeFile(outputPath, JSON.stringify(report, null, 2));
      }
      report.workerRecovery = [];
      const workerControl = await run.context.newCDPSession(page);
      await workerControl.send('ServiceWorker.enable');
      for (let i = 0; i < 5; i++) {
        await workerControl.send('ServiceWorker.stopAllWorkers');
        const recovered = await page.evaluate(async () => {
          const start = performance.now();
          const port = chrome.runtime.connect({
            name: 'snippet-trigger-catalog-v1',
          });
          const snapshot = await new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error('Worker recovery timeout')),
              10000,
            );
            port.onMessage.addListener((message) => {
              if (message.type === 'trigger-catalog-snapshot') {
                clearTimeout(timeout);
                resolve(message);
              }
            });
            port.postMessage({ type: 'trigger-catalog-request-snapshot' });
          });
          const ms = performance.now() - start;
          port.disconnect();
          return {
            ms,
            entries: snapshot.entries.length,
            epoch: snapshot.epoch,
          };
        });
        report.workerRecovery.push(recovered);
      }
      await workerControl.detach();
      for (const tab of tabs) await tab.close();
      report.closedUi = { before: await metric(page) };
      await page.close();
      // Do not attach a worker debugger: closed-UI worker suspension is a manual gap.
      report.closedUi.note =
        'All UIs and synthetic tabs closed; debugger-free worker suspension timing not measured.';
      await run.context.close();
    }
  }
} catch (error) {
  report.failures.push({
    message: String(error),
    stack: error.stack,
    completedSamplesInInterruptedOperation: error.auditCompletedSamplesMs ?? [],
  });
  process.exitCode = 1;
} finally {
  report.finished = new Date().toISOString();
  await writeFile(outputPath, JSON.stringify(report, null, 2));
  for (const context of ownedContexts) await context.close();
  server.close();
}
