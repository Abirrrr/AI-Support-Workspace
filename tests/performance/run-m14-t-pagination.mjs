/* global document, Event, HTMLButtonElement, HTMLInputElement, indexedDB, performance, requestAnimationFrame, URL */
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import process from 'node:process';

const extensionPath = resolve('.output/chrome-mv3');
let context;

function metricValues(metrics) {
  return Object.fromEntries(
    metrics
      .filter(({ name }) =>
        ['TaskDuration', 'ScriptDuration', 'LayoutDuration'].includes(name),
      )
      .map(({ name, value }) => [name, value]),
  );
}

try {
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent('serviceworker'));
  const extensionId = new URL(worker.url()).host;
  const optionsUrl = `chrome-extension://${extensionId}/options.html`;
  const page = await context.newPage();
  await page.goto(optionsUrl);
  await page.locator('#snippet-search').waitFor();
  await page.evaluate(async () => {
    const request = indexedDB.open('ai-support-workspace');
    const database = await new Promise((resolveDatabase, reject) => {
      request.onsuccess = () => resolveDatabase(request.result);
      request.onerror = () => reject(request.error);
    });
    const createdAt = '2026-09-01T00:00:00.000Z';
    const id = (number) =>
      `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
    const transaction = database.transaction(
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
    ]) {
      transaction.objectStore(name).clear();
    }
    for (let index = 0; index < 10_000; index += 1) {
      transaction.objectStore('snippetEntries').put({
        id: id(index + 1),
        title: `Audit response ${String(index).padStart(5, '0')} common`,
        content: {
          kind: 'plain',
          text: 'Thank you. We can help. ধন্যবাদ café 😊',
        },
        tags: ['support', 'common'],
        trigger: `;audit-${index}`,
        createdAt,
        updatedAt: createdAt,
      });
      transaction.objectStore('snippetUsageStats').put({
        snippetId: id(index + 1),
        usageCount: 7,
        lastUsedAt: createdAt,
      });
    }
    await new Promise((resolveTransaction, reject) => {
      transaction.oncomplete = resolveTransaction;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });

  const navigationStart = performance.now();
  await page.goto(optionsUrl);
  await page.locator('#snippet-search').waitFor();
  await page.getByText('Showing 1–100 of 10000 snippets').waitFor();
  await page.evaluate(
    () => new Promise((resolveFrame) => requestAnimationFrame(resolveFrame)),
  );
  const initialNavigationMs = performance.now() - navigationStart;

  await page.locator('#snippet-search').fill('zzznomatch');
  await page.getByText('No matching snippets.').waitFor();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const before = metricValues(
    (await cdp.send('Performance.getMetrics')).metrics,
  );
  const searchCommonMs = await page.evaluate(async () => {
    const input = document.querySelector('#snippet-search');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Missing Snippet search input.');
    }
    const start = performance.now();
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    ).set.call(input, 'common');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    while (
      ![...document.querySelectorAll('p')].some((item) =>
        item.textContent?.includes('Showing 1–100 of 10000 snippets'),
      )
    ) {
      await new Promise(requestAnimationFrame);
    }
    await new Promise(requestAnimationFrame);
    return performance.now() - start;
  });
  const after = metricValues(
    (await cdp.send('Performance.getMetrics')).metrics,
  );

  const firstPage = await page.evaluate(() => ({
    matchingResults: Number(
      [...document.querySelectorAll('p')]
        .find((item) => item.textContent?.startsWith('Showing '))
        ?.textContent?.match(/of (\d+) snippets/)?.[1],
    ),
    mountedRows: document.querySelectorAll('li[data-snippet-id]').length,
    liveElements: document.querySelectorAll('*').length,
    pageText: document.querySelector('[aria-label="Snippet pages"] span')
      ?.textContent,
    firstId: document
      .querySelector('li[data-snippet-id]')
      ?.getAttribute('data-snippet-id'),
    lastId: [...document.querySelectorAll('li[data-snippet-id]')]
      .at(-1)
      ?.getAttribute('data-snippet-id'),
  }));

  const lastPage = await page.evaluate(async () => {
    for (let pageNumber = 1; pageNumber < 100; pageNumber += 1) {
      const buttons = document.querySelectorAll(
        '[aria-label="Snippet pages"] button',
      );
      const next = buttons[buttons.length - 1];
      if (!(next instanceof HTMLButtonElement) || next.disabled) {
        throw new Error(`Next unavailable from page ${pageNumber}.`);
      }
      next.click();
      await new Promise(requestAnimationFrame);
    }
    const rows = [...document.querySelectorAll('li[data-snippet-id]')];
    return {
      mountedRows: rows.length,
      pageText: document.querySelector('[aria-label="Snippet pages"] span')
        ?.textContent,
      firstId: rows[0]?.getAttribute('data-snippet-id'),
      lastId: rows.at(-1)?.getAttribute('data-snippet-id'),
    };
  });

  await page.locator('#snippet-search').fill('Audit response 09999');
  await page.getByText('Showing 1–1 of 1 snippets').waitFor();
  const offPageSearch = await page.evaluate(() => ({
    mountedRows: document.querySelectorAll('li[data-snippet-id]').length,
    id: document
      .querySelector('li[data-snippet-id]')
      ?.getAttribute('data-snippet-id'),
  }));

  assert.equal(firstPage.matchingResults, 10_000);
  assert.equal(firstPage.mountedRows, 100);
  assert.equal(firstPage.pageText, 'Page 1 of 100');
  assert.equal(firstPage.firstId, '00000000-0000-4000-8000-000000000001');
  assert.equal(firstPage.lastId, '00000000-0000-4000-8000-000000000100');
  assert.deepEqual(lastPage, {
    mountedRows: 100,
    pageText: 'Page 100 of 100',
    firstId: '00000000-0000-4000-8000-000000009901',
    lastId: '00000000-0000-4000-8000-000000010000',
  });
  assert.deepEqual(offPageSearch, {
    mountedRows: 1,
    id: '00000000-0000-4000-8000-000000010000',
  });

  process.stdout.write(
    `${JSON.stringify(
      {
        scenario: 'M14-T focused 10,000-result bounded rendering',
        chromium: context.browser()?.version(),
        initialNavigationMs,
        searchCommonMs,
        deltaMs: Object.fromEntries(
          ['TaskDuration', 'ScriptDuration', 'LayoutDuration'].map((name) => [
            name,
            (after[name] - before[name]) * 1000,
          ]),
        ),
        firstPage,
        lastPage,
        offPageSearch,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await context?.close();
}
