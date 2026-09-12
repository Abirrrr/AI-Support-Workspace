import process from 'node:process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { summarizeSamples, measureScroll } from './m14-q-measurement.mjs';
import { originalSynthetic, synthetic } from './m14-q-browser-fixture.mjs';

assert.deepEqual(summarizeSamples([]), {
  status: 'not-measured',
  n: 0,
  samplesMs: [],
});
assert.deepEqual(summarizeSamples([0]), {
  status: 'measured',
  n: 1,
  samplesMs: [0],
  minMs: 0,
  medianMs: 0,
  meanMs: 0,
  maxMs: 0,
});
assert.equal(summarizeSamples([7]).medianMs, 7);
const many = summarizeSamples(Array.from({ length: 30 }, (_, i) => 30 - i));
assert.equal(many.n, 30);
assert.equal(many.minMs, 1);
assert.equal(many.medianMs, 15);
assert.equal(many.meanMs, 15.5);
assert.equal(many.p95Ms, 29);
assert.equal(many.maxMs, 30);
assert.throws(() => summarizeSamples([NaN]), TypeError);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(originalSynthetic);
  const originalBounds = await page.locator('#rich').boundingBox();
  assert.equal(originalBounds.height, 0);
  process.stdout.write(
    `Original rich fixture bounds: ${JSON.stringify(originalBounds)}\n`,
  );
  await page.setContent(synthetic);
  for (const target of ['#input', '#textarea', '#rich', '#shadow >> #inner']) {
    const locator = page.locator(target);
    await locator.click();
    await locator.fill('');
    await locator.pressSequentially('ordinary text ');
    assert.ok((await locator.boundingBox()).height > 0);
  }
  process.stdout.write(
    'PASS: corrected light/shadow editable fixtures are visible and accept typing.\n',
  );
  await page.setContent(
    '<!doctype html><style>body { margin:0; height:4000px }</style>',
  );
  for (let i = 0; i < 3; i++) {
    const result = await page.evaluate(measureScroll);
    assert.equal(result.status, 'measured');
    assert.equal(result.startY, 0);
    assert.equal(result.endY, 600);
    assert.ok(result.ms >= 0);
  }
  await page.setContent('<!doctype html><style>body { margin:0 }</style>');
  const skipped = await page.evaluate(measureScroll);
  assert.equal(skipped.status, 'not-measured');
  assert.equal('ms' in skipped, false);
  process.stdout.write(
    'PASS: zero/one/multiple/actual-zero samples; invalid sample rejected; 3 repeated verified scrolls; non-scrollable unavailable.\n',
  );
} finally {
  await browser.close();
}
