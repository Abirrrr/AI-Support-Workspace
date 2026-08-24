import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

const nativeDevelopment = JSON.parse(
  await readFile(
    resolve('config/native-clipboard-companion.development.json'),
    'utf8',
  ),
);
const nativeDevelopmentMode = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1] === 'native-dev'
  : false;
const outputDirectory = resolve(
  nativeDevelopmentMode
    ? '.output/chrome-mv3-native-dev'
    : '.output/chrome-mv3',
);
const manifestPath = resolve(outputDirectory, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, 'AI Support Workspace');
assert.deepEqual(
  manifest.permissions ?? [],
  nativeDevelopmentMode
    ? ['sidePanel', 'activeTab', 'scripting', 'storage']
    : ['sidePanel', 'activeTab', 'scripting'],
);
assert.deepEqual(manifest.optional_permissions ?? [], [
  'clipboardWrite',
  'offscreen',
  'nativeMessaging',
]);
if (nativeDevelopmentMode) {
  assert.equal(manifest.key, nativeDevelopment.manifestKey);
  const publicKey = Buffer.from(manifest.key, 'base64');
  const digest = createHash('sha256').update(publicKey).digest();
  const alphabet = 'abcdefghijklmnop';
  let derivedId = '';
  for (const byte of digest.subarray(0, 16)) {
    derivedId += alphabet[byte >> 4] + alphabet[byte & 15];
  }
  assert.equal(derivedId, nativeDevelopment.extensionId);
  assert.equal(
    `chrome-extension://${derivedId}/`,
    nativeDevelopment.extensionOrigin,
  );
} else {
  assert.equal('key' in manifest, false);
}
assert.deepEqual(manifest.host_permissions ?? [], [
  'http://*/*',
  'https://*/*',
]);
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
assert.equal(manifest.permissions.includes('storage'), nativeDevelopmentMode);
assert.equal(manifest.permissions.includes('clipboardRead'), false);
assert.equal(manifest.permissions.includes('nativeMessaging'), false);
assert.equal(manifest.permissions.includes('debugger'), false);
assert.equal(manifest.permissions.includes('clipboardWrite'), false);
assert.equal(manifest.permissions.includes('offscreen'), false);
assert.equal(manifest.optional_permissions.includes('clipboardRead'), false);
assert.equal(manifest.optional_permissions.includes('nativeMessaging'), true);
assert.equal(manifest.optional_permissions.includes('debugger'), false);
assert.equal(manifest.host_permissions.includes('<all_urls>'), false);
assert.equal(
  manifest.host_permissions.some((match) => match.startsWith('file:')),
  false,
);

const serviceWorker = manifest.background?.service_worker;
const popupPage = manifest.action?.default_popup;
const optionsPage = manifest.options_ui?.page;
const sidePanelPage = manifest.side_panel?.default_path;
const offscreenPage = 'offscreen.html';

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
    offscreenPage,
    manifest.content_scripts[0].js[0],
  ].map((relativePath) => access(resolve(outputDirectory, relativePath))),
);
await assert.rejects(access(resolve(outputDirectory, 'workspace.html')));

const serviceWorkerSource = await readFile(
  resolve(outputDirectory, serviceWorker),
  'utf8',
);
if (nativeDevelopmentMode) {
  assert.match(serviceWorkerSource, /sendNativeMessage/);
  assert.match(serviceWorkerSource, new RegExp(nativeDevelopment.hostName));
} else {
  assert.doesNotMatch(
    serviceWorkerSource,
    new RegExp(nativeDevelopment.hostName),
  );
}
assert.match(serviceWorkerSource, /onInstalled/);
assert.match(serviceWorkerSource, /onStartup/);
assert.match(serviceWorkerSource, /executeScript/);
assert.match(serviceWorkerSource, /content_scripts/);

const offscreenHtml = await readFile(
  resolve(outputDirectory, offscreenPage),
  'utf8',
);
const offscreenScriptPath = offscreenHtml.match(
  /<script[^>]+src="\/([^"]*offscreen[^"]*\.js)"/,
)?.[1];
assert.equal(typeof offscreenScriptPath, 'string');
const offscreenScriptSource = await readFile(
  resolve(outputDirectory, offscreenScriptPath),
  'utf8',
);
assert.doesNotMatch(
  offscreenScriptSource,
  /navigator\.clipboard|clipboard\.write|ClipboardItem/,
);
assert.doesNotMatch(
  offscreenScriptSource,
  /setData\(["']image\/png|createElement\(["']img["']|contenteditable/,
);
assert.doesNotMatch(
  offscreenScriptSource,
  /snippet\.png|image\/png|encodedBytesBase64|createImageBitmap|toBlob|\.items\.add/,
);
assert.match(offscreenScriptSource, /text\/plain/);
assert.match(offscreenScriptSource, /text\/html/);
assert.match(offscreenScriptSource, /execCommand/);
assert.match(offscreenScriptSource, /addEventListener/);
assert.match(offscreenScriptSource, /removeEventListener/);

const contentScriptSource = await readFile(
  resolve(outputDirectory, manifest.content_scripts[0].js[0]),
  'utf8',
);
assert.doesNotMatch(
  contentScriptSource,
  /chrome\.storage|localStorage|indexedDB|Dexie/,
);
assert.match(contentScriptSource, /sendMessage/);
assert.match(
  contentScriptSource,
  /__aiSupportWorkspaceSnippetContentRuntimeV1/,
);
assert.doesNotMatch(contentScriptSource, /indexedDB|Dexie/);
assert.doesNotMatch(
  contentScriptSource,
  /m14-i-1-5-image-clipboard-probe|M14-I\.1\.5|navigator\.clipboard|ClipboardItem/,
);

const optionsHtml = await readFile(
  resolve(outputDirectory, optionsPage),
  'utf8',
);
const optionsScriptPath = optionsHtml.match(
  /<script[^>]+src="\/([^"]*options[^"]*\.js)"/,
)?.[1];
assert.equal(typeof optionsScriptPath, 'string');
const optionsScriptSource = await readFile(
  resolve(outputDirectory, optionsScriptPath),
  'utf8',
);
const generatedJavaScriptPaths = (
  await readdir(outputDirectory, { recursive: true })
)
  .filter((relativePath) => relativePath.endsWith('.js'))
  .map((relativePath) => resolve(outputDirectory, relativePath));
const generatedJavaScript = (
  await Promise.all(
    generatedJavaScriptPaths.map((path) => readFile(path, 'utf8')),
  )
).join('\n');
if (nativeDevelopmentMode) {
  assert.match(
    generatedJavaScript,
    /native-dev-selected-folder-backup-feasibility-v1/,
  );
  assert.match(
    generatedJavaScript,
    /native-dev-selected-folder-background-round-trip/,
  );
  assert.match(
    generatedJavaScript,
    /ai-support-workspace-selected-folder-feasibility-v1/,
  );
  assert.match(generatedJavaScript, /aiSupportWorkspaceDiagnostics/);
  assert.match(generatedJavaScript, /diagnoseSnippetListSerialization/);
  assert.match(generatedJavaScript, /getAutomaticPasteResult/);
  assert.match(generatedJavaScript, /getAutomaticPasteTrace/);
  assert.match(
    generatedJavaScript,
    /native-dev-automatic-paste-result-diagnostic/,
  );
  assert.match(generatedJavaScript, /native-dev-automatic-paste-trace/);
  assert.match(
    generatedJavaScript,
    /native-dev-automatic-paste-activation-trace/,
  );
  assert.match(
    generatedJavaScript,
    /native-dev-automatic-paste-post-cleanup-trace/,
  );
  assert.match(generatedJavaScript, /postCleanupFailure/);
  assert.match(generatedJavaScript, /noticePhase/);
  assert.match(generatedJavaScript, /cleanupInputProvenance/);
  assert.match(generatedJavaScript, /firstInvalidatingInputPhase/);
  assert.match(generatedJavaScript, /activationBeforeInputPrevented/);
  assert.match(generatedJavaScript, /activationInputObserved/);
  assert.match(generatedJavaScript, /externalInputTrusted/);
  assert.match(generatedJavaScript, /externalInputType/);
  assert.match(generatedJavaScript, /externalInputSameEditor/);
  assert.match(generatedJavaScript, /externalInputSameRoot/);
  assert.match(generatedJavaScript, /externalInputComposed/);
  assert.match(generatedJavaScript, /externalInputSameActivationTask/);
  assert.match(generatedJavaScript, /externalInputRelativePhase/);
  assert.match(generatedJavaScript, /externalInputSequenceRelation/);
  assert.match(generatedJavaScript, /nativePasteDiagnostic/);
  assert.match(generatedJavaScript, /sendInputRequestedCount/);
  assert.match(generatedJavaScript, /sendInputInsertedCount/);
  assert.match(generatedJavaScript, /sendInputStructSize/);
  assert.match(generatedJavaScript, /sendInputLastError/);
  assert.match(generatedJavaScript, /foregroundValidationPassed/);
  assert.match(generatedJavaScript, /rootWindowValidationPassed/);
  assert.match(generatedJavaScript, /pidValidationPassed/);
  assert.match(generatedJavaScript, /clipboardSequenceValidationPassed/);
  assert.match(generatedJavaScript, /modifierValidationPassed/);
  assert.match(generatedJavaScript, /hostSessionMatchesTarget/);
  assert.match(generatedJavaScript, /hostIntegrityRelation/);
} else {
  assert.doesNotMatch(
    generatedJavaScript,
    /native-dev-selected-folder-backup-feasibility-v1/,
  );
  assert.doesNotMatch(
    generatedJavaScript,
    /native-dev-selected-folder-background-round-trip/,
  );
  assert.doesNotMatch(
    generatedJavaScript,
    /ai-support-workspace-selected-folder-feasibility-v1/,
  );
  assert.doesNotMatch(generatedJavaScript, /aiSupportWorkspaceDiagnostics/);
  assert.doesNotMatch(generatedJavaScript, /diagnoseSnippetListSerialization/);
  assert.doesNotMatch(generatedJavaScript, /getAutomaticPasteResult/);
  assert.doesNotMatch(generatedJavaScript, /getAutomaticPasteTrace/);
  assert.doesNotMatch(
    generatedJavaScript,
    /native-dev-automatic-paste-result-diagnostic/,
  );
  assert.doesNotMatch(generatedJavaScript, /native-dev-automatic-paste-trace/);
  assert.doesNotMatch(
    generatedJavaScript,
    /native-dev-automatic-paste-activation-trace/,
  );
  assert.doesNotMatch(
    generatedJavaScript,
    /native-dev-automatic-paste-post-cleanup-trace/,
  );
  assert.doesNotMatch(generatedJavaScript, /postCleanupFailure/);
  assert.doesNotMatch(generatedJavaScript, /postCleanupChecks/);
  assert.doesNotMatch(generatedJavaScript, /firstInvalidationCause/);
  assert.doesNotMatch(generatedJavaScript, /noticePhase/);
  assert.doesNotMatch(generatedJavaScript, /cleanupInputProvenance/);
  assert.doesNotMatch(generatedJavaScript, /firstInvalidatingInputPhase/);
  assert.doesNotMatch(generatedJavaScript, /activationBeforeInputPrevented/);
  assert.doesNotMatch(generatedJavaScript, /activationInputObserved/);
  assert.doesNotMatch(generatedJavaScript, /externalInputTrusted/);
  assert.doesNotMatch(generatedJavaScript, /externalInputType/);
  assert.doesNotMatch(generatedJavaScript, /externalInputSameEditor/);
  assert.doesNotMatch(generatedJavaScript, /externalInputSameRoot/);
  assert.doesNotMatch(generatedJavaScript, /externalInputComposed/);
  assert.doesNotMatch(generatedJavaScript, /externalInputSameActivationTask/);
  assert.doesNotMatch(generatedJavaScript, /externalInputRelativePhase/);
  assert.doesNotMatch(generatedJavaScript, /externalInputSequenceRelation/);
  assert.doesNotMatch(generatedJavaScript, /nativePasteDiagnostic/);
  assert.doesNotMatch(generatedJavaScript, /sendInputRequestedCount/);
  assert.doesNotMatch(generatedJavaScript, /sendInputInsertedCount/);
  assert.doesNotMatch(generatedJavaScript, /sendInputStructSize/);
  assert.doesNotMatch(generatedJavaScript, /sendInputLastError/);
  assert.doesNotMatch(generatedJavaScript, /foregroundValidationPassed/);
  assert.doesNotMatch(generatedJavaScript, /rootWindowValidationPassed/);
  assert.doesNotMatch(generatedJavaScript, /pidValidationPassed/);
  assert.doesNotMatch(generatedJavaScript, /clipboardSequenceValidationPassed/);
  assert.doesNotMatch(generatedJavaScript, /modifierValidationPassed/);
  assert.doesNotMatch(generatedJavaScript, /hostSessionMatchesTarget/);
  assert.doesNotMatch(generatedJavaScript, /hostIntegrityRelation/);
}
const packagedRuntimeSource = [
  serviceWorkerSource,
  offscreenScriptSource,
  contentScriptSource,
  optionsScriptSource,
].join('\n');
assert.doesNotMatch(
  packagedRuntimeSource,
  /#m14-i-1-5-image-clipboard-probe|m14-i-1-5-image-clipboard-probe|M14-I\.1\.5/,
);
assert.doesNotMatch(
  packagedRuntimeSource,
  /snippet\.png|clipboardData\.items\.add|\.items\.add\(/,
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
assert.match(generatedCss, /\.overflow-x-hidden\{/);
assert.match(generatedCss, /\.max-w-full\{/);
