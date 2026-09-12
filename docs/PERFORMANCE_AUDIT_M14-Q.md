# M14-Q — Internal Performance Audit & Improvement Recommendations

Status: **AUDIT PRINCIPAL-REVIEWED / TECHNICALLY APPROVED; CHECKPOINT UNAUTHORIZED — 2026-09-12**. Internal measurement, independent confirmation, analysis, repository validation, and documentation synchronization are complete. Explicitly operated manual/platform checks remain **PENDING / NOT RUN** and limit the conclusions. This is the same M14-Q task, not M14-Q.1; no optimization is implemented or authorized.

## M14-Q Evidence Log Checkpoint Correction — Final Result

Current phase: **COMPLETE; all final checks PASS**. This is the same M14-Q task. Principal approved the original 109-file inventory, including the trigger matrix, then directed exactly three raw console logs to become LOCAL ONLY after `git diff --cached --check` found 27 existing whitespace diagnostics. The logs were unstaged with `git restore --staged -- <exact three paths>` and their original bytes/hashes were preserved. No raw log was edited, normalized, moved or deleted; no previously excluded file was substituted.

Corrected COMMIT inventory: **106 files / 4,670,816 worktree bytes**, comprising **101 new additions / 4,138,867 bytes** and five modified tracked documents / 531,949 bytes. LOCAL ONLY: **39 files / 301,306 bytes**. The exact three-file reduction explains 109 to 106; only this existing report, the existing audit README and existing checkpoint inventory were updated, so no file was added. The inventory counts itself with null self-hash. Sizes are full worktree bytes; actual staged blobs permit only the already documented CRLF/LF conversion.

Authoritative path/disposition/rationale/hash/size inventory: `tests/performance/results/m14-q-checkpoint-inventory.json`. The removed paths are exactly `tests/performance/results/resume-command-evidence/build-final.txt` (13,944 bytes), `build-native-dev-final.txt` (14,531 bytes), and `test-final.txt` (416 bytes). Their three matching JSON command/exit/time records remain selected. `m14-q-build-output.json` retains both extension build inventories and hashes. The accepted validation table below already preserves both successful builds/output validators, 68 files / 876 tests passed plus one skipped file/test, and relevant warnings. The index summarizes those already recorded outcomes without fabricating stdout or changing measurements. The audit remains understandable and reproducible without these raw logs; the README retains all harness commands and checkout-safe verification.

Retained groups: six authorized docs; README and `.prettierignore`; all 21 pending harness/source/helpers; all top-level result JSON; final aggregate and command-log limitations; both command-evidence directories' JSON; and exactly six `resume-command-evidence/*.txt` logs: `e2e-final`, `native-restore-final`, `native-build-final`, `native-test-final`, `lint-initial`, `format-initial`. Excluded groups: four superseded top-level aggregate/report/status files, seven ignored `.log` files, four ignored `desktop.ini` files and the other 24 `.txt` console captures. All earlier exclusions remain excluded. No generated payload/profile, trace, screenshot, production implementation or performance measurement was added.

Largest 10 selected files:

| Path | Bytes |
| --- | ---: |
| `tests/performance/results/m14-q-trigger.json` | 2,267,491 |
| `tests/performance/results/m14-q-storage-a.json` | 537,542 |
| `docs/CHANGELOG.md` | 198,771 |
| `docs/PROJECT_STATE.md` | 167,285 |
| `tests/performance/results/m14-q-aggregate-final.md` | 159,487 |
| `tests/performance/results/m14-q-storage-mixed.json` | 146,863 |
| `tests/performance/results/m14-q-storage-repeat.json` | 135,623 |
| `docs/TESTING_STRATEGY.md` | 110,570 |
| `tests/performance/results/m14-q-checkpoint-inventory.json` | 108,096 |
| `tests/performance/results/m14-q-delivery-b.json` | 76,646 |

Principal explicitly approved retention of the 2,267,491-byte trigger matrix; it remains unchanged with all 7,680 invocations. Largest local-only artifacts:

| Path | Bytes |
| --- | ---: |
| `tests/performance/results/m14-q-aggregate.md` | 132,488 |
| `tests/performance/results/m14-q-resumption-report-preserved.md` | 44,432 |
| `tests/performance/results/pause-command-evidence/build.log` | 29,022 |
| `tests/performance/results/m14-q-pause-report.md` | 24,734 |
| `tests/performance/results/pause-command-evidence/historical-method-current.log` | 20,452 |
| `tests/performance/results/resume-command-evidence/build-native-dev-final.txt` | 14,531 |
| `tests/performance/results/resume-command-evidence/build-final.txt` | 13,944 |
| `tests/performance/results/m14-q-final-git-status.txt` | 8,311 |
| `tests/performance/results/resume-command-evidence/fsck-final.txt` | 7,047 |
| `tests/performance/results/resume-command-evidence/fixture-integrity.log` | 661 |

Completed phases: preflight and baseline hashes; targeted reclassification/unstaging; retained-outcome and link review; documentation/index correction ; exact staged-content, raw-preservation, evidence/link and both diff checks. Remaining: NONE. No performance finding or raw measurement changed. Historical sections below describe the original audit before staging; their old no-staging statements do not describe this correction. Frozen manifests remain historical provenance, not current inclusion lists.

Only the report, audit README and checkpoint inventory were modified in this correction. All other original file hashes, including all 39 local-only files, remain unchanged. No production source, dependency/lockfile, architecture, schema/index/migration, Backup contract, permissions, native protocol, Snippet/provider/UI behavior, optimization or M15 behavior changed or entered the staged set. M14-P remains approved; M15 NOT STARTED. No `git add -f`, commit or push occurred.

Validation: exact corrected inventory/staged paths and content PASS (106 files); existing evidence verifier PASS (16 original hashes, 69 JSON, completed-batch invariants, 7,680 trigger invocations, three overwrite guards and resumed hashes); report/README and six-doc repository links PASS; preserved raw hashes PASS; `git diff --cached --check` PASS; `git diff --check` PASS. Final full `git status --short` and current staged paths are recorded in the inventory. No full suite, build or performance batch reran.

Branch `master`; HEAD `9fe2d56e39793191530139ecdea70e6a2fbc4c7f`; commit NONE; push NONE. Exact next action: **Principal Git checkpoint authorization.** Stop; no commit is authorized.

Principal-readiness self-check: PASS

## Executive assessment

Text serialization/planning and the controlled trigger handler remain fast at browser timer resolution. No worthwhile Text micro-optimization or native architecture redesign is justified. Two independently repeated synthetic bottlenecks are large-Library rendering/layout and 10,000-record transactional restore. A reproducible **correctness/resource-limit failure** blocks canonical Backup creation for a valid large PNG. That is the first proposed focused follow-up because valid authored data cannot export; it remains unfixed.

The controlled 50-cycle preview run stayed flat at cycles 10–50 and released all object URLs after unmount. Earlier uncontrolled counters do not demonstrate a production leak. Corrected four-tab Save-plus-typing was approximately **64 ms median**; the earlier approximately one-second interval included a harness background-animation-frame wait and is excluded as application latency. Near-cap byte stress completed but showed large sampled heap and frame pauses, warranting further measurement rather than an inferred supported limit or allocation fix.

All recommendations are **PROPOSED / UNAPPROVED / UNSCHEDULED**. Principal should review a narrow PNG correctness task first, Library rendering next, and restore attribution thereafter. M14-P.6.1 and the M14-P gate remain **COMPLETE / PRINCIPAL-APPROVED**, Decision 57 remains authoritative, Dexie physical version 6 and Backup v1–v7 contracts are unchanged, and M15 remains **NOT STARTED**.

## Continuity, scope, and interruption repair

Starting/final branch `master`, HEAD `9fe2d56e39793191530139ecdea70e6a2fbc4c7f`; Git metadata `C:/Users/shiha/GitMetadata/AI-Support-Workspace.git`. The September 6 clean preflight and earlier live remote match are historical. This latest resumption started with five modified tracked docs, the untracked audit report and existing isolated audit files. Tracking comparison with `origin/master` remains 0/0; no fresh live-remote synchronization is claimed.

Before new measurements, the paused report, Project State, Roadmap, Changelog, original specification and changed files were inspected. Pause blocks were complete; active-versus-paused wording needed final synchronization. The referenced second pause manifest was missing. All 16 original evidence hashes and 32 existing JSON files verified before the missing manifest was completed at the actual capture time. This repaired only the audit artifact; no raw measurement was rewritten. [The resumed manifest](../tests/performance/results/m14-q-pause-manifest-2026-09-12.json) is not retroactive source provenance. The pre-final `m14-q-resumption-report-preserved.md` is preserved byte-for-byte locally and intentionally excluded from the checkpoint, together with `m14-q-pause-report.md`; their superseded pause instructions add no reproduction requirement. Original manifests/hash verification, interruption records and the correction narrative here retain the useful history.

Only six authorized docs and isolated harnesses/instructions/compact evidence under `tests/performance/` changed. No production source, dependency, lockfile, schema/index/migration, Backup contract, permission, native protocol, product UI, provider wiring or architecture change occurred. No staging, commit, push, checkpoint, M15 or production fix occurred. During final documentation assembly, one overlong Windows command was rejected before execution and a PowerShell stdin encoding issue converted new punctuation to question marks; only the report draft was affected and it was repaired using explicit UTF-8 before final review. Original raw evidence was unaffected. Exact historical harness revisions were not captured for every batch; current formatted sources are reproducible instructions, not claimed historical hashes. Final build/file hashes describe final validation state. Seven preserved `.log` files match the existing root ignore rule and are intentionally LOCAL ONLY. They remain unchanged on disk and in historical manifests. The checkpoint inventory retains structured measurements, exit/time metadata and selected unique validation/failure output. The unique historical benchmark JSON is losslessly indexed in [historical-method evidence](../tests/performance/results/m14-q-historical-method-evidence.json), with original log SHA-256 and extraction provenance. No ignored file is proposed for force-add.

## Environment and evidence interpretation

- Windows 11 Pro, version 10.0.26200/build 26200; Intel Core i7-13650HX, 14 cores/20 logical processors; 34,029,125,632 bytes physical RAM.
- Node 25.3.0, pnpm 11.15.0, .NET SDK 10.0.401; Playwright Chromium 149.0.7827.55; 1280×900 production-extension test viewport.
- Existing WXT production build for Options, Side Panel document, and static content-script measurements. Headless storage, controlled-trigger, and historical delivery modules use the existing Vite development server and production application functions; their timings are explicitly separate from production UI timings.
- Disposable Playwright profiles/contexts only. Storage uses UUID-named audit databases; production-extension fixtures use the normal database name only inside newly created disposable profiles. No real conversations, daily-use profile, live provider, clipboard writes, OS paste input, or companion registration. The final native validation triggered .NET first-run bootstrap output; see Validation for that toolchain side effect.
- OS caches are not flushed. Five reset runs mean fresh contexts/profiles or first invocations as specified by each harness, not five hardware-cold boots. Fixture generation/seeding is outside operation timing. Timings are exploratory local measurements, not product limits or CI SLAs.
- Actual samples of `0 ms` mean below useful browser timer resolution. Empty samples have `status: not-measured`, `n: 0`, and no statistics. p95 is omitted below 20 samples. All failures and raw runs are retained locally, with material structured evidence selected for the checkpoint; no failure is converted to a successful zero.
- Browser heap and DOM counters are renderer observations, not total Chromium, native image, GPU, or OS memory. Uncollected DOM nodes across reloads are not proof of detached-node leakage. Forced-GC lifecycle measurements are separate from latency runs. Debugger-assisted worker restart is distinct from natural worker suspension.

## Implemented versus dormant paths

Implemented presentation/delivery: popup-free toolbar/Side Panel shell; normal-tab Options; Text/Image Snippet CRUD and filtering; rich editor; usage display; trigger delivery; clipboard-only and optional Automatic Paste; Library Copy; manual Backup v7/restore and reminder. The Side Panel document can be timed headlessly, but native Chrome toolbar-to-panel activation requires the manual plan below.

Headless or compatibility infrastructure: lexical retrieval, Prompt Builder, Ollama adapter, generated-tag parsing/fingerprinting/conditional save and explicit maximum-20 backfill; Knowledge repositories/data/Backup compatibility; old Output Workspace components. Current `sidepanel/main.tsx` mounts `WorkspaceShell`, whose M15 controls remain disabled. There is no active AI generation workflow to benchmark. Fake provider transport measurements exclude model latency.

Dormant or retired: automatic-backup scheduler/folder/retention infrastructure and failed browser Image transports. Future: M15 context/model/generation/output functionality, M16 provider expansion, and production native distribution. None is activated by this audit.

## Harness integrity

The delivery runner replaces only the historical harness's summary/repetition logic in memory. The historical source and fixtures remain unchanged. Empty distributions omit timing statistics, while numeric zero samples remain measured. The isolated verification checks empty, single, multiple, numeric-zero, and invalid samples.

Scrolling resets to y=0 and settles before timing. Each timed operation scrolls to `min(600, maximum scroll position)`, waits two animation frames, and verifies the final position. Missing range/reset/movement produces an explicit unavailable result with no timing. This measures a programmatic scroll and settling interval, not wheel-input fidelity or continuous-scroll frame rate. Verification exercises three repeated movements and a non-scrollable page.

Neither harness correction is a production optimization finding.

## Library and authoring results — M14-Q-F1

The browser fixture is distinct from the storage fixture: 1,743,393 and 17,443,893 serialized record bytes at 1,000 and 10,000 entries, respectively, with no image assets. Navigation ends after the target is visible and an animation frame; actions generally include two animation frames. Five first seeded navigations use fresh profiles, but each profile already opened empty Options for seeding; these are not hardware-cold boots or untouched first-launch measurements. Editor typing is a Playwright keypress protocol roundtrip, not isolated handler time.

| UI interval | 1,000 entries: n / median / p95 / max ms | 10,000 entries: n / median / p95 / max ms |
| --- | --- | --- |
| First seeded Options navigation | 5 / 707.5 / omitted / 713.8 | 5 / 11,704.1 / omitted / 13,377.2 |
| Warm Options navigation | 30 / 1,193.1 / 1,542.6 / 1,551.1 | 3 / 14,111.9 / omitted / 14,131.4 |
| Warm Side Panel document | 30 / 47.4 / 63.3 / 64.1 | 3 / 119.7 / omitted / 1,070.9 |
| Common search | 30 / 1,101.8 / 1,382.6 / 1,414.0 | 3 / 13,468.5 / omitted / 13,782.4 |
| Rare search | 30 / 40.5 / 55.0 / 57.5 | 3 / 390.3 / omitted / 400.7 |
| No-match search | 30 / 34.2 / 46.4 / 47.8 | 3 / 350.2 / omitted / 425.3 |
| Images filter, from all Text rows | 30 / 30.1 / 48.2 / 71.6 | 3 / 343.9 / omitted / 451.0 |
| Programmatic scroll + two frames | 30 / 33.3 / 33.9 / 39.2 | 30 / 33.3 / 37.7 / 48.4 |
| Text Edit | 30 / 96.5 / 152.2 / 218.5 | 3 / 669.6 / omitted / 939.1 |
| Editor typing protocol | 30 / 54.0 / 71.5 / 77.2 | 30 / 229.5 / 372.8 / 585.2 |
| Save to form closure + frame | 30 / 277.7 / 319.3 / 386.9 | 3 / 1,171.1 / omitted / 1,189.8 |
| Confirmed Delete dialog completion | 1 / 154.6 / omitted / 154.6 | 1 / 1,056.2 / omitted / 1,056.2 |

The two-frame control medians were 31.5 and 31.7 ms. Scroll results close to that floor do not establish wheel-input fidelity or continuous frame rate. Side Panel document results do not measure native toolbar activation; its M15 controls remain disabled. The large Side Panel maximum is retained, not discarded.

The fully rendered Library had **22,035 live elements at 1,000 rows** and **220,035 at 10,000 rows**. These are `document.querySelectorAll('*')` observations, distinct from accumulated CDP DOM counters. Source inspection in `src/ui/snippet/SnippetLibraryView.tsx` shows `visibleEntries.map` renders every visible row and invokes `renderSnippetPlainText` for Text Details. `visibleEntries` searches title/trigger/authored tags in memory. These source facts do not individually quantify React reconciliation or projection cost.

In the separate fresh 10,000-entry diagnostic, common-result expansion took 6,161.2–6,985.6 ms (three samples), with **4,398.4–5,541.4 ms LayoutDuration** and **423.7–663.4 ms ScriptDuration**. Each expansion changed the live element count from 35 to 220,035. This supports layout/rendering as a major contributor in this fixture. The diagnostic is faster than the repeated-navigation batch; prior navigation, allocation/GC, machine conditions, and instrumentation differ. Do not subtract the batches to estimate profiler overhead, call the difference an optimization, or infer a guaranteed speedup. The repeat confirms a large-Library scaling problem under synthetic conditions, not a user population, supported limit, total-memory leak, or controlled regression since M14-P.

## Storage, restore, and retrieval — M14-Q-F2/F4

At 10,000 Text entries, the uninstrumented independent restore median was **26,015.1 ms**, maximum **30,899.9 ms**, n=3. At 1,000 it was 1,638.6 ms, p95 2,798.3 ms, maximum 3,097.4 ms, n=30. The separate existing-hook diagnostic took 31,184.0 ms: 30,386.1 ms lay between `knowledge-written` and `snippets-written`, covering Snippet mapping and `bulkAdd`; Snippet clearing took 764.8 ms. The responsible production boundary is `DexieTransactionalBackupRestorePort.replaceAll` in `src/infrastructure/persistence/dexie-backup-persistence.ts`. The completed mapping-only diagnostic calls production `toSnippetEntryRecord` for all 10,000 records: first invocation 54.4 ms; n=30, median 34.5 ms, p95 48.9 ms, maximum 54.0 ms, without additional warmup. This supports database/index-write work as the next attribution target. Different sessions prevent subtraction for an exact I/O cost; individual index costs remain unmeasured. No schema/index/transaction change is authorized.

The reverse-order 10,000-entry common-query medians were stale 1,063.6 ms, valid 956.5 ms, missing 719.2 ms (n=3 each). These differ from batch A and remain order/GC/environment sensitive; do not subtract them to claim fingerprint savings. Five separately instrumented valid-metadata retrievals again made five calls each to Knowledge/Snippet/metadata list and 50,000 SHA-256 calls in total. The three instrumented delivery paths made only three authoritative Snippet reads, with no metadata reads or hashing. Source inspection confirms whole-Library work in retrieval and graph validation for authored create/update. The current Side Panel has no active generation/retrieval workflow, so this does not activate M15 work.

The bounded mixed batch succeeded while the original failing PNG remained excluded and preserved as separate correctness evidence. Its first-context medians were snapshot 16.6 ms (n=10), stringify 7.3 ms (n=30), canonical Backup 507.7 ms, parse/validate 338.9 ms, prepare import 329.4 ms, and atomic restore 704.0 ms (each n=10; restore max 909.1 ms). Direct asset read was 0.1 ms (n=10). Fake-provider request accounting recorded 4,447 UTF-8 bytes; no live provider ran. Backfill checks retained maximum 20, concurrency one, an intentional isolated item failure, cancellation, current-item skipping, rollback preservation, and local reminder preservation. These bounded successes are not evidence that the excluded PNG can be backed up.

## Lifecycle, typing, and instrumentation controls

The original invisible `#rich` target was **0 pixels high** in the no-extension fixture. An isolated fixture module now gives light/Shadow contenteditables a minimum hit area. Focused verification confirmed the original zero-height diagnosis and successful typing in all corrected targets. The previous timeout is a harness failure, not a production-rendering defect.

The first completed 50-cycle preview run used Playwright `setInputFiles`: post-GC DOM nodes/listeners rose from 3,122/517 to 6,019/980, while live elements stayed near 2,433. In the independent in-page File/DataTransfer control, nodes/listeners were **3,174/539 at cycles 10, 25, and 50**, then **133/194 after thumbnails unmounted**, with 35 live elements. Both methods retained nine thumbnail object URLs during the cycles and returned to **zero URLs after unmount**. Control heap was 4,828,836 bytes initially, 5,879,184 after cycle 50, and 5,046,348 after unmount. This supports an instrumentation contribution to the original retained-counter growth; it does not identify exact retaining objects or prove that every production/native/GPU allocation is leak-free. Do not recommend a production leak fix from the first run's counters.

Options open/close completed 50 times in each lifecycle batch; the first completed batch median was 118.2 ms, p95 163.6 ms, maximum 204.0 ms, on 100 Text + nine small Images. Ordinary/unknown synthetic typing completed on all four editor fixtures with and without the extension, 30 protocol-roundtrip samples per case in each batch. The first batch's 10-second idle windows recorded 12.274 ms renderer TaskDuration without the extension and 10.955 ms with it. These exploratory, sequential windows include debugger/automation effects and do not establish total browser or closed-UI worker CPU.

One/four-tab catalog IPC returned all 109 expected entries in both batches. The first batch's four-tab Save-plus-typing median was 1,013.1 ms using `requestAnimationFrame` polling. The MutationObserver control recorded 84.8 ms with one tab and **63.8 ms with four tabs** (n=5 each). Thus the earlier one-second interval includes background-frame waiting and is not a measured production Save penalty. Order and protocol overhead prevent claiming that four tabs improve performance. Reload and catalog raw distributions remain separate. Five forced worker restarts per batch each recovered 109 entries with a new epoch; this is debugger-assisted restart, not natural suspension. Closed-UI CPU/suspension and genuine clipboard/destination evidence remain manual gaps.

## Delivery, historical comparison, and native startup

Delivery B was analyzed without rerunning it. All three Text warm medians and p95 values were 0 ms (n=30 each); maxima were 0/0.1/0.1 ms for plain/rich/planner. Batch A's corresponding p95 values were 0/0.2/0.1 ms. These are measured timer-resolution limits, not unavailable data. Large PNG/JPEG/WebP combined medians were 7.9/79.1/150.8 ms in B versus approximately 8.7/85.0/125.5 ms in A (n=6 each), showing codec/environment variability rather than a supported quality tradeoff. Current large-PNG native request construction remained about 1.9–2.0 ms median; no new serialization optimization is justified.

The [retained unchanged-method output](../tests/performance/results/m14-q-historical-method-evidence.json) has 500 warm Text samples per path, medians/p95 0 ms, and maxima 0.1/0.3/0.1 ms. Historical M14-P.1/M14-P.6 environment/method limitations remain; no percentage comparison against zero is valid. The controlled trigger evidence contains 7,680 invocations across five contexts and 48 scenarios each, with first-use/warmup/warm phases separated. Sampled accepted 10,000-catalog input/rich warm handler medians remain 0–0.1 ms; fake transport/cleanup totals are not actual clipboard or OS insertion timings. Full matrix review is complete: all 2,560 accepted invocations prevented Space synchronously and retained exact cleanup; clipboard-only uses one mocked activation request, automatic uses activation plus one finalize request. All 5,120 ordinary/unknown invocations made no delivery calls and did not prevent input. Across warm distributions, accepted synchronous medians ranged 0–0.1 ms, maximum p95 0.2 ms and maximum individual sample 0.6 ms. At 10,000 catalog entries, ordinary/unknown medians were 0 ms. These are controlled handler measurements, not trusted-event end-to-end results. Raw phases show one first-use, one excluded warmup, then 30 warm invocations despite the legacy field `warmups: 2`, which counts both pre-warm invocations.

Thirty warm-OS-cache capability launches measured median **79.0142 ms**, p95 **87.6848 ms**, max **97.8292 ms**, preceded by five exploratory launches. All 35 completed. This process/protocol interval excludes clipboard/paste and uses the existing published executable whose hashes are retained. Later native build/test does not retroactively establish that binary's exact provenance. Startup remains accepted one-shot cost under Decision 57.

`BrowserImagePngPreparer.prepare` in `src/infrastructure/clipboard/browser-image-png-preparer.ts` performs genuine decode/re-encode and closes its bitmap/resets canvas dimensions in `finally` paths. Source lifetime review is not native/GPU peak profiling. The accepted optimized large-PNG native request construction remains about 1.9–2.0 ms; the legacy historical comparison is approximately 125 ms under its own method. No new optimization was implemented. M14-P.1/M14-P.6 comparisons remain environment/method limited: no meaningful internal Text regression is shown, but no new real end-to-end guarantee is established.

## Supplemental completed gaps after integrity verification

These runs filled remaining gaps without repeating completed expensive batches. All completed with no recorded operation failure. Near-cap and mapping ran hours after earlier repeats; cross-session timing subtraction is invalid.

| Near-cap operation | n | Median ms | Maximum ms |
| --- | --- | --- | --- |
| Snapshot | 3 | 63.6 | 72.7 |
| Stringify | 3 | 48.6 | 48.6 |
| Canonical Backup | 3 | 530.1 | 1,076.3 |
| Parse/validate | 3 | 36.3 | 44.1 |
| Prepare import | 3 | 343.0 | 400.3 |
| Atomic restore | 3 | 118.0 | 126.0 |

The valid near-cap fixture is one 94 MiB Text body (98,566,144 bytes), serialized v7 size 98,566,766 bytes below the unchanged 96 MiB cap. It stresses payload bytes; 10,000-record restore stresses record/index work. The different restore times are not contradictory. Maximum sampled stage-boundary JS heap was **989,396,528 bytes** (about 943.6 MiB), not true peak/total process memory. Observed rAF gaps have 38 samples and maximum 1,061.4 ms across the whole stress window, not operation-specific latency tails. Fixture retention, serialization and GC can contribute; no allocation is individually proven redundant.

Mixed UI: 1,000 Text + nine 64×64 PNG/JPEG/WebP Images, 1,009 entries, 1,745,688 serialized record bytes and 4,883 asset bytes. Five fresh profiles completed; all nine thumbnails decoded at 64×64, live elements 22,233. First seeded Options navigation n=5 median 724.2 ms, max 742.0. Warm n=30 median/p95/max ms: Options 1,089.8/1,542.4/1,562.1; common search 1,145.8/1,557.5/1,636.3; rare 33.9/44.3/49.9; no-match 29.9/44.6/125.4; Images filter 40.3/54.6/55.7; Panel 47.6/79.2/81.3; Text Edit 107.9/150.2/251.0; typing protocol 53.4/81.8/107.5; Save 278.9/319.4/324.4; scroll 33.4/33.7/33.9. Confirmed Delete was one 154.7 ms event. No p95 applies to first navigation or Delete.

Supplemental Image Edit starts before clicking the retained Image's Edit control and ends after decoded form preview plus at least two animation frames: n=30, median **58.0 ms**, p95 **176.4 ms**, max **240.8 ms**; cancel is untimed. The same small-image mixed fixture is used in a fresh context; this does not characterize multi-megabyte Image Edit.

The lifecycle control's separate 10-second idle windows recorded 9.351 ms without extension and 9.601 ms with it, indicating little renderer work in those observed windows. Protocol typing varied by target/order and does not isolate causal per-keystroke overhead; per-target distributions remain in the diagnostic summary. `content-runtime.ts` owns one `beforeinput`, `focusin` and `pagehide` registration per runtime with disposal/ownership protection. Ordinary input rejects before adapter candidate work. Candidates are bounded to trigger length 32 plus boundary context; DOM-adjacency traversal is not proven constant in node count. No polling/keepalive or new background work was added.

## Coverage and method

| Required area | Completed evidence | Limits / remaining platform evidence |
| --- | --- | --- |
| Startup and idle | Empty/small/stress first seeded Options/Panel navigation, reopen/catalog; extension/no-extension idle renderer windows; five forced worker recoveries in each of two batches | Browser launch, seeded document, warm operation and restart separate. Toolbar activation, closed-UI idle messages/CPU and natural suspension NOT RUN |
| Everyday typing | 100/10,000 catalog, four editor types, ordinary/unknown/accepted, two modes, five contexts; independent extension/no-extension protocol comparisons | Controlled trusted flag; automation/destination overhead not isolated extension overhead |
| Text delivery | Historical method and A/B real serializer/planner, authoritative reads, fake writer, real exact cleanup in controlled trigger fixture; boundary counts | Real offscreen/native transport, clipboard, paste, insertion and Copy feedback NOT RUN |
| Image delivery | 64×64, 640×480, 1440×900 PNG/JPEG/WebP; real guards/decode/re-encode; asset read/request construction; 35 native capability launches | No OS clipboard/paste or real native image-allocation timing |
| Library/authoring | 0/100/1,000/10,000 Text and mixed; search/filter/verified scroll, Text/Image Edit, rich typing, Save/Delete, preview decode; live DOM and separate layout profiling | Usage rendering/source reviewed; no real Copy feedback/usage interaction. Continuous scroll and focus fidelity manual |
| Persistence/retrieval | Real IndexedDB/Dexie open/reopen, reads/writes/catalog/ranking/prompt; missing/valid/stale metadata, reverse-order repeat, boundary call counts | Source scan counts do not measure engine I/O; active generation UI remains future |
| Generated metadata | Fingerprint/parser/conditional save/fake-provider assembly; maximum-20 sequential backfill, cancellation/failure isolation/current skip | No live provider/model or production wiring |
| Backup/restore | Snapshot/stringify/canonical/parse/prepare/atomic restore; Text/mixed/near-cap, rollback/reminder, PNG failure isolation | Download gesture and true peak heap/process/GPU memory NOT RUN; boundary samples/rAF gaps only |
| Lifecycle/resources | Two 50-cycle preview/Options batches, post-GC/live DOM/URL/heap, controlled replacement and unmount | Exact retainers and all subscriptions/timers/native/GPU allocations not exhaustively measured; no leak conclusion |
| Multiple tabs/shared work | One/four tabs, catalog/reload, overlapping Save/typing, five recoveries per batch and corrected completion | Broad iframe topology and real Export/typing NOT RUN; no unsafe paste bursts. No-queue behavior covered by unchanged source/regression gates, not OS stress |
| Build cost | Both extension modes/output checks; entry bytes and eager dependency inspection | Bytes/warnings alone do not establish runtime bottleneck |

Storage interval: `performance.now()` immediately before awaited application operation through resolution/rejection. UI boundaries are stated above. Setup, fixture generation/seeding and declared warmups are excluded. Five reset contexts provide exploratory first-use observations, not hardware-cold boots. Cheap warm paths normally have 30 samples; mixed-storage expensive paths 10; 10,000 UI/restore repeat three to bound audit duration. No p95 inferred from n<20. Near-cap has one fresh context with three measured operations each, not five independent stress contexts. Mapping has a separate first invocation and 30 measured samples without additional warmup. Image Edit has one fresh mixed context and 30 samples. Supplemental observations refine scope/attribution rather than establish population tails.

[Reproduction instructions](../tests/performance/README.md) give exact commands and fresh output labels using existing stack/production boundaries. Storage/browser overwrite guards were exercised without launching measurements. Legacy fixed-output native/trigger/base64 runners require preserving files before a separately authorized repeat. No completed expensive measurement requires rerunning for closeout.

## Evidence inventory and fixtures

Evidence resides under [tests/performance/results](../tests/performance/results/). The [checkpoint inventory](../tests/performance/results/m14-q-checkpoint-inventory.json) is authoritative for COMMIT versus LOCAL ONLY selection, per-file rationale, current sizes and hashes. Raw JSON and original logs remain measurement provenance; presence on disk does not imply checkpoint inclusion. [Final phase-separated tables](../tests/performance/results/m14-q-aggregate-final.md) give n/median/p95/max/failures without pooling methods. [Diagnostic summary](../tests/performance/results/m14-q-diagnostics-summary.json) covers profile/lifecycle/typing/shared/near-cap counters. Older `m14-q-aggregate.md` is an intentionally local-only partial snapshot superseded by the final tables. The [final audit manifest](../tests/performance/results/m14-q-final-manifest.json) is frozen pre-continuation provenance, excluding itself. Its paths include local-only files and its document hashes predate this cleanup; it is not the checkpoint inclusion list. Original/resumed manifests and the historical boundary record remain frozen for the same reason. The README documents verification of a checkout that omits local artifacts.

| Evidence | Status / scope |
| --- | --- |
| `m14-q-delivery-a.json`, `m14-q-delivery-b.json` | COMPLETE independent five-context delivery, first/warm phases and original images |
| `m14-q-storage-a.json` | 20 completed Text sessions at four tiers; five original mixed setups FAILED, retained |
| `m14-q-mixed-fixture-diagnostic.json`, `m14-q-base64.json` | COMPLETE failure diagnostics; product decoder fails 15/15. Diagnostic exit zero is not product success |
| `m14-q-browser-a.json`, `m14-q-browser-a-interruption.json` | PARTIAL: earlier tiers and some 10,000 operations; operator interrupted rare search. That operation/later scenarios INCOMPLETE, not a crash |
| `m14-q-browser-resource-snapshots.json`, `m14-q-browser-process-memory.json` | Historical sampled process observations, no peak/leak attribution |
| `m14-q-browser-lifecycle.json` | FAILED zero-height rich target; four completed no-extension distributions only |
| `m14-q-trigger.json`, `m14-q-native.json` | COMPLETE controlled trigger matrix and capability-only startup |
| `m14-q-storage-repeat.json` | COMPLETE independent 1,000/10,000 storage/retrieval plus separate hook/call diagnostics |
| `m14-q-browser-repeat.json` | COMPLETE 1,000/10,000 UI repeat including rare/filter/Edit/typing/Save/Delete; finished before interruption |
| `m14-q-browser-profile.json` | COMPLETE independent instrumented layout pass, separate from UI latency |
| `m14-q-browser-lifecycle-resume.json`, `m14-q-browser-lifecycle-control.json` | COMPLETE corrected fixture/control, 50 cycles each, tabs/recovery |
| `m14-q-storage-mixed.json` | COMPLETE five contexts; 1,000 Text + eight Images + one Knowledge; only known failing large PNG excluded |
| `m14-q-storage-near.json`, `m14-q-storage-mapping.json` | COMPLETE after integrity-first resumption; byte stress/mapping gaps only |
| `m14-q-browser-mixed.json`, `m14-q-browser-image-edit.json` | COMPLETE after resumption; five-profile mixed UI and supplemental Image Edit |
| `pause-command-evidence/`, `resume-command-evidence/` | Exact commands, available output and elapsed/exit metadata; original failures/warnings retained |

Storage Text v7 bytes at 0/100/1,000/10,000: 385 / 161,725 / 1,626,175 / 16,297,675; rendered Text UTF-8: 0 / 111,871 / 1,129,171 / 11,311,171. Nonempty storage tiers retain one Knowledge compatibility record. Deterministic fixtures alternate short/long rich content, lists, links and Unicode with common/rare/no-match queries. Image seed `0x9e3779b9 xor width xor (height << 16)` uses the original M14-P.1 algorithm, quality 0.88 for encoded comparisons. Individual dimensions/MIME/encoded bytes and preparation results remain in delivery JSON; no image was resized to improve timing. Mixed storage has 3,610,967 asset bytes and 6,444,956 v7 bytes. UI fixture byte sizes differ as stated above.

## Classified findings and proposed follow-up

All priorities are **PROPOSED / UNAPPROVED / UNSCHEDULED** audit advice. No new milestone is allocated. Benefit/effort estimates are qualitative; no speedup percentage is promised. Source references identify observed boundaries, not permission to edit them.

| ID / classification / confidence | Workflow, source and evidence | Smallest proposal, benefit, effort and risks | Priority / approval and validation |
| --- | --- | --- | --- |
| **M14-Q-F1 — confirmed bottleneck; high for synthetic scaling, medium for exact attribution** | Library navigation/common search; `src/ui/snippet/SnippetLibraryView.tsx` `visibleEntries.map` and Text projection. A/repeat common 10,000-row medians 8.27/13.47 s; repeat n=3 max 13.78 s. 220,035 live elements; separate n=3 layout 4.40–5.54 s. Browser `repeat` and separate `profile` | Review a bounded rendering change focused on demonstrated all-visible-row layout before selecting implementation. Could materially lower multi-second stalls; measured layout is not guaranteed savings. Medium effort; risks to focus/accessibility, complete search, stable-ID actions, scroll, usage, image ownership | **Next focused task**, after PNG review. Separate authorization, real Chrome interactions/accessibility tests. No schema/permissions/design change expected for scoped rendering; any expansion requires approval |
| **M14-Q-F2 — confirmed bottleneck; high for duration, medium for engine cause** | Atomic restore; `src/infrastructure/persistence/dexie-backup-persistence.ts` `DexieTransactionalBackupRestorePort.replaceAll`. A n=10 median 27.64 s/max 33.91; repeat n=3 26.02/max 30.90. Hook Snippet stage 30.386 s; separate mapping n=30 median 34.5 ms/p95 48.9. Storage `repeat`, `mapping` | Further bounded browser/index-write attribution through existing hooks before production changes. Potentially reduce long import stalls; removable cost unproven. Small diagnostic effort, implementation unknown. Risks: atomicity, ownership, rollback, compatibility/reminders | **Further measurement needed**. Separate authorization; schema/index/migration/transaction redesign needs architecture approval. Require real IndexedDB large restore, fault/rollback, v1–v7 and real import UI tests |
| **M14-Q-F3 — confirmed bottleneck (correctness/resource-limit blocker); high for decoder boundary, medium for regex-engine cause** | Image Backup; `src/application/backup/base64.ts` `decodeCanonicalBase64`, reached through Backup service/v7 validator. Valid 1440×900 PNG 4,459,989 bytes (<5 MiB); 5,946,652 canonical base64 chars. Asset validation passes; all 15 decoder attempts/five contexts throw `RangeError: Maximum call stack size exceeded`; `atob` reconstructs every byte. Preserved base64/fixture diagnostic | Separately authorized decoder correctness fix with identical acceptance rules. Benefit is successful valid export, not milliseconds. Small-to-medium estimated effort. Grouped regex is leading source hypothesis; precise engine cause not isolated independently. Risks: accepting malformed/noncanonical input, allocations, historical Backup/image limits | **First next focused task proposed** because valid data cannot export. No Backup version/schema/permission change proposed; contract changes need separate approval. Test original PNG, malformed/noncanonical/limit cases, historical imports and real export/import. Failure remains unfixed |
| **M14-Q-F4 — supported scaling risk; high for whole-Library work, medium for benefit** | Headless `src/application/retrieval/retrieval-engine.ts` `retrieve`/`retrieveSnippets`; authored `DexieSnippetEntryRepository.create/update` in `src/infrastructure/persistence/dexie-snippet-entry-repository.ts`. 10,000 repeat stale/valid/missing medians 1,063.6/956.5/719.2 ms n=3; five retrievals hash 50,000 candidates. Repeat list/catalog/create-delete/update medians 345.6/401.5/230.3/225.0 ms. Direct reads/fake delivery ~0.2–0.3 ms. Storage `a`, `repeat` | Later profile repeated projection/graph work before selecting an improvement. Benefit likely at large Libraries or activated headless retrieval. Medium/unknown effort. No speculative cache/index: preserve freshness, deterministic ranking, Knowledge and deletion consistency | **Later**, evidence-dependent; no M15 authorization. Cache/index/schema contracts need design review; require 5/3/1/1 ranking, stale/current sidecars and delivery isolation tests |
| **M14-Q-F5 — accepted cost/no action; high for internal stages** | `src/application/snippet/snippet-delivery-planner.ts` `SnippetDeliveryPlanner`, Text serialization, `BrowserImagePngPreparer.prepare`. Five-context A/B, 30 warm Text samples, medians 0/p95 0–0.2 ms. Large JPEG/WebP B combined medians 79.1/150.8 ms n=6 | No Text micro-optimization; retain genuine Image decode/quality/guards. No worthwhile measured Text saving. Quality reduction or bypassing validation sacrifices correctness; cache/rewrite effort unjustified | **No action**. Actual clipboard/native/destination timing manual pending; future changes need real-browser fidelity and Decision 42 tests |
| **M14-Q-F6 — accepted cost/no action; medium for published binary applicability** | Native process/protocol capability through existing `native/windows-clipboard-companion/src/AI.SupportWorkspace.ClipboardCompanion/Program.cs` entrypoint; runner `run-m14-q-native.mjs`, n=30 median 79.01/p95 87.68/max 97.83 ms | Retain one-shot host. Persistent-host redesign adds lifecycle/privacy/maintenance cost without new end-to-end benefit evidence | **No action**, Decision 57 stands. Any architecture/protocol/permissions redesign needs Principal approval plus new native/destination evidence |
| **M14-Q-F7 — accepted cost/no action; medium; production-leak theory unverified** | `SnippetLibraryView` preview effects, content-runtime disposal and Save. Controlled nodes/listeners flat cycles 10/25/50; URLs zero after unmount. Corrected four-tab overlap n=5 median 63.8 ms | No production leak or multi-tab latency fix based on instrumentation effects. Exact retainer/memory checks remain gaps. No quantified saving; speculative cleanup risks releasing live images/dropping events | **No action** absent new controlled evidence. Real-browser lifecycle/retainer checks before production changes; no architecture/permissions proposal |
| **M14-Q-F8 — supported scaling risk; exploratory confidence** | `src/application/backup/backup-service.ts` `BackupV7CreationService.create`, `backup-validator.ts` and `DexieTransactionalBackupRestorePort.replaceAll`; storage `near`, one 94 MiB Text record, n=3 successful operations; sampled heap up to 989.4 MB and frame gap 1.06 s | Further true-peak/allocation and user-gesture profiling before a memory change. Potentially fewer near-limit stalls, no buffer proven redundant. Small diagnostic effort, implementation unknown; preserve 96 MiB/canonical/atomicity contracts | **Further measurement needed**, below reproduced blockers. Separate approval for any contract/transaction change; real Chrome download/import and peak process/heap profiling |
| **M14-Q-F9 — unverified hypothesis; low runtime confidence** | Options 600,281-byte chunk/shared UI 190,148 bytes; `src/extension/options/main.tsx`/`src/extension/sidepanel/main.tsx` eager imports. Final build inventory | No generic code-splitting/memoization rewrite from bytes alone. Measure parse/evaluate/mount only if practical startup concerns remain after F1 review. Benefit unknown; lazy loading can shift authoring delay/add maintenance | **No action now**; measurement before proposal. Future loading changes need production/real-browser first-open validation; no architecture/schema/permission change proposed |

Healthy boundaries: three delivery paths perform three authoritative reads without generated-metadata read/hash. Optional sidecars stay outside delivery. Backfill maximum 20/concurrency one, cancellation, isolated failure/current skip, rollback and local reminders pass. No live provider/model or background work was added. Library Copy remains clipboard-only without usage increment by unchanged source/regression coverage; fake-writer timing is not real Copy feedback.

Declined: percentage claims against 0 ms; downsampling/quality reduction/MIME relabeling; skipped guards/canonical validation; speculative caches/indexes/rewrites; persistent native processes/keepalives; leak fixes based on accumulated counters; M15 activation from dormant headless code.

## Validation, failures and tool limitations

Required repository commands were executed, including actual Playwright execution rather than discovery. Normal Vitest ran with `OLLAMA_LIVE_MODEL` empty; no live provider test was enabled. Final command elapsed/exit metadata and selected stdout/stderr with unique native/e2e validation or correction diagnostics are retained under `resume-command-evidence/`. Per Principal disposition, raw `build-final.txt`, `build-native-dev-final.txt` and `test-final.txt` remain unchanged and LOCAL ONLY; their command/exit/time JSON, build-output hashes, and the existing validation counts/warnings in this report remain retained. Other redundant output is local-only as classified in the checkpoint inventory. Tooling durations are not product latency.

| Command / final log label | Actual result | Command elapsed s |
| --- | --- | --- |
| `pnpm.cmd lint` / `lint-final` | PASS; no warnings | 7.433 |
| `pnpm.cmd typecheck` / `typecheck-final` | PASS | 12.442 |
| `pnpm.cmd test` / `test-final` | 68 files / 876 tests PASS; one file/test skipped (69 / 877 total) | 35.254 |
| `pnpm.cmd test:e2e` / `e2e-final` | 1 executed/passed; configured toolchain smoke only | 2.455 |
| `pnpm.cmd build:native-dev` / `build-native-dev-final` | PASS including output validator | 27.837 |
| `pnpm.cmd build` / `build-final` | PASS including output validator | 2.515 |
| `dotnet restore <solution>` / `native-restore-final` | PASS | 3.309 |
| `dotnet build <solution> -c Release --no-restore` / `native-build-final` | PASS; 0 warnings/errors | 8.031 |
| `dotnet test <solution> -c Release --no-build` / `native-test-final` | 126 passed; 0 failed/skipped | 5.504 |
| `node tests/performance/verify-m14-q-measurement.mjs` / `integrity-final` | PASS: fixture/sample/actual-scroll integrity | 1.084 |
| `node tests/performance/verify-m14-q-evidence.mjs` / `evidence-final` | PASS: preserved hashes, completed batches, 7,680 trigger outcomes, overwrite guards | 0.946 |
| `git fsck --full` / `fsck-final` | PASS exit 0; dangling objects, no corruption diagnostic | 1.674 |

Solution: `native/windows-clipboard-companion/AI.SupportWorkspace.ClipboardCompanion.sln`. Post-documentation checks passed: full formatting with the explicit ignore command (`format-final`, 3.157 s), lint after final helper edits (`lint-closeout`, 6.595 s), and `git diff --check` (`diff-check-final`, 0.053 s). Their compact JSON metadata is retained alongside the tabled commands; duplicate successful console logs remain local-only. Final boundary/hash review follows all documentation edits; its status is linked below.

Initial lint failed on 109 missing-global declarations in new audit JavaScript only. Explicit browser globals/Node imports corrected the harness; no production/root lint config changed. Initial formatting failed on 94 files because custom ignore paths disabled `.gitignore`, the nested results exclusion was incorrectly rooted, and new audit code needed formatting. Corrected command: `pnpm.cmd format --check --ignore-path .gitignore --ignore-path .prettierignore --ignore-path tests/performance/.prettierignore`. Only immutable `tests/performance/results/` is additionally excluded. Audit code was formatted; root policy already excludes `docs/` and README files, so documentation received a separate Markdown/consistency review; **raw evidence was never formatted**. Failed logs remain intact; the initial lint/format failure text is proposed for commit to preserve the correction diagnostics.

Sample/scroll and zero-height corrections were verified before replacement measurements. Formerly unexecuted near/mapping/mixed UI/profile/lifecycle-control modes, summary/aggregation/logger helpers and overwrite guards have now executed. Final declarations/formatting do not alter timing boundaries; focused integrity and typecheck passed. No valid measurement was regenerated to hide a failure.

Retained historical failures: five original mixed setups, decoder 15/15, intentionally interrupted UI A operation, zero-height lifecycle fixture timeout. Browser A's detached/reset CDP TaskDuration deltas are **invalid CPU evidence**; persistent-session/live-DOM diagnostics replace that inference. Partial lifecycle baseline is not extension-overhead evidence. [Log limitations](../tests/performance/results/m14-q-command-log-limitations.md) identify mixed-encoding/header-only originals and locked PowerShell append failures for near/mapping. Complete measurement JSON and separate exit/time metadata survive; missing stdout was not invented.

Warnings retained: Node DEP0190 for fixed pnpm shell arguments, Playwright color-environment warning, Vite chunk warning and Git dangling objects (no metadata cleanup). Native restore printed .NET first-run setup, including an ASP.NET HTTPS development-certificate installation message and SDK telemetry notice. This was an SDK bootstrap side effect of native validation, not companion install/registration or a product feature. No certificate-trust command, machine-setting command, product telemetry or cleanup was issued. The notice alone does not establish whether SDK-internal telemetry transmitted.

## Production build and startup dependencies

[Final build inventory/hashes](../tests/performance/results/m14-q-build-output.json) records both modes. Production is `.output/chrome-mv3`; native-development is `.output/chrome-mv3-native-dev`. The draft README's shared-output-directory wording was corrected from actual build evidence. Production was built last. Existing output validators pass; no audit import was added to production source or entry points.

Production uncompressed bytes: content script **42,559**, background **167,157**, Options chunk **600,281**, Side Panel **5,641**, shared UI **190,148**, offscreen **1,047**, CSS **23,755**, manifest **816**. Observed directory total 1,034,883 includes two 106-byte Drive `desktop.ini` files; emitted application files sum to 1,034,671. Native-development total 1,312,412 includes the same 212 metadata bytes; content 48,902, background 189,628, Options 628,392, shared UI 387,301. Metadata was observed, not deleted.

Options eagerly loads the editor/management tree and preloads shared UI; Side Panel preloads the same shared chunk with a small presentation entry. Source imports keep React/editor/Dexie-heavy UI code outside the content-script dependency graph; worker persistence/delivery is separate. Shared chunks avoid repeating those bytes per UI page within a build; no exhaustive module-duplication runtime cost was measured. The >500 kB warning is not proof of a parse/startup bottleneck. Repeated DOM/layout work in F1 is better evidenced than a loading rewrite.

## Documentation Impact Review and final task state

Principal has accepted the diagnostic findings and completed Documentation Impact Review, as supplied for this continuation. Manual/implementation/checkpoint gates remain separate; the general implementation checklist does not authorize Git actions here.

| Document / family | Review outcome |
| --- | --- |
| `PERFORMANCE_AUDIT_M14-Q.md` | Final measurements, findings, commands/results, historical failures, coverage limits, manual plan, continuity and self-check |
| `PROJECT_STATE.md` | M14-Q Principal-reviewed / technically approved; checkpoint unauthorized; preserved M14-P approval/M15 NOT STARTED |
| `ROADMAP.md` | Same supplemental M14-Q; findings accepted, checkpoint inventory/authorization pending, no new task or implementation scheduled |
| `CHANGELOG.md` | Audit results, harness-only corrections, limits, validation and review outcome |
| `BACKLOG.md` | Evidence-backed F1/F2/F3/F4/F8 proposals only, all proposed/unapproved/unscheduled |
| `TESTING_STRATEGY.md`, `tests/performance/README.md` | Reusable opt-in commands, correct output/format exclusions, provenance/platform limits, no timing CI gates |
| `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `DECISIONS.md` | Reviewed, no update needed: no architecture/schema/index/migration/Backup/native contract changes; Decisions 42/45/57 and historical approvals preserved |
| `PRODUCT_REQUIREMENTS.md`, `PRODUCT_VISION.md`, `UI_WORKFLOW.md` | Reviewed, no update needed: no new behavior, supported limit, workflow, quality or product requirement; synthetic tiers are audit assumptions |
| `DESTINATION_COMPATIBILITY.md`, `NATIVE_CLIPBOARD_COMPANION_ARCHITECTURE.md`, `NATIVE_IMAGE_CLIPBOARD_FEASIBILITY.md` | Reviewed, no update needed: no new real destination/native design/distribution claim; manual gaps here |
| `CODING_AGENT_RULES.md`, `ENGINEERING_PRINCIPLES.md`, root `README.md` | Reviewed, no workflow/principle/setup change needed; explicit M14-Q scope authorizes diagnostics and prohibits checkpoint/push |

No remaining internal measurement, independent repeat, analysis or validation is scheduled by this report. Residual limits are the manual plan, historical source/log provenance, sampled rather than true peak memory, and deeper attribution assigned to proposed future diagnostics. The PNG defect remains a product issue for Principal, not an incomplete harness run. Audit-performed status does not mean every product path passed, or manual approval/checkpoint is complete.

The proposed files are the six authorized docs plus only COMMIT rows in the checkpoint inventory under `tests/performance/`; LOCAL ONLY rows are intentionally excluded. Existing production benchmark files remain unchanged. Starting/final audit branch and HEAD match; the historical audit index was empty. Current corrected staging is recorded above. The historical `m14-q-final-git-status.txt` remains local-only; its intended dirty paths are already preserved in the committed [historical boundary review](../tests/performance/results/m14-q-final-boundary-review.json). Current checkpoint-content status is recorded in the final result above and in the inventory. No production source changes, staging, commit or push occurred.

## Ordered manual Windows Chrome / Intercom / Crisp plan

All checks below are **PENDING / NOT RUN for M14-Q**. Earlier M14-P manual PASS remains approved but supplies no new audit timings. Use a disposable Chrome profile and an explicitly operated test editor with synthetic content; do not send messages. A registered companion may be used only if already available; this audit does not install or register one.

1. Open Chrome with the production extension, then use the toolbar to open the Side Panel and its gear to open Options. Repeat after closing each surface, at the intended synthetic Library size. Record click-to-usable latency and visual stalls. This resolves the native toolbar/panel activation gap left by direct document navigation.
2. With DevTools closed, leave all extension UIs closed, first with no eligible tab and then with several synthetic tabs. Observe Chrome Task Manager CPU/memory over an idle interval; reopen and type after worker suspension. Record observation duration and worker-recovery behavior. This resolves natural suspension, closed-UI CPU, and debugger-retention uncertainty.
3. In disposable Intercom and Crisp editors, type ordinary text, an unknown trigger, and accepted plain/rich triggers in both delivery modes. Explicitly operate any clipboard write/paste. Record activation-to-notice/paste-issued and visible insertion separately; inspect surrounding text, caret, lists, links, and Unicode. This resolves trusted browser-event routing, real offscreen transport, destination fidelity, and OS insertion latency.
4. Repeat Image trigger and Library Copy with the recorded PNG/JPEG/WebP dimensions. Inspect visible image dimensions/quality, representations, native startup, and transport. Library Copy must remain clipboard-only and leave usage unchanged. This resolves real native image allocations, clipboard-write cost, and destination image semantics.
5. At 100, 1,000, and the safely bounded larger tier, filter common/rare/no-match results, scroll, type in the rich editor, Save, and confirm Delete. Compare with the synthetic browser timings. Use a separate profiling pass to attribute long tasks to row construction/projection, React reconciliation, style/layout, or persistence; do not mix profiler timings into uninstrumented latency results.
6. Repeat retained-preview edit, replace, cancel, and reopen cycles with Task Manager/heap tooling in a separate diagnostic session. Inspect post-cleanup retained objects, detached nodes, image/GPU allocations, listeners, and object URLs. A single rising memory reading is insufficient to establish a leak.
7. Explicitly export a synthetic Backup v7 through its download control, then validate/restore in the same disposable profile. For a near-limit payload, observe UI stalls and separately profile peak process/heap memory. Verify local reminder ownership, no automatic-backup reactivation, and restored data. This resolves user-gesture/download behavior and true peak memory beyond sampled renderer counters.

## Principal-readiness review

The final independent review checks exact M14-Q identity, authoritative document consistency, scope/intended files, unchanged production/contracts, current validation counts, immutable original/resumed evidence, unchanged HEAD and empty index. No internal audit blocker remains. Listed manual/platform limits and unapproved recommendations do not claim product/manual approval or checkpoint authorization.

Principal-readiness self-check: PASS

Next: Principal Git checkpoint authorization for the corrected 106-file set. Do not stage, commit, push, implement a recommendation or start M15.
