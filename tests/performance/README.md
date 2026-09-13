# Isolated performance diagnostics

## M14-U Backup restore write-path attribution

M14-U uses the real production `DexieTransactionalBackupRestorePort.replaceAll(...)` path and native IndexedDB in a disposable headless Chromium context. Its deterministic fixture contains 10,000 Text Snippets comparable to M14-Q. It separates production restore stages, synchronous record mapping, the actual production-table `bulkAdd` boundary, outer transaction resolution, and three diagnostic-only index variants. It does not access an extension/user database, change production schema or behavior, or define a CI timing threshold.

The retained result is `results/m14-u-restore-attribution.json`. The runner refuses to overwrite it. A separately authorized fresh repeat must use a unique lowercase output label:

```powershell
pnpm.cmd exec eslint tests/performance/m14-u-restore-attribution.ts tests/performance/run-m14-u-restore-attribution.mjs
pnpm.cmd exec prettier --check tests/performance/m14-u-restore-attribution.ts tests/performance/run-m14-u-restore-attribution.mjs
pnpm.cmd typecheck
node tests/performance/run-m14-u-restore-attribution.mjs fresh-repeat
```

Run the expensive batch sequentially. The runner declares and excludes 100-record warmups, separates the first production restore after seeding from three repeats, rotates index-variant order, opens a fresh disposable database before every isolated measured write, saves phase progress, and preserves failures. Mapping uses 30 repeats; production restore and each write variant use three expensive repeats. The result's index comparison is synthetic attribution evidence, not a schema-migration proposal. Chromium cannot expose internal B-tree, uniqueness-check, journal, disk-flush, or scheduler timing below the awaited request boundary.

## M14-T bounded Snippet Library rendering

M14-T adds the assertion-backed `run-m14-t-pagination.mjs` follow-up and its retained `results/m14-t-pagination.json` evidence without changing or overwriting M14-Q artifacts. Build the current production extension first, then run the harness from the repository root:

```powershell
pnpm.cmd build
node tests/performance/run-m14-t-pagination.mjs
```

The harness creates a disposable Chromium profile and synthetic extension database, seeds 10,000 matching Text Snippets outside the measured search operation, and asserts the 100-row first/last pages plus off-page stable-ID search reachability. Reported live-element and timing values are descriptive single-run evidence, not CI thresholds or a supported Library-size limit. It performs no clipboard write, paste, native-host, provider, or user-profile operation.

## M14-Q isolated performance audit

These opt-in diagnostics belong to **M14-Q — Internal Performance Audit & Improvement Recommendations**. They do not authorize a production fix, a new performance milestone, or M15. The authoritative analysis, limitations, validation results, and manual plan are in [the audit report](../../docs/PERFORMANCE_AUDIT_M14-Q.md).

Use the installed repository dependencies and Playwright Chromium. Run from the repository root on Windows. Never point these runners at an existing browser profile. They create disposable browser contexts/profiles and synthetic databases, and use fake clipboard/provider boundaries. The native runner only launches the existing companion with `get-capabilities`; it does not build provenance for that executable, register a host, write the clipboard, or issue paste input.

## Reproduce a bounded batch

Run batches sequentially so concurrent audit work does not contaminate latency. Build the production extension with `pnpm.cmd build` before browser timings; production output is `.output/chrome-mv3`, while the native-development validation build uses `.output/chrome-mv3-native-dev` and must not be mistaken for the production build. Fixture creation, seeding, and declared warmups are outside operation timing. OS caches are not flushed.

```powershell
node tests/performance/verify-m14-q-measurement.mjs
pnpm.cmd typecheck
node tests/performance/run-m14-q-storage.mjs repeat fresh-storage-repeat
node tests/performance/run-m14-q-storage.mjs mixed fresh-storage-mixed
node tests/performance/run-m14-q-storage.mjs near fresh-storage-near
node tests/performance/run-m14-q-storage.mjs mapping fresh-storage-mapping
node tests/performance/run-m14-q-browser.mjs repeat fresh-browser-repeat
node tests/performance/run-m14-q-browser.mjs mixed fresh-browser-mixed
node tests/performance/run-m14-q-browser.mjs image-edit fresh-image-edit
node tests/performance/run-m14-q-browser.mjs profile fresh-browser-profile
node tests/performance/run-m14-q-browser.mjs lifecycle fresh-lifecycle
node tests/performance/run-m14-q-browser.mjs lifecycle-control fresh-lifecycle-control
```

Storage/browser runners refuse to overwrite an existing output label. Choose a new label for each repeat. Browser `repeat` runs only 1,000 and 10,000 Text tiers; `mixed` runs only the mixed UI tier; neither proceeds into lifecycle work. `profile` is a separate counter-instrumented batch. `lifecycle-control` replaces Playwright file selection with an in-page synthetic File/DataTransfer change event and uses MutationObserver Save completion to investigate instrumentation effects. It is still the unchanged production image-ingestion and Save path.

The bounded mixed storage fixture excludes only the original 1440×900 PNG that reproducibly fails the production Backup decoder. Its original bytes, dimensions, and failure are retained in the earlier evidence; the exclusion is not a fix or a claim that all supported images can be backed up. The mixed UI fixture separately uses nine small 64×64 assets. The near-limit fixture is one 94 MiB Text body plus its valid v7 envelope, below the unchanged 96 MiB cap; it is a byte-stress fixture, not typical user content.

Delivery A/B, controlled triggers, native capability launches, and the large-PNG failure already have retained evidence. Do not rerun them merely to complete another batch. For an explicitly needed delivery repeat, `node tests/performance/run-m14-q-delivery.mjs fresh-delivery` uses a new filename. Trigger, native, and base64 runners still use fixed output filenames: preserve those files before any separately needed rerun. The historical `pnpm.cmd benchmark:snippet-delivery` method is unchanged and its retained current-environment run is under `results/pause-command-evidence/`.

## Evidence and verification

### Checkpoint selection and verification without local artifacts

Principal has accepted the M14-Q findings, Documentation Impact Review and checkpoint inventory, including the trigger matrix. The same-task evidence-log correction excludes exactly three additional raw console logs; Git checkpoint authorization remains separate. [The checkpoint inventory](results/m14-q-checkpoint-inventory.json) lists every relevant file, current byte size, Git state, category, COMMIT / LOCAL ONLY disposition and rationale. Only COMMIT rows are proposed. It also records the largest files for Principal review. Do not add the results directory wholesale or force ignored files into Git.

The original final/pause manifests and boundary review are immutable historical records. Their file lists include intentionally omitted logs, superseded reports and operational metadata; their older document/source hashes are not current-checkpoint hashes. The full-archive `verify-m14-q-evidence.mjs` command below requires those local artifacts and is appropriate in the preserved audit workspace. It will fail on a checkout containing only proposed files because it deliberately checks historical archive hashes. This is an archive-availability limitation, not missing accepted measurement evidence. Do not regenerate missing old artifacts or rewrite those manifests to make it pass.

For a checkout containing the proposed files, run this read-only inventory validation from the repository root. It checks every selected file, parses selected JSON and resolves all current report links against committed or proposed files. `sha256` preserves exact review-worktree bytes; `lfSha256` additionally accepts only CRLF/LF checkout conversion because this workspace uses `core.autocrlf=true`. No other content normalization is allowed. The inventory's own hash is null to avoid self-reference; Git will provide its integrity once a checkpoint is authorized. Historical source hashes continue to carry their original provenance limits.

```powershell
@'
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const indexPath = 'tests/performance/results/m14-q-checkpoint-inventory.json';
const inventory = JSON.parse(readFileSync(indexPath, 'utf8'));
const selected = inventory.files.filter(row => row.disposition === 'COMMIT');
const selectedPaths = new Set(selected.map(row => row.path));
const tracked = new Set(execFileSync('git', ['ls-files'], { encoding: 'utf8' }).trim().split('\n'));
const digest = value => createHash('sha256').update(value).digest('hex');
for (const row of selected) {
  const bytes = readFileSync(row.path);
  if (row.sha256 !== null) {
    assert.ok(digest(bytes) === row.sha256 ||
      digest(bytes.toString('utf8').replace(/\r\n/g, '\n')) === row.lfSha256,
      `Changed checkpoint content: ${row.path}`);
  } else assert.equal(row.path, indexPath);
  if (row.path.endsWith('.json')) JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
}
const report = 'docs/PERFORMANCE_AUDIT_M14-Q.md';
let links = 0;
for (const match of readFileSync(report, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
  if (/^(https?:|#)/.test(match[1])) continue;
  const target = path.posix.normalize(path.posix.join('docs', match[1].split('#')[0]));
  assert.ok(existsSync(target), `Missing report target: ${target}`);
  assert.ok(selectedPaths.has(target) || tracked.has(target) ||
    [...selectedPaths].some(file => file.startsWith(target.replace(/\/$/, '') + '/')),
    `Report links to omitted evidence: ${target}`);
  links++;
}
console.log(`PASS: ${selected.length} selected files; report links ${links}; content hashes and JSON valid.`);
'@ | node --input-type=module
```

The unique JSON object in the ignored UTF-16 historical benchmark log is preserved as [historical-method evidence](results/m14-q-historical-method-evidence.json). All parsed values are identical to the original object; the wrapper records source bytes, SHA-256, encoding and extraction. This is an evidence-index derivation, not a rerun or edited raw result. Other omitted console logs duplicate structured results/exit metadata. Initial lint/format failure text and selected e2e/native output remain selected. Principal directed `resume-command-evidence/build-final.txt`, `build-native-dev-final.txt` and `test-final.txt` to remain LOCAL ONLY, byte-for-byte unchanged, after staged whitespace validation failed on those raw logs. Their existing JSON command/exit/time records remain selected, as does `m14-q-build-output.json` with both build inventories/hashes. The audit retains the 68-file/876-test PASS plus one skipped file/test, build/output-validator results and warnings. Excluding raw console whitespace changes no finding, measurement or reproduction command; no previously excluded artifact replaces these logs. Superseded pause reports, partial aggregate, old status listing and all four `desktop.ini` files remain local. No original artifact was deleted.

Existing tracked `snippet-delivery-benchmark.ts`, `snippet-delivery-benchmark.html`, `run-snippet-delivery-benchmark.mjs`, production imports, dependencies and native fixtures remain prerequisites already in HEAD; they are not new M14-Q additions. Generated stress payloads and disposable profiles are produced by the documented harnesses when separately authorized, not stored in this checkpoint. No generated fixture payload, trace or screenshot was found among pending M14-Q files.

### Full preserved audit workspace

Raw JSON records sample counts, timing boundaries, fixture details, and failures. Empty distributions are unavailable, whereas numeric zero samples are measured below useful timer resolution. The common summary uses nearest-rank median/p95 and omits p95 below 20 samples. Expensive stress paths have deliberately reduced counts; never pool distinct methods, instrumentation modes, or fixtures into one latency claim.

```powershell
node tests/performance/verify-m14-q-evidence.mjs
node tests/performance/aggregate-m14-q-results.mjs
node tests/performance/summarize-m14-q-diagnostics.mjs
node tests/performance/inspect-m14-q-results.mjs tests/performance/results/m14-q-storage-repeat.json
pnpm.cmd format --check --ignore-path .gitignore --ignore-path .prettierignore --ignore-path tests/performance/.prettierignore
```

The additional formatting ignore covers only immutable raw audit evidence. Production and harness code retain their normal checks. It prevents formatting from changing pause hashes or raw failure/log records. The read-only inspector can take a dotted property path as a third argument. Aggregation writes `m14-q-aggregate-final.md`, preserving the earlier partial `m14-q-aggregate.md` and every input JSON. The diagnostic summary is separately derived. After closeout, preserve these final derivatives and the final manifest before any separately authorized regeneration.

`run-m14-q-validation.mjs <command-name> <fresh-log-label>` captures fixed validation commands and their complete stdout/stderr, exit code, and elapsed time. Supported checks: `lint`, `format`, `typecheck`, `test`, `e2e`, `build-native-dev`, `build`, `native-restore`, `native-build`, `native-test`, `integrity`, `evidence`, `diff-check`, and `fsck`. Run native restore/build/test sequentially and the production extension build after the native-development build. The older PowerShell command logger has mixed-encoding/header-only/locked-append limitations recorded in `results/m14-q-command-log-limitations.md`; its original logs remain unchanged. Neither logger authorizes arbitrary production changes.

No timing assertions are added to CI. Full repository validation remains the existing lint, typecheck, normal Vitest, executed Playwright, production/native-development builds with output checks, native restore/build/test, and Git integrity/diff checks. Live-provider tests stay opt-in and off. Real toolbar activation, debugger-free suspension, actual clipboard/paste, Intercom/Crisp insertion, and true process/image/GPU peak memory remain explicitly operated manual evidence.
