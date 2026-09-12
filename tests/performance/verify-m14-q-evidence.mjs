import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = 'tests/performance/results';
const readJson = async (path) =>
  JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function inventory(path) {
  const rows = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = `${path}/${entry.name}`;
    if (entry.isDirectory()) rows.push(...(await inventory(file)));
    else if (entry.isFile()) {
      const bytes = await readFile(file);
      rows.push({ path: file, bytes: bytes.length, sha256: sha(bytes) });
    }
  }
  return rows.sort((a, b) => a.path.localeCompare(b.path));
}
const original = await readJson(`${root}/m14-q-pause-manifest.json`);
let originalVerified = 0;
for (const file of original.files.filter((row) =>
  row.path.startsWith(`${root}/`),
)) {
  assert.equal(
    sha(await readFile(file.path)),
    file.sha256.toLowerCase(),
    `Changed original evidence: ${file.path}`,
  );
  originalVerified++;
}
const evidence = await inventory(root);
let jsonFiles = 0;
for (const file of evidence.filter((row) => row.path.endsWith('.json'))) {
  await readJson(file.path);
  jsonFiles++;
}
const ui = await readJson(`${root}/m14-q-browser-repeat.json`);
assert.deepEqual(ui.failures, []);
assert.deepEqual(
  ui.tiers.map((row) => row.tier),
  [1000, 10000],
);
for (const row of ui.tiers) {
  assert.equal(row.coldOptions.length, 5);
  assert.equal(row.save.n, row.tier === 10000 ? 3 : 30);
  assert.ok(Number.isFinite(row.confirmedDeleteMs));
}
const lifecycle = await readJson(
  `${root}/m14-q-browser-lifecycle-control.json`,
);
assert.deepEqual(lifecycle.failures, []);
for (const row of lifecycle.lifecycle.filter((row) =>
  [10, 25, 50].includes(row.cycle),
)) {
  assert.equal(row.metrics.nodes, 3174);
  assert.equal(row.metrics.jsEventListeners, 539);
}
assert.equal(lifecycle.lifecycle.at(-1).urls, 0);
assert.equal(lifecycle.shared[1].overlappingSaveTypingProtocol.n, 5);
assert.equal(lifecycle.workerRecovery.length, 5);
const mixed = await readJson(`${root}/m14-q-storage-mixed.json`);
assert.deepEqual(mixed.failures, []);
assert.equal(mixed.sessions.length, 5);
for (const name of ['near', 'mapping', 'repeat', 'mixed']) {
  const data = await readJson(`${root}/m14-q-storage-${name}.json`);
  assert.deepEqual(data.failures, []);
  for (const session of data.sessions) {
    assert.equal(session.error, undefined);
    for (const value of Object.values(session.measurements)) {
      assert.deepEqual(value.failures, []);
      assert.equal(value.n, value.samplesMs.length);
      assert.ok(value.n > 0);
    }
  }
}
for (const name of ['mixed', 'image-edit', 'profile', 'lifecycle-resume']) {
  const data = await readJson(`${root}/m14-q-browser-${name}.json`);
  assert.deepEqual(data.failures, []);
}
const trigger = await readJson(`${root}/m14-q-trigger.json`);
assert.deepEqual(trigger.errors, []);
let triggerInvocations = 0;
for (const context of trigger.runs) {
  assert.equal(context.result.length, 48);
  for (const scenario of context.result) {
    assert.equal(scenario.runs.length, 32);
    for (const run of scenario.runs) {
      triggerInvocations++;
      const accepted = scenario.scenario === 'accepted';
      assert.equal(run.accepted, accepted);
      assert.equal(run.prevented, accepted);
      assert.equal(
        run.calls,
        accepted ? (scenario.mode === 'automatic' ? 2 : 1) : 0,
      );
      if (accepted) assert.equal(run.exactCleanup, true);
    }
  }
}
assert.equal(triggerInvocations, 7680);
// These must exit at their overwrite guard, before a browser or validation child starts.
for (const args of [
  ['tests/performance/run-m14-q-browser.mjs', 'repeat'],
  ['tests/performance/run-m14-q-storage.mjs', 'repeat'],
  ['tests/performance/run-m14-q-validation.mjs', 'lint', 'lint-final'],
]) {
  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    windowsHide: true,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to overwrite/);
}
const manifestPath = `${root}/m14-q-pause-manifest-2026-09-12.json`;
if (!evidence.some((row) => row.path === manifestPath)) {
  const source = (await inventory('tests/performance')).filter(
    (row) => !row.path.startsWith(`${root}/`),
  );
  const docs = [];
  for (const name of [
    'PERFORMANCE_AUDIT_M14-Q',
    'PROJECT_STATE',
    'ROADMAP',
    'CHANGELOG',
    'BACKLOG',
    'TESTING_STRATEGY',
  ]) {
    const path = `docs/${name}.md`;
    const bytes = await readFile(path);
    docs.push({ path, bytes: bytes.length, sha256: sha(bytes) });
  }
  await writeFile(
    manifestPath,
    JSON.stringify(
      {
        task: 'M14-Q',
        capturedAtUtc: new Date().toISOString(),
        note: 'Completed on explicit resumption after the interrupted pause-finalization. This captures the actual current files, not a retroactively claimed pause timestamp or exact source revision for older batches.',
        originalEvidenceVerified: originalVerified,
        files: [...evidence, ...source, ...docs],
      },
      null,
      2,
    ) + '\n',
  );
} else {
  const resumed = await readJson(manifestPath);
  for (const file of resumed.files.filter((row) =>
    row.path.startsWith(`${root}/`),
  ))
    assert.equal(
      sha(await readFile(file.path)),
      file.sha256.toLowerCase(),
      `Changed resumed evidence: ${file.path}`,
    );
}
process.stdout.write(
  `PASS: ${originalVerified} original evidence hashes; ${jsonFiles} parseable JSON files; completed replacement/new batch invariants; ${triggerInvocations} trigger invocations; 3 overwrite guards; resumption manifest preserved.\n`,
);
