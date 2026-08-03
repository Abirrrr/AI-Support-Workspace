import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve('.output/chrome-mv3');
const manifestPath = resolve(outputDirectory, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, 'AI Support Workspace');
assert.deepEqual(manifest.permissions ?? [], [
  'sidePanel',
  'activeTab',
  'scripting',
]);
assert.deepEqual(manifest.host_permissions ?? [], ['http://localhost/*']);
assert.deepEqual(manifest.side_panel, { default_path: 'sidepanel.html' });
assert.equal('sidebar_action' in manifest, false);
assert.deepEqual(manifest.commands, {
  'capture-selection-to-workspace': {
    description: 'Capture selected text in AI Support Workspace',
    suggested_key: {
      default: 'Ctrl+Shift+Space',
      mac: 'Command+Shift+Space',
    },
  },
});
assert.equal(
  'global' in manifest.commands['capture-selection-to-workspace'],
  false,
);
assert.equal('devtools_page' in manifest, false);
assert.equal(manifest.permissions.includes('tabs'), false);
assert.equal(manifest.permissions.includes('storage'), false);
assert.equal(manifest.permissions.includes('clipboardRead'), false);
assert.equal(manifest.permissions.includes('clipboardWrite'), false);
assert.equal(manifest.host_permissions.includes('<all_urls>'), false);
assert.equal(
  manifest.host_permissions.some((match) => match.startsWith('file:')),
  false,
);

const serviceWorker = manifest.background?.service_worker;
const popupPage = manifest.action?.default_popup;
const optionsPage = manifest.options_ui?.page;
const sidePanelPage = manifest.side_panel?.default_path;

assert.equal(typeof serviceWorker, 'string');
assert.equal(typeof popupPage, 'string');
assert.equal(typeof optionsPage, 'string');
assert.equal(sidePanelPage, 'sidepanel.html');
assert.equal(manifest.content_scripts?.length, 1);
assert.deepEqual(manifest.content_scripts[0].matches, [
  'http://*/*',
  'https://*/*',
]);
assert.equal(manifest.content_scripts[0].all_frames, true);
assert.equal('match_about_blank' in manifest.content_scripts[0], false);
assert.equal('match_origin_as_fallback' in manifest.content_scripts[0], false);
assert.equal(manifest.content_scripts[0].matches.includes('<all_urls>'), false);
assert.equal(
  manifest.content_scripts[0].matches.some((match) =>
    match.startsWith('file:'),
  ),
  false,
);
assert.equal(
  manifest.content_scripts[0].matches.includes('https://example.com/*'),
  false,
);
assert.equal(
  manifest.content_scripts[0].matches.includes('https://app.intercom.com/*'),
  false,
);
assert.equal(manifest.content_scripts[0].js.length, 1);

await Promise.all(
  [
    serviceWorker,
    popupPage,
    optionsPage,
    sidePanelPage,
    manifest.content_scripts[0].js[0],
  ].map((relativePath) => access(resolve(outputDirectory, relativePath))),
);
await assert.rejects(access(resolve(outputDirectory, 'workspace.html')));

const contentScriptSource = await readFile(
  resolve(outputDirectory, manifest.content_scripts[0].js[0]),
  'utf8',
);
assert.doesNotMatch(
  contentScriptSource,
  /chrome\.storage|localStorage|indexedDB|Dexie/,
);
assert.doesNotMatch(contentScriptSource, /sendMessage/);

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
assert.match(generatedCss, /\.overflow-x-hidden\{/);
assert.match(generatedCss, /\.max-w-full\{/);
