import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve('.output/chrome-mv3');
const manifestPath = resolve(outputDirectory, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, 'AI Support Workspace');
assert.deepEqual(manifest.permissions ?? [], []);
assert.deepEqual(manifest.host_permissions ?? [], []);
assert.equal('side_panel' in manifest, false);
assert.equal('sidebar_action' in manifest, false);
assert.equal('commands' in manifest, false);
assert.equal('devtools_page' in manifest, false);

const serviceWorker = manifest.background?.service_worker;
const popupPage = manifest.action?.default_popup;
const optionsPage = manifest.options_ui?.page;

assert.equal(typeof serviceWorker, 'string');
assert.equal(typeof popupPage, 'string');
assert.equal(typeof optionsPage, 'string');
assert.equal(manifest.content_scripts?.length, 1);
assert.deepEqual(manifest.content_scripts[0].matches, [
  'https://example.com/*',
]);
assert.equal(manifest.content_scripts[0].js.length, 1);

await Promise.all(
  [
    serviceWorker,
    popupPage,
    optionsPage,
    manifest.content_scripts[0].js[0],
  ].map((relativePath) => access(resolve(outputDirectory, relativePath))),
);

const assetFiles = await readdir(resolve(outputDirectory, 'assets'));
const stylesheetPaths = assetFiles
  .filter((fileName) => fileName.endsWith('.css'))
  .map((fileName) => resolve(outputDirectory, 'assets', fileName));

assert.ok(stylesheetPaths.length > 0);

const stylesheets = await Promise.all(
  stylesheetPaths.map((stylesheetPath) => readFile(stylesheetPath, 'utf8')),
);
const generatedCss = stylesheets.join('\n');

assert.match(generatedCss, /\.w-80\{/);
assert.match(generatedCss, /\.max-w-2xl\{/);
