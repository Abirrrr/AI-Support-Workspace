# Project State

## Product Identity and Purpose

- AI Support Workspace is a long-lived, local-first Chrome extension for support work. It combines locally managed Knowledge and reusable Snippets, deterministic retrieval and prompt composition, local Ollama-assisted drafting in a Chrome Side Panel, explicit selected-text capture, local Settings, backup/restore, and safe Snippet trigger expansion in supported web editors.
- User-controlled support data remains local by default. The product has no hosted backend, cloud synchronization, telemetry, editor-content logging, or silent provider transmission.

## Current Milestone

- M14-M.4 — Git Metadata Environment Documentation
- Status: **COMPLETE / DOCUMENTATION ONLY / AWAITING PRINCIPAL REVIEW**. Starting checkpoint `2475f8b` is synchronized. The working tree remains in the synchronized Google Drive project directory, while Git metadata now resides in a separate local non-synchronized directory referenced by the project-root `.git` pointer file. M14-M.3/M14-M.3.1 remains the preceding product checkpoint; M14-N Automatic Backup remains the next product implementation milestone and is not started.

## Task State

### M14-M.4 — Git Metadata Environment Documentation

```text
Active task: M14-M.4 — Git Metadata Environment Documentation
Starting checkpoint: 2475f8b — feat: add snippet usage statistics
Starting tree: clean; master synchronized with origin/master; git fsck acceptable

Separate Git metadata relocation: COMPLETE
Project-root .git: POINTER FILE
Canonical Git-directory discovery: git rev-parse --absolute-git-dir
Working tree: SYNCHRONIZED GOOGLE DRIVE PROJECT DIRECTORY
Git metadata: SEPARATE LOCAL NON-SYNCHRONIZED DIRECTORY
M14-M.3/M14-M.3.1: PRECEDING PRODUCT CHECKPOINT
M14-N Automatic Backup: NEXT PRODUCT IMPLEMENTATION / NOT STARTED
Source/tests/schema/permissions/dependencies/build configuration: UNCHANGED
Staging/commit/push: NONE
```

The repository now permanently uses Git's separate-git-dir mechanism. The project-root `.git` is a pointer file, not a Git metadata directory; `git rev-parse --absolute-git-dir` is the canonical discovery command. The working tree may remain synchronized by Google Drive, but the resolved Git directory is local operational state outside that synchronized tree and is not a portable project artifact.

The relocation mitigates the former sync-provider contamination path. Under the previous layout, Google Drive repeatedly created `desktop.ini` files within Git refs and object metadata, producing failures including `badRefContent`, `invalid sha1 pointer`, and `bad sha1 file`. Routine recursive `.git/**/desktop.ini` sweeping is retired: agents must not assume `.git` is a directory or delete/recreate the pointer as cleanup. Repository integrity validation uses `git fsck --full`; direct metadata inspection first resolves the actual directory and requires deliberate Principal authorization.

GitHub remains the authoritative remote Git history and supports normal clone/recovery. Google Drive may synchronize working-tree project files, repository documentation remains the project continuity source of truth, and the external Git metadata directory is not expected to be synchronized. Repository-local `maintenance.auto = false` and `gc.auto = 0` remain unchanged operational settings retained from the former Google Drive metadata issue. They are not product-architecture requirements; changing them requires deliberate engineering review.

### M14-M.3 — Snippet Usage Statistics Behavior

```text
Active task: M14-M.3 — Snippet Usage Statistics Behavior
Starting checkpoint: f4d9ab0 — docs: record real-world snippet completion feedback
Starting tree: clean; master synchronized with origin/master; git fsck acceptable

M14-M.0: PASS / REAL-CHROME VALIDATED
Dexie physical version: 6
Canonical Backup version: 7
Receipt lifetime: 30 seconds / transient service-worker memory
Count authority: clipboard success + exact trigger cleanup + matching receipt consume
Text/Image and clipboard-only/automatic parity: IMPLEMENTED
Library display: numeric count only; absent sidecar = 0; accessible label = Usage count: <count>
Automatic backup/generated tags/F1/F2/M15: NOT IMPLEMENTED
Permissions/dependencies: UNCHANGED
Staging/commit/push: NONE
```

M14-M.3 adds a service-worker-owned random one-use receipt only after authoritative clipboard preparation succeeds. The receipt is bound to request ID, Snippet ID, Text/Image delivery kind, exact sender document/frame/tab/window identity, catalog epoch/revision, and a 30-second expiry. The content frame sends the separate acknowledgement only after exact cleanup succeeds. A matching acknowledgement consumes at most once, cannot be replayed, and uses the service-worker acknowledgement clock; loss of transient receipt state across worker recreation safely undercounts and never reconstructs or fabricates usage.

Accepted receipt consumption starts best-effort `recordUse(snippetId, usedAt)` without waiting for persistence before delivery/finalization continues. One Dexie transaction creates count 1 or increments and updates `lastUsedAt`; concurrent calls do not lose increments, and `Number.MAX_SAFE_INTEGER` saturates while the timestamp advances. Failure is swallowed with no retry or replay and cannot change clipboard success, cleanup, notice, or automatic-paste outcome. Usage remains exclusively in the sidecar: authored fields/timestamps, assets, generated metadata, trigger catalog, and retrieval scoring are untouched. After M14-M.3.1, the Library joins sidecars and displays only the numeric count, with `0` for absence, an accessible count label, and no usage sorting/dashboard/history.

### M14-M.2 — Real-World Snippet Feedback & Completion-Gate Recording

```text
Active task: M14-M.2 — documentation-only feedback and completion-gate recording
Starting checkpoint: 20b509c — feat: add snippet hardening data foundation
Starting tree: clean; master synchronized with origin/master

M14-M.1/M14-M.1.1 checkpoint: 20b509c
Dexie physical version: 6
Canonical Backup version: 7
M14-M.0: PASS / REAL-CHROME VALIDATED
Next implementation work: M14-M usage behavior
F1/F2 implementation: DEFERRED TO PRE-M14-P CLOSEOUT
F3 implementation: M15
Source/tests/schema/permissions/dependencies: UNCHANGED
Staging/commit/push: NONE
```

First daily-use feedback is now durable project input. **F1 — Link visual treatment:** text carrying the existing safe-link mark should appear blue and underlined in the Snippet rich-text editor. This is presentation of the existing link semantic, not approval for arbitrary colors, general underline formatting, broader typography, or a persisted Rich Text domain change. **F2 — Edit navigation/focus:** choosing Edit should load the existing Snippet, bring the editor into view, and focus the primary appropriate editor field through accessible deterministic lifecycle behavior without an arbitrary timing hack, data change, or route redesign. Both are daily-use Snippet UX issues that must be resolved before final M14-P closeout.

**F3 — Save Generated Output as Snippet** belongs to M15, not current Snippet hardening. The future Generated Output header provides **Save as Snippet** and **Copy**. Save as Snippet opens or navigates to Text Snippet authoring with the current generated response prefilled; the user may edit title, trigger, tags, and content, and only an explicit user Save creates the Snippet. Generation success alone never creates or silently saves a reusable record.

M15 cannot begin until the Snippet subsystem is stabilized for daily use and M14-P closes. The final gate reviews Text and Image Snippets, authoring, activation, clipboard-only and automatic delivery, destination compatibility, lifecycle recovery, usage, automatic backup, generated retrieval tags, import/export, real-world feedback, user-visible performance, regressions, and documentation consistency. Class-C performance opportunities remain deferred during active hardening foundations, but M14-P must re-measure real-world delivery; a meaningful remaining user-visible delay triggers a focused pre-M15 optimization gate rather than automatic post-M15 deferral. M14-M.2 assigns no optimization implementation ID.

### M14-M.1.1 — Backup Cadence & Local Authority Ownership Correction

```text
Active task: M14-M.1.1 — focused correction to the unstaged M14-M.1 foundation
Starting checkpoint: a4619ec — test: validate selected-folder backup feasibility
Input worktree: existing unstaged M14-M.1 implementation preserved

Cadence contract: off | daily | weekly
Default for new/historical/v1-v6: weekly
Portable restore ownership: Knowledge, Snippets/assets, Settings, usage, generated metadata
Machine-local automaticBackupState: PRESERVED INDEPENDENTLY
Dexie physical version: 6
Canonical Backup version: 7
Permissions/dependencies: UNCHANGED
Staging/commit/push: NONE
```

M14-M.1.1 corrects two ownership details without redesigning the foundation. `automaticBackupCadence` explicitly supports `off`, `daily`, and `weekly`, with `weekly` still the default for new profiles, historical Settings lacking the field, and Backup v1-v6 imports. `off` is a portable preference and is never inferred from missing local authorization.

Portable restore remains atomic across Knowledge, Snippets, assets, Settings, usage statistics, and generated metadata. It does not include, clear, replace, or create the machine/profile-local `automaticBackupState`. Existing selected-folder authorization survives imports independently; imported `off` disables future writing without deleting that authorization, while imported `daily`/`weekly` with no local authorization fabricates none. Backup v7 exact-key validation rejects attempted local-authority fields.

### M14-M.1 — Coordinated Dexie v6 / Backup v7 Data Foundation

```text
Active task: M14-M.1 — Coordinated Dexie v6 / Backup v7 Data Foundation
Starting checkpoint: a4619ec — test: validate selected-folder backup feasibility
Starting tree: clean; master synchronized with origin/master; git fsck acceptable

M14-M.0: PASS / REAL-CHROME VALIDATED
M14-L architecture: PRESERVED
M14-M.1 implementation: COMPLETE / AUTOMATED PASS / CHECKPOINTED AT 20b509c
M14-M/M14-N/M14-O/M14-P: NOT STARTED
M15 AI drafting: NOT STARTED

Current physical Dexie: 6
Current canonical Backup: 7
Manifest permission addition: NONE
Alarms/downloads: NONE
Staging/commit/push: NONE
```

M14-M.1 implements the coordinated additive foundation: Dexie v6 adds empty `snippetUsageStats`, `snippetGeneratedMetadata`, and singleton `automaticBackupState` stores; historical Settings migrate to preferred cadence `weekly`; new and absent Settings also resolve to `weekly`; authored Knowledge, Snippets, timestamps, tags, triggers, assets, and existing Settings survive unchanged. Focused repositories keep Dexie out of future M14-M/M14-N/M14-O application logic. Snippet deletion atomically cascades both sidecars with existing asset ownership, and material Text source edits invalidate generated metadata while trigger-only edits preserve it.

Canonical Backup v7 retains every v6 recovery domain and the 96 MiB guard, adds strict manual/automatic backup identity metadata, portable cadence, usage, and generated metadata with deterministic sidecar ordering, and keeps v1-v6 frozen/importable. As corrected by M14-M.1.1, restore validates all new data before one transaction across Knowledge, Snippets, assets, Settings, usage, and generated metadata while preserving the independently owned local automatic-backup singleton. A restored cadence cannot restore or grant filesystem authority.

This task adds no delivery receipt or usage increment, no usage UI, no folder picker product UI, no scheduler/alarm/file output/retention, no generated-tag provider call, no retrieval scoring change, no Knowledge deletion, and no M15 Workspace work. The M14-M.0 native-dev diagnostic remains production-excluded, and different-folder identity remains unproven/deferred to M14-N.

### M14-M.0 — Selected-Folder Backup Feasibility Gate

```text
Completed task: M14-M.0 — Selected-Folder Backup Feasibility Gate
Starting checkpoint: 5450cff — docs: define snippet hardening architecture
Starting tree: clean; master synchronized with origin/master; git fsck acceptable

M14-K: CLOSED / COMPLETE / REAL-BROWSER VALIDATED
M14-L: CHECKPOINT PRESERVED
M14-M.0: PASS / REAL-CHROME VALIDATED
M14-M.1/M14-M/M14-N/M14-O/M14-P: NOT STARTED
M15 AI drafting: NOT STARTED

Current physical Dexie: 5
Current canonical Backup: 6
Production schema/Settings migration: NONE
Manifest permission addition: NONE
Alarms/downloads: NONE
Staging/commit/push: NONE
```

The native-development Options diagnostic invokes `showDirectoryPicker({mode:'readwrite'})` directly from an explicit click and stores only its task-scoped state in `ai-support-workspace-selected-folder-feasibility-v1`, separate from production Dexie. The service worker independently recovers the handle, queries permission without prompting, collision-checks a cryptographically random exact test name, creates/writes/closes/reopens/reads/verifies it, and removes only that run-owned artifact. Same/different-folder checks use `isSameEntry`; reauthorization is an explicit Options click; revoked/unavailable checks perform no write when authority is not `granted`. The report contains classifications and booleans only—never paths, folder names, listings, unrelated filenames, or user content.

Automated tests protect scratch persistence plumbing, permission classification, exact ownership, successful round trip, collision refusal, and fail-closed behavior. Generated-output assertions require the diagnostic in `native-dev` and prohibit all harness markers from the ordinary production build. Principal real-Chrome validation proves the explicit-gesture picker; scratch handle storage; Options reload and browser-restart recovery; granted permission query; independent service-worker recovery and reuse without another picker; exact owned-file create/read/verify/delete with no remaining artifact; same-folder `isSameEntry` recognition; unavailable/deleted-location fail-safe behavior; unrelated-file isolation; and no required `alarms`, `downloads`, or arbitrary filesystem permission. M14-M.0 is **PASS / REAL-CHROME VALIDATED**.

The exploratory different-folder identity control did not produce reliable positive evidence. This is non-blocking for the feasibility gate because the critical persistence, background reuse, exact ownership-safe file operations, restart recovery, and unavailable-location premises passed independently. M14-N must revalidate the final production adapter and prove any different-folder identity behavior before managed backup-set deletion or retention relies on it. Uncertainty never weakens deterministic ownership proof or authorizes deletion.

Authoritative Principal evidence:

```text
Successful service-worker round trip:
backgroundHandleRecovered: true
backgroundWriteSucceeded: true
backgroundReadVerified: true
backgroundDeleteSucceeded: true
testArtifactMayRemain: false
lastOutcome: "round-trip-verified"

Browser restart:
browserRestartRecovered: true
handleRecovered: true
permissionState: granted
backgroundHandleRecovered: true

Unavailable/deleted location:
handleRecovered: true
backgroundHandleRecovered: true
unavailableLocationFailsSafe: true
testArtifactMayRemain: false
lastOutcome: "unavailable-location-failed-safe"
```

### Prior M14-L.1 — Hardening Architecture Continuity & Feasibility-Gate Reconciliation

```text
Active task: M14-L.1 — Hardening Architecture Continuity & Feasibility-Gate Reconciliation
Starting checkpoint: 3e5d545 — docs: close out automatic snippet paste milestone
Underlying M14-L starting tree: clean; master synchronized with origin/master
M14-L.1 input tree: existing 11-file documentation-only M14-L worktree preserved; no source/test/config change; HEAD still synchronized with origin/master

M14-K: CLOSED / COMPLETE / REAL-BROWSER VALIDATED
M14-L: PRINCIPAL-APPROVED IN SUBSTANCE / DOCUMENTATION ONLY
M14-L.1: ACTIVE / CONTINUITY AND FEASIBILITY-ORDER RECONCILIATION
M14-M.0: PASS / REAL-CHROME VALIDATED
M14-M.1/M14-M/M14-N/M14-O/M14-P: ASSIGNED / NOT STARTED
M15 AI drafting: NOT STARTED

Current physical Dexie: 5
Current canonical Backup: 6
Current manifest/permissions/dependencies: UNCHANGED
Runtime/test/schema migration: NONE
Knowledge deletion/migration: NONE
M14-K Class-C optimization: DEFERRED
Staging/commit/push: NONE
```

At the M14-L.1 checkpoint, Principal-approved Decisions 50–53 defined a future coordinated Dexie v6/Backup v7 foundation, a separate Text/Image usage sidecar and one-use cleanup receipt, user-selected File System Access backup location plus eventual `chrome.alarms`, Daily latest-seven and Weekly latest-four managed retention, and fingerprinted provider-independent generated Text tags with deterministic lexical retrieval. Decision 54 remained intact and locked the toolbar-to-Side-Panel/Settings-gear navigation model; that documentation-only task changed no code or data.

Persistent selected-folder reuse was subsequently proven by **M14-M.0 — Selected-Folder Backup Feasibility Gate** real-Chrome PASS. At the M14-L.1 checkpoint, M14-M.1 still required separate Principal authorization and no production hardening persistence or automatic-backup behavior existed. Daily latest seven and Weekly latest four remain final approved retention values, with different-folder identity proof deferred to M14-N before retention may rely on it.

### Prior M14-K.5 — Milestone Closeout & Checkpoint Recording

```text
Active task: M14-K.5 — Milestone Closeout & Checkpoint Recording
Implementation checkpoint: e34cd76 — feat: add automatic snippet paste delivery
Starting tree: clean; local master one commit ahead of origin/master

M14-K.3: PRINCIPAL APPROVED
M14-K.4: COMPLETE / DECISIONS 46–49 RECORDED
M14-K implementation: REAL-BROWSER VALIDATED / PRINCIPAL APPROVED
M14-K checkpoint: e34cd76
M14-K closed: YES / COMPLETE

M14-K.5 implementation changes: NONE
Knowledge deletion/migration: NONE
Class-C optimization: DEFERRED
AI drafting implementation: NOT STARTED
Snippet-hardening implementation: NOT STARTED
M14-K.5 staging/commit/push: NONE
```

The final Principal validation passes automatic Text and Image in Intercom and Crisp, clipboard-only Text and Image, unknown-trigger ordinary Space, live clipboard-only-to-automatic switching without destination reload, focus preservation, exactly-once insertion, and preserved fallback behavior. The successful native trace records accepted activation-Space suppression, no activation input, no post-cleanup failure, valid authorization, `paste-issued`, 4 requested and 4 inserted `SendInput` events, 40-byte `INPUT`, last error 0, passed foreground/root/PID/clipboard/modifier checks, matching host session, and same integrity.

Decisions 46–49 lock the future product direction while preserving current implementation truth. Text Snippets become the sole active user-managed AI reference library in the future drafting workflow; Image Snippets remain excluded. The Knowledge Library retires from that future active workflow/UI, but its current domain, Dexie records/store, repository interfaces, Backup v1-v6 compatibility, and tests remain implemented and untouched until a separately approved migration/cleanup task.

Guidance becomes user-facing **Guidance / Gist**, remains optional, and controls the current requested action/presentation without authorizing unsupported facts. Merchant Context and Gist have the exact three-valid/one-disabled empty-state matrix. The future compact Workspace, request-scoped Context Images, provider-independent model dropdown, persistent editable output, periodic canonical automatic backup, generated Text Snippet tags, and best-effort usage statistics are approved requirements only. Current Dexie physical version 5, Backup v6, manifest permissions, dependencies, runtime source, and tests are unchanged by M14-K.4.

### Prior M14-K.3 — Automatic Paste Validation, Performance Audit & Closeout Preparation

```text
Current milestone: M14-K — Automatic Paste
Active task: M14-K.3 — closeout preparation
Starting repository checkpoint: 5066476 — docs: define automatic paste architecture
Repository synchronization at preflight: master == origin/master == 5066476
Working tree: complete unstaged M14-K implementation/corrections preserved

Implementation and automated validation: PASS
Principal real-browser validation: PASS
M14-K.3 task result: PRINCIPAL APPROVED
Final M14-K status: CLOSED / COMPLETE AT e34cd76

Automatic Text: INTERCOM PASS / CRISP PASS
Automatic Image: INTERCOM PASS / CRISP PASS
Clipboard-only Text: PASS
Clipboard-only Image: PASS
Unknown trigger: PASS
Live clipboard-only → automatic Settings propagation: PASS
Successful native input: 4 requested / 4 inserted / last error 0 / INPUT size 40

Performance verdict: C — ARCHITECTURAL PERFORMANCE OPPORTUNITY
Automatic paste platform: WINDOWS ONLY
Manual Ctrl+V: PERMANENTLY SUPPORTED
AutoHotkey dependency: NONE
Production native distribution: FUTURE SEPARATE PACKAGING WORK
M15: NOT STARTED
```

Decision 45 remains authoritative. The Principal evidence proves the accepted activation Space is suppressed, exact cleanup remains extension-owned, authorization survives every post-cleanup predicate, and the native path reaches `paste-issued` exactly once without a fallback notice. Clipboard-only behavior, unknown-trigger ordinary typing, focus preservation, and live Settings propagation also pass. Direct PNG preparation is efficient; measured JPEG/WebP conversion and repeated one-shot native processes justify a class-C future architecture opportunity but no speculative closeout change. Installer/production registration, signing, updater, and version migration remain distribution work and did not block the completed local/development milestone.

M14-K.3 changed no AI runtime: current Prompt Builder v1 still treats Guidance as highest dynamic instruction, Context as the current case, Knowledge as reference, Text Snippets as wording/examples, and Image Snippets as excluded. Decision 46 now supersedes that arrangement only for future product direction: future active AI reference uses Text Snippets alone while current Knowledge compatibility remains untouched. No generation-provider or M15 implementation begins in M14-K.4.

### M14-K.2.3.5 — Native Input Injection Failure Isolation

```text
Current milestone: M14-K — Automatic Paste
Active task: M14-K.2.3.5 — Native Input Injection Failure Isolation
Starting repository checkpoint: 5066476 — docs: define automatic paste architecture
Starting working tree: complete existing unstaged M14-K tree preserved

Status:
NATIVE ROOT CAUSE IDENTIFIED
REAL INTERCOM AUTOMATIC RETEST PENDING

Authoritative real result: native-paste-result / input-injection-failed
Browser authorization: PASS / postCleanupFailure null
Activation Space suppression: PASS / beforeinput prevented / activation input absent
Root-cause class: A — native ABI/PInvoke defect
Defect: managed INPUT union omitted MOUSEINPUT and produced a 32-byte cbSize on win-x64
Correct win-x64 ABI: KEYBDINPUT 24 / MOUSEINPUT 32 / union 32 / INPUT 40
Correction: full native union layout; same virtual-key event builder and one SendInput call
Result mapping: 4 paste-issued / 0 input-injection-failed / 1-3 indeterminate
Native-dev evidence: requested/inserted counts, struct size, immediate last error, validation booleans, relative session/integrity
Production diagnostic response: NONE
Automatic retry/replay: NONE
Focus stealing/elevation: NONE
Manual Ctrl+V fallback: PRESERVED
AutoHotkey dependency: NONE; differential probe NOT RUN

M14-K.3: NOT STARTED
M15: NOT STARTED
```

Decision 45 remains authoritative. Microsoft defines `INPUT` as a `DWORD` plus a union containing `MOUSEINPUT`, `KEYBDINPUT`, and `HARDWAREINPUT`; the previous managed union contained only the smaller keyboard member. On win-x64 that made `Marshal.SizeOf<INPUT>()` 32 instead of the required 40, and the incorrect value was passed as `SendInput.cbSize`. The narrow correction restores the complete union without changing the key strategy, exact Ctrl-down/V-down/V-up/Ctrl-up sequence, foreground/root/PID/clipboard/modifier checks, or no-retry mapping. The development host now returns a strict privacy-safe attempt diagnostic that the native-development trace retains; normal builds reject and omit that extension. The next real Intercom activation must validate the corrected native result and record the actual immediate last-error plus session/integrity relationship. Automatic paste is not marked complete.

### M14-K.2.3.4 — Synchronous Activation Space Suppression

```text
Current milestone: M14-K — Automatic Paste
Active task: M14-K.2.3.4 — Synchronous Activation Space Suppression
Starting repository checkpoint: 5066476 — docs: define automatic paste architecture
Starting working tree: complete existing unstaged M14-K tree preserved

Correction status:
CONTROLLED CORRECTION PASS
REAL INTERCOM AUTOMATIC RETEST PENDING

Authoritative failed activation: automatic / same worker / post-cleanup-check / unsafe-focus
Failure classification: authorization-invalidated / unrelated-input
Activation beforeinput prevented: false
Activation input observed by the prior tolerance path: false
External input: trusted / insertText / same editor / same root / composed
External input phase: pre-cleanup / before owned cleanup input
Principal additional activity: NONE
Root cause: accepted activation Space was not synchronously prevented
Corrected activation: explicit accepted result → preventDefault exactly once → start delivery exactly once
Rejected activation: ordinary Space remains untouched
Cleanup CAS: exact unchanged trigger only; no inserted activation Space
Later genuine input: permanent invalidation; no broad suppression or grace period
Clipboard-only/manual Ctrl+V: PRESERVED
Native changes: NONE
SendInput changes: NONE
AutoHotkey: NONE
Automatic retry/replay: NONE
Production diagnostics: NONE

M14-K.3: NOT STARTED
M15: NOT STARTED
```

Decision 45 remains authoritative with this evidence-driven activation-boundary correction. The document runtime now consumes Space only after the complete synchronous trigger/editor/catalog eligibility path returns an explicit accepted result, and it starts asynchronous delivery only after `preventDefault()`. Textarea, supported input, generic contenteditable, and Shadow-DOM contenteditable cleanup compare-and-swap against the exact trigger-only state. The exact extension-owned cleanup `InputEvent` remains required. Any later non-owned input, mutation, selection/focus change, lifecycle change, or stale state remains fail-closed. The catalog exposes only one additional privacy-safe single-line-eligibility boolean so multiline Text can still be rejected in a single-line input before Space prevention. No content, selector, URL, title, or clipboard payload is exposed.

### M14-K.2.3.3 — External Input Origin Isolation

```text
Current milestone: M14-K — Automatic Paste
Active task: M14-K.2.3.3 — External Input Origin Isolation
Starting repository checkpoint: 5066476 — docs: define automatic paste architecture
Starting working tree: complete existing unstaged M14-K tree preserved

Isolation status:
DIAGNOSTIC READY
REAL INTERCOM EVENT-ORIGIN TRACE REQUIRED

Authoritative failed activation: automatic / same worker / post-cleanup-check / unsafe-focus
Post-cleanup classification: authorization-invalidated / unrelated-input / external-input
Input phase evidence: outside authorized cleanup dispatch
Physical editor predicates: ALL TRUE
Toast involvement: NONE
Source lifecycle audit: activation beforeinput is not prevented; ordinary Space is intentional
Source ordering: no asynchronous gap from owned cleanup dispatch return through authorization consumption
Current origin classification: D — distinct input before the owned cleanup transaction; A/B/C not safely distinguishable from the prior trace
New native-dev evidence: trust + bounded inputType + editor/root/composed + activation-task + relative phase/sequence
Behavior correction: NONE; external input remains fail-closed pending real evidence
Production diagnostics: NONE
Native changes: NONE
SendInput changes: NONE
Automatic retry: NONE

M14-K.3: NOT STARTED
M15: NOT STARTED
```

Decision 45 remains authoritative. The extension's document-capture `beforeinput` listener starts delivery synchronously but deliberately does not call `preventDefault()`; the activation Space therefore remains normal browser/editor input. The guard accepts that matching input only when it arrives while the captured activation state still exactly matches the expected trigger-plus-Space value/caret. The authoritative M14-K.2.3.2 trace proves a distinct input invalidated authorization outside owned cleanup, while source ordering proves there is no asynchronous gap after the cleanup notification returns and before authorization consumption. The prior trace therefore cannot safely distinguish the original activation input from destination-delayed synthetic input or separate user input. Native-development diagnostics now record only trust, a bounded input-type category, same-editor/root/composed booleans, activation-task relation, and typed transaction phase/sequence; they record no event data or page content. No event is newly authorized, no time window exists, and real user or synthetic input remains unsafe until a fresh Intercom trace establishes origin.

### M14-K.2.3.2 — Authorized Cleanup Input Continuity

```text
Current milestone: M14-K — Automatic Paste
Active task: M14-K.2.3.2 — Authorized Cleanup Input Continuity
Starting repository checkpoint: 5066476 — docs: define automatic paste architecture
Starting working tree: existing unstaged M14-K.2/M14-K.2.1/M14-K.2.2/M14-K.2.3/M14-K.2.3.1 implementation preserved

Correction status:
CONTROLLED CORRECTION PASS
REAL INTERCOM AUTOMATIC RETEST PENDING

Authoritative failed request: d6658abf-f308-4fc9-9c74-cd2be1375f5c
Authoritative failure: automatic branch / same worker / post-cleanup-check / unsafe-focus
Predicate evidence: authorizationStillValid false; every physical/editor-state check true
Invalidation evidence: unrelated-input / Shadow-host-retargeted focus
Toast evidence: absent before post-cleanup check; mounted only after failure; no focus or selection change
Source-proven provenance boundary: outside the exact synchronous cleanup-input dispatch (classification D)
Historical event origin: not recoverable as user/page versus asynchronous destination activity
New diagnostic: exact owned / nested synchronous / outside-dispatch input classification
Ownership scope: exact Event object + exact editor + synchronous dispatch + finally cleanup
Production diagnostics: NONE
Destination-specific code: NONE
Native changes: NONE
SendInput changes: NONE
Automatic retry: NONE

M14-K.2.3.2: CONTROLLED CORRECTION PASS / REAL INTERCOM AUTOMATIC RETEST PENDING
M14-K.3: NOT STARTED
M15: NOT STARTED
```

Decision 45 remains authoritative. Source ordering proves the historical `unrelated-input` was not the extension-generated cleanup notification and was not a second event dispatched synchronously by a destination handler: the previous guard ignored every input while cleanup was active, and `finishCleanup()` ended that window only after the notification returned. The old trace therefore establishes classification D at the authorization boundary—a separate input delivered outside the synchronous cleanup transaction—but cannot retrospectively identify whether the page emitted it asynchronously or it was genuine user/page activity. The controlled correction replaces the old broad cleanup-time exemption with exact event-object ownership, so only the extension-created notification on the captured editor is tolerated; a nested second event, another editor's event, and input before or after dispatch remain unsafe. Privacy-safe native-development fields will classify the next real trace without recording event data or page content. This does not mark real automatic paste as passing.

### M14-K.2.3.1 — Real-Browser Post-Cleanup Predicate Isolation

```text
Current milestone: M14-K — Automatic Paste
Active task: M14-K.2.3.1 — Real-Browser Post-Cleanup Predicate Isolation
Starting repository checkpoint: 5066476 — docs: define automatic paste architecture
Starting working tree: existing unstaged M14-K.2/M14-K.2.1/M14-K.2.2/M14-K.2.3 implementation preserved

Diagnostic status:
DIAGNOSTIC READY
REAL INTERCOM TRACE REQUIRED

Authoritative second failed trace: automatic branch / same worker / post-cleanup-check / unsafe-focus
Authoritative request ID: 21a1cf66-d213-4df0-af0d-be9aaaac223a
New evidence: predicate booleans + exact failure classification + immutable first invalidation cause
Shadow evidence: direct editor / retargeted Shadow host / invalid composed focus
Notice evidence: before-check presence + after-failure presence + focus/selection/mutation scope
Production diagnostics: NONE
Native changes: NONE
SendInput changes: NONE
Automatic retry: NONE

M14-K.2.3.1: DIAGNOSTIC READY / REAL INTERCOM TRACE REQUIRED
M14-K.3: NOT STARTED
M15: NOT STARTED
```

Decision 45 remains authoritative. The second real Intercom activation proves that M14-K.2.3 corrected a legitimate controlled raw-node-identity defect but did not remove the remaining real-browser blocker. Native-dev now identifies the exact post-cleanup predicate, first immutable invalidation source, and generic light-/Shadow-DOM focus topology without recording content, selectors, URLs, titles, or clipboard data. The extension notice is still rendered only after the automatic finalize result; it does not call `focus()`, has no `autofocus`, mounts under `document.documentElement` rather than inside the destination editor, and controlled suppression does not change the post-cleanup result. For light-DOM editors its DOM mutation is within the broad document lifecycle observer subtree, but it occurs after authorization consumption/decline and that observer invalidates only editor removal; for Shadow-DOM editors it is outside the editor-root observer scope.

### M14-K.2.3 — Post-Cleanup Focus Authorization Correction

```text
Current milestone: M14-K — Automatic Paste
Active task: M14-K.2.3 — Post-Cleanup Focus Authorization Correction
Starting repository checkpoint: 5066476 — docs: define automatic paste architecture
Repository synchronization at preflight: master == origin/master == 5066476
Starting working tree: existing unstaged M14-K.2/M14-K.2.1/M14-K.2.2 implementation preserved

Correction status:
CONTROLLED CORRECTION PASS
REAL INTERCOM AUTOMATIC RETEST PENDING

Authoritative failed trace: automatic branch / same worker / post-cleanup-check / unsafe-focus
Exact corrected predicate: raw post-cleanup contenteditable caret Node identity
Correction scope: generic editor boundary path + exact post-cleanup editor state
Native changes: NONE
SendInput changes: NONE
Protocol changes: NONE
Automatic retry: NONE

M14-K.2.3: ACTIVE
M14-K.3: NOT STARTED
M15: NOT STARTED
```

Decision 45 remains authoritative. The correction gives extension-owned cleanup one scoped `pre-cleanup` → `post-cleanup` transition, preserves the exact collapsed cleanup-start caret through the existing composed-selection model, and accepts a structurally identical live editor normalization without trusting raw node identity. Any different content structure, caret boundary, focus owner, disconnected editor, page lifecycle, or stale authorization still declines automatic paste and preserves the populated clipboard/manual `Ctrl+V` fallback. No destination-specific production branch or native change is involved.

### M14-K.2 — Windows Automatic Paste Implementation

```text
Current milestone: M14-K — Automatic Paste
Active task: M14-K.2 — Windows Automatic Paste Implementation
Starting repository checkpoint: 5066476 — docs: define automatic paste architecture
Repository synchronization at preflight: master == origin/master == 5066476
Starting working tree: CLEAN

Implementation status:
IMPLEMENTED
AUTOMATED VALIDATION PASS
REAL-BROWSER VALIDATION PENDING

M14-J: COMPLETE
M14-K: ACTIVE
M14-K.1: COMPLETE
M14-K.2: ACTIVE / IMPLEMENTED / AUTOMATED VALIDATION PASS
M14-K.2.3: ACTIVE / CONTROLLED CORRECTION PASS / REAL INTERCOM AUTOMATIC RETEST PENDING
M14-K.3: NOT STARTED
M15: NOT STARTED

Paste modes: clipboard-only | automatic
Default: clipboard-only
Manual Ctrl+V: SUPPORTED PERMANENTLY
Automatic paste: WINDOWS-ONLY V1 PRODUCT CAPABILITY THROUGH NATIVE COMPANION
Fallback: CLIPBOARD REMAINS AVAILABLE FOR MANUAL CTRL+V

Persistence: existing Settings singleton; Dexie physical version 5
Backup: strict v6 export/import; v1-v5 imports default clipboard-only
Native protocol: exact v1 preserved; strict v2 capture-paste-context + paste-clipboard
Input: one Ctrl-down/V-down/V-up/Ctrl-up SendInput call at most; never retried
Permissions: unchanged; no tabs permission; no clipboardRead
Destination-specific code: none
```

Decision 45 remains authoritative. Text and Image share one post-clipboard automatic-paste boundary. Clipboard success and exact cleanup success are mandatory; stale editor/focus/caret, sender/document/frame, tab/window, native foreground/PID/clipboard, modifier, concurrency, or uncertain response state declines automatic input without clearing the clipboard. The native tests use fake Win32 APIs and inject no real desktop input. Windows still cannot atomically prove the internal DOM editor during the final IPC-to-`SendInput` interval, so the residual same-window race is documented and M14-K.3 remains the release validation gate.

### Prior M14-K.1 — Automatic Paste Architecture + Focus Safety

```text
Current milestone: M14-K — Automatic Paste
Active task: M14-K.1 — Automatic Paste Architecture + Focus Safety
Starting repository checkpoint: e4e9645 — feat: add always-on snippet lifecycle recovery
Repository synchronization at preflight: master == origin/master == e4e9645
Starting working tree: CLEAN

Status:
M14-J: COMPLETE / REAL-BROWSER VALIDATED / SYNCHRONIZED
M14-K: ACTIVE
M14-K.1: ARCHITECTURE DEFINED / DOCUMENTATION ONLY / PENDING PRINCIPAL REVIEW
M14-K.2: EXACT NEXT IMPLEMENTATION TASK AFTER APPROVAL
M14-K.3: PLANNED REAL-WORLD VALIDATION
M15: NOT STARTED

Decision 45 product contract:
AUTOMATIC PASTE: OPTIONAL / ADDITIVE / DEFAULT OFF
MANUAL CTRL+V: PERMANENT SUPPORTED MODE AND FALLBACK
CLIPBOARD PREPARATION: AUTHORITATIVE / REQUIRED BEFORE PASTE
CLIPBOARD AFTER ATTEMPT OR SUCCESS: RETAINED
AUTOMATIC RETRY AFTER INPUT MAY BEGIN: PROHIBITED
TEXT + IMAGE: SHARED POST-CLIPBOARD APPLICATION BOUNDARY
DESTINATION-SPECIFIC BEHAVIOR: NONE

Selected Windows architecture:
TRANSPORT: EXISTING C#/.NET NATIVE COMPANION
AUTOHOTKEY: EVALUATED / PERMANENT DEPENDENCY REJECTED
APPLICATION CAPABILITY: PASTE THE ALREADY-PREPARED CLIPBOARD ONCE
BROWSER PROOF: EDITOR + DOCUMENT + FRAME + TAB + WINDOW + CATALOG + REQUEST
NATIVE PROOF: FOREGROUND ROOT HWND + PID + CLIPBOARD SEQUENCE + MODIFIER STATE
FOCUS STEALING: PROHIBITED
ARBITRARY SEND-KEYS/COMMANDS: PROHIBITED
PROTOCOL V1: FROZEN / UNCHANGED
PROTOCOL V2: DESIGNED FOR FUTURE CAPTURE-PASTE-CONTEXT + PASTE-CLIPBOARD
SENDINPUT IMPLEMENTATION: NONE IN M14-K.1

Ordering:
CLIPBOARD SUCCESS
→ BROWSER FOREGROUND CHECK + NATIVE CONTEXT CAPTURE
→ EXACT COMPARE-AND-SWAP CLEANUP
→ IMMEDIATE SAME-EDITOR/CARET REVALIDATION
→ CONSUME ONE AUTHORIZATION
→ FINAL BROWSER + NATIVE SAFETY CHECKS
→ AT MOST ONE INPUT SEQUENCE

Settings and compatibility:
FUTURE SETTING: snippetPasteMode = clipboard-only | automatic
DEFAULT: clipboard-only
PERSISTENCE: EXISTING SINGLETON SETTINGS RECORD
DEXIE V5: UNCHANGED / NO NEW INDEX
BACKUP V5: FROZEN / UNCHANGED
FUTURE EXPORT: STRICT BACKUP V6; V1-V5 IMPORT DEFAULTS CLIPBOARD-ONLY
NON-WINDOWS: CLIPBOARD-ONLY / MANUAL CTRL+V

M14-K.1 exclusions:
NO PRODUCTION AUTOMATIC PASTE
NO NATIVE KEYBOARD INPUT
NO NATIVE MESSAGING PASTE OPERATION
NO SETTINGS TOGGLE
NO BACKUP V6 IMPLEMENTATION
NO AUTOHOTKEY DEPENDENCY
NO SENDINPUT
NO NATIVE CLIPBOARD CHANGE
NO SOURCE / TEST / CONFIGURATION CHANGE
```

Decision 45 is the next sequential decision after Decision 44. It preserves Decisions 42–44, the Text offscreen copy-event transport, the Windows Image clipboard transport, exact compare-and-swap cleanup, generic Shadow-DOM editor resolution, metadata-only catalogs, Dexie v5, and Backup v5. The known last-instant focus race inside the same unchanged browser window is explicit: native Windows input cannot identify a DOM editor atomically, so M14-K.2/M14-K.3 must stress it and automatic-mode release is blocked if the layered guard is not acceptably safe.

### Prior M14-J.7 — M14-J Milestone Closeout & Git Checkpoint Preparation

```text
Current milestone: M14-J — Destination Compatibility Validation / Reliability
Active task: M14-J.7 — M14-J Milestone Closeout & Git Checkpoint Preparation
Starting repository checkpoint: 797a68a — feat: validate destination compatibility
Repository synchronization at preflight: master == origin/master == 797a68a
M14-J.1–M14-J.5.1 state: COMMITTED / PRESERVED

Status:
M14-J: COMPLETE
M14-J REAL-BROWSER VALIDATION: PASS
M14-J.6 IMPLEMENTATION: COMPLETE / AUTOMATED VALIDATION PASS / REAL-CHROME PASS
M14-J.7 DOCUMENTATION CLOSEOUT: COMPLETE
COMBINED M14-J.6 + M14-J.7 GIT CHECKPOINT: PENDING PRINCIPAL REVIEW

Root cause and lifecycle classification:
NORMAL NAVIGATION: STATIC HTTP/HTTPS ALL-FRAME CONTENT SCRIPT REMAINS CORRECT
EXTENSION RELOAD/UPDATE: ALREADY-LOADED PAGES DO NOT RECEIVE THE CURRENT PACKAGED CONTENT SCRIPT AUTOMATICALLY
BROWSER/PROFILE STARTUP: RESTORED LOADED PAGES REQUIRE BEST-EFFORT RECOVERY
SERVICE-WORKER TERMINATION: FRAME RUNTIME SURVIVES, BUT ITS DISCONNECTED CACHE IS FAIL-CLOSED UNTIL RECONNECT

M14-J.6 recovery architecture:
ONINSTALLED INSTALL/UPDATE/CHROME_UPDATE: BOUNDED ELIGIBLE-TAB RECOVERY
UNPACKED RELOAD: COVERED AS ONINSTALLED UPDATE
ONSTARTUP: BOUNDED ELIGIBLE-TAB RECOVERY
NORMAL NAVIGATION: UNCHANGED STATIC INJECTION
FRAME POLICY: HTTP/HTTPS + ALL FRAMES, UNCHANGED
CONTENT SCRIPT FILE: RESOLVED FROM GENERATED MANIFEST
TAB CONCURRENCY: BOUNDED AT FOUR
PER-TAB FAILURE: ISOLATED / QUIET
DISCARDED TAB: NOT FORCED TO LOAD
POLLING/ALARMS/KEEPALIVE: NONE

Idempotent frame runtime:
ONE VERSIONED CONTENT-RUNTIME REGISTRY PER FRAME
SAME CURRENT RUNTIME: RECONNECT / NO SECOND LISTENER SET
DISCONNECTED CURRENT RUNTIME: RECONNECT OR ONE-FOR-ONE RESTART
OLD EXTENSION CONTEXT: DISPOSE/REPLACE WITH CURRENT PACKAGE RUNTIME
DUPLICATE BEFOREINPUT LISTENERS: PREVENTED
DUPLICATE PORTS/SUBSCRIPTIONS: PREVENTED
DUPLICATE ACTIVATION/NOTICE/CLEANUP/PAYLOAD: PREVENTED
BEFOREINPUT/FOCUS RECONNECT: CURRENT WORKER + CURRENT SNAPSHOT REQUESTED

Host-access decision — Decision 44:
PERSISTENT HOST ACCESS: http://*/* AND https://*/*
RATIONALE: GESTURE-FREE PROGRAMMATIC RECOVERY OF ALREADY-OPEN ELIGIBLE PAGES
ACTIVETAB: RETAINED FOR M10 BUT INSUFFICIENT AS RECOVERY AUTHORITY
TABS PERMISSION: NOT ADDED
FILE ACCESS: NOT ADDED
CLIPBOARDREAD: NOT ADDED
USER SITE-ACCESS CONTROLS: RESPECTED; DENIAL FAILS SAFELY
PAGE/EDITOR CONTENT INSPECTION DURING RECOVERY: NONE

Architecture and scope:
TEXT CLIPBOARD ARCHITECTURE: UNCHANGED
WINDOWS IMAGE ARCHITECTURE: UNCHANGED
DECISION 42: UNCHANGED
DECISION 43: UNCHANGED
DEXIE V5: UNCHANGED
BACKUP V5: UNCHANGED
M14-J.5 NATIVE-DEV DIAGNOSTIC: RETAINED / PRODUCTION-EXCLUDED
MANUAL CTRL+V: CURRENT UX
AUTOMATIC PASTE: NOT IMPLEMENTED
M14-K — AUTOMATIC PASTE FEASIBILITY + WINDOWS IMPLEMENTATION: NOT STARTED
AUTOHOTKEY PERMANENT DEPENDENCY: NOT APPROVED
SENDINPUT IMPLEMENTATION: NONE
M15: NOT STARTED

Previously validated destinations:
CRISP TEXT: PASS
CRISP ENTER: PASS
CRISP SHIFT+ENTER: PASS
CRISP IMAGE: PASS
INTERCOM TEXT: PASS
INTERCOM NORMAL BULLET LIST: PASS
INTERCOM IMAGE: PASS
INTERCOM BULLET AFTER SHIFT+ENTER: KNOWN LOW-PRIORITY COMPATIBILITY LIMITATION

M14-J.6 Principal real-Chrome lifecycle evidence:
INTERCOM NO-REFRESH RECOVERY: PASS
CRISP NO-REFRESH RECOVERY: PASS
REPEATED-RELOAD / IDEMPOTENCY: PASS
DUPLICATE ACTIVATION/NOTICE/CLIPBOARD BEHAVIOR: NONE

Known non-blocking follow-ups:
INTERCOM BULLET AFTER SHIFT+ENTER: MAY OMIT FIRST BULLET / LOW PRIORITY
IMAGE SNIPPET PERCEIVED LATENCY: PERFORMANCE FOLLOW-UP

Exact next action after Codex completion:
PRINCIPAL REVIEWS FULL M14-J.6 + M14-J.7 WORKING TREE
→ PRINCIPAL AUTHORIZES/CREATES COMBINED M14-J CHECKPOINT
→ PUSH AND VERIFY LOCAL/REMOTE SYNCHRONIZATION
→ START M14-K AUTOMATIC PASTE ARCHITECTURE / FOCUS SAFETY
```

M14-J is complete and real-browser validated. Static navigation injection, bounded already-open-page recovery, idempotent frame ownership, and exact Decision 44 HTTP/HTTPS access are validated without changing Text/Image clipboard behavior. Manual native `Ctrl+V` remains the user workflow until M14-K. The authoritative destination evidence lives in `docs/DESTINATION_COMPATIBILITY.md`.

### Prior M14-I Closeout Handoff

```text
Current milestone: M14 — Snippet Authoring and Delivery
Latest committed checkpoint: ebe915f — feat: add clipboard delivery for text and image snippets
Repository synchronization: master == origin/master
Working tree: clean immediately after M14-I implementation checkpoint

M14-I overall status:
COMPLETE
IMPLEMENTED
AUTOMATED VALIDATION PASS
REAL-CHROME VALIDATED
CLEANUP COMPLETE
COMMITTED
PUSHED

Text:
REAL-CHROME PASS

Windows Image:
SETTINGS READINESS: PASS
TRIGGER ACTIVATION: PASS
NATIVE CLIPBOARD PREPARATION: PASS
TRIGGER CLEANUP: PASS
COPIED NOTICE: PASS
NATIVE CTRL+V VISIBLE IMAGE: PASS
CLASSIFICATION: REAL-CHROME END-TO-END PASS

M14-I.4.1 closeout:
NATIVE MESSAGING DIRECT CAPABILITY EXCHANGE: PASS
SETTINGS CAPABILITY DETECTION: PASS
WINDOWS IMAGE SNIPPETS: READY

Browser Image experimental paths:
REMOVED FROM ACTIVE RUNTIME
HISTORICAL EVIDENCE PRESERVED IN DOCUMENTATION

M14-I.5 cleanup:
M14-I.1.4 FAILED FILE-BASED IMAGE RUNTIME: REMOVED
OFFSCREEN ASYNC IMAGE PATH: REMOVED FROM ACTIVE RUNTIME
A1/A2/B FEASIBILITY RUNTIME PROBES: REMOVED
TEXT OFFSCREEN DELIVERY: PRESERVED
WINDOWS NATIVE IMAGE DELIVERY: FINAL ACTIVE WINDOWS IMAGE ROUTE

Native development integration:
ACTIVE FOR DEVELOPMENT

Production companion packaging:
NOT IMPLEMENTED

Automatic paste:
NOT IMPLEMENTED
DEFERRED

Post-cleanup real-Chrome smoke test:
SETTINGS READY: YES
TRIGGER DISAPPEARED: YES
COPIED NOTICE: YES
VISIBLE IMAGE PASTED: YES
M14-I CLEANUP: VALIDATED

Exact next action:
Principal review documentation closeout
→ commit/push closeout docs
→ create M14-J implementation/validation task
```

Final Text flow:

```text
Text trigger + Space
→ authoritative Text planning
→ safe text/plain + text/html
→ offscreen copy-event transport
→ confirmed clipboard success
→ compare-and-swap trigger cleanup
→ copied notice
→ manual native Ctrl+V
```

Final Windows Image flow:

```text
Image trigger + Space
→ authoritative Image planning
→ Decision 42 Image safety/preparation
→ PNG preparation
→ second freshness check
→ WindowsNativeImageClipboardTransport
→ Native Messaging
→ Windows Clipboard Companion
→ registered PNG + CF_DIBV5
→ exact correlated success
→ compare-and-swap cleanup
→ copied notice
→ manual native Ctrl+V
→ genuine visible image
```

- Latest completed implementation: M14-I — Clipboard Delivery at `ebe915f`.
- M14 status: M14-I.3/M14-I.3.1 provide the approved native foundation. M14-I.4 connects it through a service-worker-only `WindowsNativeImageClipboardTransport`, strict TypeScript protocol-v1 validation, stable `native-dev` identity, optional `nativeMessaging`, and an exact `.dev` HKCU registration. M14-I.4.1 preserves callback-delivered Native Messaging, stable `sendResponse`/literal-`true` Settings lifetime, strict response validation, and truthful readiness states. Real Chrome validates Settings `Ready`, Image activation, native clipboard preparation, exact success-gated cleanup, copied notice, and visible native paste. M14-I.5 removes the superseded browser Image/probe runtime. Production installation remains future work.
- Last completed implementation checkpoint: `ebe915f` — `feat: add clipboard delivery for text and image snippets`.
- Latest feasibility conclusion: M14-I.1.5.2 remains the historical browser evidence. A1 produced `TEXT` and failed; focused extension-page B produced `VISIBLE IMAGE` as a capability-only pass; A2/F9 was not run and is no longer required. M14-I.5 removes those probes and the failed M14-I.1.4 File path from active runtime after the native replacement passed.
- Latest architecture decision: M14-I.2 / Decision 43 — optional Windows Native Clipboard Companion. Decisions 39–42 remain authoritative within their separate scopes.
- M14-F — Unified Rich Editor Inline Image Authoring: CANCELLED BEFORE IMPLEMENTATION.
- M14-I.5 cleanup status: COMPLETE / AUTOMATED-VALIDATED / POST-CLEANUP REAL-CHROME SMOKE PASS / COMMITTED.
- M14-H — Image Snippet Domain Completion and Authoring: ABSORBED INTO M14-G.2 / NOT A SEPARATE ACTIVE TASK.
- Exact next action: Principal real-Chrome no-refresh recovery validation in already-open Intercom and Crisp tabs, followed by repeated-reload duplicate-listener stress validation. M14-J remains incomplete; M14-K follows only after successful M14-J validation and closeout.
- Continuity: M12-A ran only a Principal-readiness self-check, produced no repository changes, and was superseded by M12-A.1. M12-A must not be reused for another independent task.
- M12-A.1 passed Principal review and is complete at documentation checkpoint `f09e776` (`docs: add task identifiers and assign future milestones`).
- M12-B completed the readiness review with verdict `ARCHITECTURE DEFINITION REQUIRED`.
- M12-C defined the approved Import / Export architecture, passed Principal Engineer review, and is complete at documentation checkpoint `7ebe874` (`docs: define import and export architecture`).
- M12-D implemented the approved Import / Export scope, but its initial Principal Engineer source review rejected direct reuse of live domain entity types and record spreads at the public Backup Format v1 boundary.
- M12-D.1 corrected that defect with frozen dedicated version 1 DTOs and explicit export, validation, restore, and persistence mappings. Principal Engineer source review approved the corrected implementation, required automated and risk-based real Chrome validation passed, and the completed M12 implementation was committed and pushed at `d304f90` (`feat: add import and export backup workflow`).

## Previous Milestones

- Milestone 0 — Foundation: Completed
- Milestone 0B — Repository Documentation Finalization: Completed
- Milestone 0C — Technical Architecture Decisions: Completed
- Milestone 0D — Platform Architecture Approval: Completed
- Milestone 1 — Technical Foundation: Completed
- Milestone 2 — Extension Shell: Completed
- Milestone 3 — Local Database: Completed
- Milestone 4 — Knowledge Library: Completed
- Milestone 5 — Snippet Library: Completed
- Milestone 6 — Retrieval Engine: Completed
- Milestone 7 — Prompt Builder: Completed
- Milestone 8 — Ollama Provider: Completed
- Milestone 9 — Output Workspace: Completed
- Milestone 10 — Keyboard Shortcut: Completed
- Milestone 11 — Settings: Completed
- Milestone 12 — Import / Export: Completed
- Milestone 13 — Snippet Trigger Expansion v1: Completed

## Project Status

- Status: Milestone 14 is COMPLETE. M14-J and M14-K are complete and real-browser validated. M14-K is Principal-approved and closed at implementation checkpoint `e34cd76`. Post-M14 Snippet Hardening is active: M14-M.0 passed, M14-M.1/M14-M.1.1 are checkpointed at `20b509c`, M14-M.2 is checkpointed at `f4d9ab0`, M14-M.3/M14-M.3.1 is checkpointed at `2475f8b`, and the documentation-only M14-M.4 Git environment record is complete awaiting Principal review. M14-N remains the next product implementation milestone and is not started.
- Scope: Completed Milestone 9 provides the first complete manual Context-to-generated-output workflow through a global foreground Chrome Side Panel, a focused application `OutputWorkflow`, automatic local retrieval, Prompt Builder, the project-owned generation boundary, transient model input, editable plain-text output, and Copy. `DECISIONS.md` remains authoritative for the exact M9 scope and non-goals.
- Completed M10 scope: exactly one browser-scoped `capture-selection-to-workspace` command captures explicit main-frame selection through `activeTab` and `scripting`, immediately opens or activates the global Side Panel without awaiting capture, delivers the typed result through a transient delivery-ID ready/acknowledgement handshake, replaces Merchant Context, requests Guidance DOM focus with a collapsed end caret, and leaves Generate manual. Opening a closed panel makes Guidance immediately usable. For an already-visible panel, Chrome may retain webpage keyboard routing despite the internal focus/caret request, so the user may need to click Guidance. The service worker owns only browser coordination and transient acknowledged delivery; M9 foreground generation remains unchanged.
- Business functionality: The Knowledge Library, Snippet Library, local lexical Retrieval Engine, deterministic provider-independent Prompt Builder, project-owned generation boundary, local Ollama provider adapter, and global Side Panel Output Workspace are implemented and validated. Libraries remain in the options page and open in a normal browser tab.
- The completed runtime shell provides the approved background service worker, content script, popup, and options-page boundaries required for later milestones.
- Completed M13 provides optional unique Snippet triggers; canonical validation; Dexie schema version 3; Backup Format v2 with v1 import compatibility; a transient service-worker catalog synchronized through long-lived typed frame ports; exact plain-text-only replacement and caret restoration in supported textarea, absent/text/search input, and contenteditable editors; multiline textarea/contenteditable support; all-normal-HTTP/HTTPS availability; bounded trigger inspection with no full-editor scanning; no clipboard, telemetry, or provider transmission; and fail-safe normal typing when expansion is unavailable.

## Approved Future Product Directions

- **M14 — Snippet Authoring and Delivery:** COMPLETE. The existing `SnippetEntry` aggregate remains authoritative. M14-J is complete. M14-K.3 is Principal-approved, M14-K.4 locks Decisions 46–49 without runtime changes, and the approved implementation is checkpointed at `e34cd76`. M14-K is closed.
- **M14-I.3 — Windows Native Clipboard Companion Foundation:** IMPLEMENTED / PRINCIPAL ENGINEER APPROVED / COMMITTED IN `ebe915f`. M14-I.4 consumes this foundation without changing its framing or clipboard guarantees.
- **M14-I.3.1 — Native Host Framing and Partial-Failure Safety Correction:** IMPLEMENTED / AUTOMATED-VALIDATED / COMMITTED IN `ebe915f`. Production processing no longer inspects stdin after the declared frame, and deterministic fault-injection coverage records best-effort partial clearing, ownership, no retry, and close-error precedence. Decision 42 and Decision 43 architecture remain unchanged.
- **M14-I.4 — Chrome Native Messaging Integration and Development Registration:** IMPLEMENTED / AUTOMATED-VALIDATED / DEVELOPMENT HOST REGISTERED UNDER HKCU / REAL-CHROME IMAGE VALIDATED / COMMITTED IN `ebe915f`. `nativeMessaging` is optional and requested only from the Settings action; Text remains browser-only. Normal Windows Image delivery uses the `.dev` native host with no browser fallback.
- **M14-I.4.1 — Native Companion Capability Status Correction:** IMPLEMENTED / AUTOMATED-VALIDATED / REAL-CHROME SETTINGS READINESS PASS / COMMITTED IN `ebe915f`. Callback-aligned Native Messaging and stable service-worker `sendResponse` handling map compatible success to Ready while keeping unavailable, incompatible, and invalid responses distinct.
- **M14-I.5 — Native Image Delivery Cleanup and M14-I Finalization:** IMPLEMENTED / CLEANUP COMPLETE / POST-CLEANUP REAL-CHROME SMOKE PASS / COMMITTED IN `ebe915f`. Failed offscreen Image delivery, File semantics, A1/A2/B runtime probes, probe-only contracts/tests, and obsolete diagnostics are removed. Text offscreen delivery and Windows native Image delivery remain the only supported transports for their respective kinds.
- **M14-K Optional Automatic Native Paste:** COMPLETE AT `e34cd76`. Decision 45 defines the separable, carefully focus-gated Windows input architecture after clipboard preparation. M14-K.2 implements it through the existing C# companion, rejects AutoHotkey and arbitrary send-keys, and preserves manual `Ctrl+V` as a permanent mode/fallback.
- **M14-L/M14-L.1 — Snippet Hardening Architecture and Reconciliation:** COMPLETE / DOCUMENTATION ONLY. Decisions 50–53 remain authoritative and Decision 54 remains intact.
- **M14-M.0 — Selected-Folder Backup Feasibility Gate:** PASS / REAL-CHROME VALIDATED. The File System Access selected-folder model, restart recovery, service-worker reuse, exact owned-file lifecycle, and unavailable-location safety are proven. Different-folder distinction remains an M14-N non-blocking verification before retention reliance.
- **M14-M.1/M14-M.1.1 — Coordinated Data Foundation:** COMPLETE / CHECKPOINTED AND SYNCHRONIZED AT `20b509c`. Dexie v6, Backup v7, sidecar repositories, cadence persistence, local state boundary, deletion/invalidation, v1-v6 compatibility, and atomic restore are complete.
- **M14-M.2 — Real-World Snippet Feedback & Completion Gate:** DOCUMENTATION ONLY / COMPLETE / PRINCIPAL REVIEW PENDING. F1 link presentation and F2 edit navigation/focus are required before M14-P closes; F3 Save as Snippet is assigned to M15. No feedback behavior is implemented.
- **M14-M.3/M14-M.3.1 — Snippet Usage Statistics Behavior and Display Simplification:** COMPLETE / CHECKPOINTED AND SYNCHRONIZED AT `2475f8b`. The 30-second transient one-use receipt, exact cleanup acknowledgement, atomic saturating sidecar update, failure isolation, Text/Image and mode parity, and numeric-only accessible Library projection are implemented.
- **M14-N — Periodic Automatic Backup:** NOT STARTED. File System Access + `alarms`, selected-folder production revalidation, exact Daily latest-seven and Weekly latest-four retention, and manual fallback.
- **M14-O — Generated Text Snippet Tags & Retrieval Integration:** NOT STARTED. Text-only fingerprinted metadata, provider-independent post-save generation, bounded output/backfill, and deterministic weight-1 retrieval.
- **M14-P — Snippet Hardening Validation & Closeout:** NOT STARTED. Complete automated/real-Chrome hardening evidence and preserve M14-K delivery before M15.
- **M15 Workspace Shell Action UX — ASSIGNED / NOT STARTED:** The current toolbar action still opens the popup. Decision 54 requires M15 to retire the popup/default popup, use native toolbar-action global Side Panel open/toggle behavior, and add a compact accessible Side Panel Settings gear that opens the existing Options / Libraries page. Text/Image Snippets, backup/export, automatic backup, paste behavior, model/provider settings, other settings, and current Knowledge compatibility remain in Options.
- **M15 — AI Drafting Workflow Refinement and Multimodal Context:** implement Decision 46/47 compact UI, Guidance / Gist, Text-Snippet active reference retrieval, provider-independent model selection, editable output, and request-scoped Context Images. Knowledge compatibility remains non-destructively dormant; unsupported images never disappear silently. Detailed architecture remains deferred.
- **M16 — OpenAI Provider Expansion:** Add OpenAI and provider selection behind the existing provider-independent boundary after credentials, permissions, endpoints, models, privacy, and error behavior are defined.
- **Chrome Side Panel Focus Activation:** Activate or focus an already-visible Side Panel after shortcut capture if Chrome exposes a supported API; no M10 workaround is authorized.
- The Side Panel focus direction remains unassigned. M14–M16 retain their roadmap ownership. M13 remains authoritative for trigger persistence, editor activation, and runtime synchronization; M14-B preserves those behaviors while projecting structured content to the existing plain catalog payload. Decision 36 does not reopen M9, redefine M10, or change the existing Ollama/AI workflow.

## Milestone 12 Architecture

- M12 provides the current manual local backup, restoration after reinstall or browser-data loss, and file-based transfer to another Chrome profile or computer. M12 itself is not synchronization, collaboration, sharing workflow, bulk editing, automatic backup, or scheduled backup; Decision 48 separately approves future periodic local backup through the canonical format.
- Backup format version 1 is one strict application-owned JSON envelope identified by `ai-support-workspace-backup`, independently versioned from Dexie, with required `formatVersion: 1`, UTC `exportedAt`, and required Knowledge, Snippet, and Settings data.
- Knowledge exports `id`, `title`, `body`, `tags`, `createdAt`, `updatedAt`, and `source`. Snippets export `id`, `title`, `content`, `tags`, `createdAt`, and `updatedAt`. Settings always exports `defaultModel: string | null`; the physical `global` ID is excluded.
- Export ordering is `createdAt` ascending then `id` ascending. Restore preserves IDs, timestamps, text, tags and tag order, source, and Settings exactly; it never uses ordinary create operations that generate identity or timestamps.
- M12 supports replace-only restore after strict all-or-nothing validation and an explicit destructive acknowledgement. One Dexie transaction clears and replaces Knowledge, Snippets, and Settings atomically through a focused restore port.
- Import and export share a 25 MiB (`26,214,400` byte) guard. Export uses in-memory JSON, a Blob, an object URL, and a temporary anchor; import uses one labelled JSON file input. No permission, schema, dependency, or manifest change is approved.
- Import / Export is the fourth options-page section. Valid files show filename, export timestamp, Knowledge and Snippet counts, and saved-model summary before confirmation. Options-page-local navigation must reload restored data; mounted Side Panels do not live-sync Settings.
- Merchant Context, Guidance, generated Output, Workspace overrides and active state, M10 deliveries, screenshots, clipboard/browser state, logs, Ollama data, secrets, unrelated storage, and then-future Snippet trigger/rich/multimodal data are excluded from frozen Backup Format v1. Encryption, passwords, compression, ZIP, merge, selective import/export, backup history, and scheduling are also excluded.

## Completed Milestone 13 Architecture

- Each plain-text Snippet gains optional domain `trigger: string | null`; existing records resolve to `null`. Non-null triggers are 2–32 ASCII characters including `;`, canonical lowercase, unique, and match `^;[a-z0-9]+(?:-[a-z0-9]+)*$` after lowercase conversion. Whitespace is rejected, not trimmed.
- A trusted cancelable Space `beforeinput` expands only a complete catalog trigger immediately before a collapsed caret with editor-start or whitespace left boundary. It replaces exactly that range with preserved plain-text Snippet content plus one space and places the caret afterward. Misses, selection, composition, paste, unsafe range, unsupported editor, and cache/runtime failure preserve normal Space behavior.
- Focused adapters support `textarea`, free-form absent/text/search inputs, and generic `contenteditable`. Textarea supports complete single-line and multiline Snippet content. Contenteditable supports complete single-line and multiline content through safe text-node and `<br>` insertion. Supported single-line inputs expand only content with no `\r` or `\n`; for a multiline match the input adapter declines before preventing Space, leaves the host value unchanged, and preserves normal Space behavior. Content is never flattened, truncated, normalized, or partially inserted to fit an input.
- The content script uses exactly `http://*/*` and `https://*/*` with `allFrames: true`, making expansion available on normal HTTP and HTTPS websites while excluding Chrome-protected, extension, file, and other non-HTTP(S) pages. Operation remains frame-local with no cross-frame traversal, `match_about_blank`, fallback-origin injection, `<all_urls>`, clipboard/storage permission, editor logging, password or specialized-input support, provider transmission, or persistent catalog. Browser event and editor detection use structurally validated, realm-safe DOM boundaries rather than cross-realm constructor identity.
- Dexie remains the sole persistent source of truth. Every matched content-script frame maintains one long-lived typed `chrome.runtime.Port` and enables its transient cache only while that port is connected and holds a completely validated current-epoch snapshot. Invalidation and complete snapshots travel in order through the port. Disconnection immediately clears and disables the cache; a disconnected frame cannot use its former snapshot. Reconnection requests a complete snapshot, worker restart establishes a new epoch, and older-epoch snapshots are rejected. Before Snippet create/edit/delete or import/restore persistence, the coordinator invalidates every connected frame and each clears immediately. Success publishes one rebuilt complete snapshot, persistence failure republishes the unchanged snapshot, and publication failure leaves affected frames disabled until reconnect or successful refresh. Normal typing continues, and no durable queue, browser-storage catalog, polling loop, or per-keystroke service-worker lookup is approved.
- M13 implemented forward-only database schema version 3 with only `snippetEntries: 'id, createdAt, &trigger'` changed. Triggerless physical records omit the indexed property and map to domain `null`; existing Knowledge, Snippets, and Settings migrate without data loss.
- Backup Format v1 remains frozen and importable, with v1 Snippets restored as `trigger: null`. New exports use strict Backup Format v2, whose exact Snippet DTO adds required `trigger: string | null`; all M12 size, explicit mapping, security, preview, acknowledgement, identity, atomic transaction, rollback, and failed-validation guarantees remain.
- The Snippet form adds one optional Trigger field, format guidance, inline invalid/duplicate feedback, and list display. Rich content, images, variables, autocomplete, analytics, providers, Prompt Builder changes, Screenshot Context, OpenAI, cloud sync, team sharing, and generalized automation are excluded.

## Milestone 14 Architecture and Implemented Foundation

- M14-A is the completed documentation-only architecture task at `c1105d4`; M14-B implements its foundation at `ed23f30`; M14-C implements structured authoring at `a787100`; M14-D/Decision 37 defines the asset direction at `64504df`; Decision 38 is at `f9b5097`; and M14-E implements local assets/Backup v4 at `1828f09`. Decision 39 now supersedes Decision 37's unimplemented inline Rich-image authoring/rendering direction.
- A Rich Snippet remains the existing `SnippetEntry`, preserving ID, title, tags, trigger, timestamps, repository identity, CRUD semantics, and M13 trigger uniqueness. There is no `TemplateEntry`, parallel Template Library, duplicate record, or second trigger system.
- M14-B replaced the live plain `content: string` field with one canonical discriminated `SnippetContent` union: `{ kind: 'plain', text }` or `{ kind: 'rich', blocks }`. Rich blocks are an ordered, non-recursive project-owned structure containing paragraphs with text/link inline nodes and image-reference blocks with a label and user-supplied HTTP(S) URL. Persisted HTML is prohibited.
- Ordinary links initially allow `https:`, `http:`, and `mailto:`. Image references allow only `https:` and `http:`. Persistence validation and untrusted Backup v3 import validation reject executable or unapproved schemes.
- One deterministic `renderSnippetPlainText(content)` boundary preserves exact plain text and produces the canonical fallback for rich content. Rich blocks retain order, paragraphs are separated by exactly `\n\n`, emphasis emits readable text only, labelled links emit `label (url)` unless label equals URL, and image references emit `[Image: label] url`. No block may disappear.
- Retrieval Engine and Prompt Builder remain text consumers and receive only that plain projection. Rich markup and DOM structures do not enter AI prompts, and M14 adds no provider work.
- M14-B keeps the M13 catalog payload plain-text-only and supplies the deterministic projection for both plain and rich records. All M13-B.1 epoch, revision, port, invalidation, publication-barrier, and fail-closed guarantees remain authoritative. Content scripts remain Dexie-free. Structured rich payloads and rich insertion are deferred.
- Textareas always receive plain projection. Single-line inputs decline multiline projections before preventing Space. Safely supported generic contenteditables may receive extension-created text, paragraph, `strong`, `em`, and validated anchor nodes made with the target's `ownerDocument`; arbitrary HTML parsing and automatic image creation/fetching remain prohibited. Image references use their positional plain representation unless a separately approved target capability exists.
- M14-B implemented forward-only Dexie version 4 while preserving v1-v3 declarations and the `id, createdAt, &trigger` indexes. Its migration wraps every v3 string exactly as `{ kind: 'plain', text: formerContent }`, preserves IDs, metadata, tag order, triggers, and timestamps, keeps null triggers physically omitted, and adds no table or index.
- Backup Formats v1 and v2 remain permanently frozen and importable. M14-B implemented new exports as strict Backup Format v3 with dedicated exact DTOs and explicit mappings. V1 maps string content to plain content and null trigger; v2 maps string content to plain content and preserves its trigger. V3 carries exact discriminated content and retains the existing 25 MiB, ordering, preview, acknowledgement, replace-only atomic transaction, rollback, and security guarantees.
- The existing Snippet Library remains the only UI. M14-G.2 supersedes the older user-facing block/segment and explicit conversion workflow: users choose Text or Image; new Text records are Rich; supported Text content uses a constrained Tiptap v3 editor behind a project-owned JSON/domain adapter. Historical Plain stays untouched until a successful Text Save. Legacy Rich image/reference content that cannot safely round-trip is preserved read-only.
- M14-E persists validated local Blobs as Snippet-owned assets, implements Dexie v5 and Backup v4, and preserves legacy URL references without fetching or conversion. M14-E is retained, not reverted.
- M14-G implements non-recursive unordered/ordered Rich lists with inline marks/links and deterministic plain projection. M14-G.2 replaces its manual authoring controls with normal WYSIWYG behavior while keeping the structured domain authoritative. New embedded local-image Rich authoring remains cancelled.
- `ImageSnippetContent` exists as exactly `{ kind: 'image', assetId }`, owns exactly one same-Snippet asset, and has no truthful text projection. M14-G.2 implements direct screenshot paste, secondary file selection, local preview, and atomic lifecycle operations. No Image Library or "Use as Context" bridge is approved.
- Backup v4 remains frozen/importable. M14-G implements strict explicit Backup v5 DTOs/mappings for lists and Image content with the retained 96 MiB guard and atomic four-store restore. Dexie remains version 5 with no store/index/migration changes.
- Image Snippets remain excluded from Retrieval and Prompt Builder, but M14-I publishes metadata-only typed trigger descriptors. Asset IDs and binary data remain outside frame catalogs.
- M14-H is absorbed into M14-G.2. The implemented fastest workflow is screenshot to clipboard, New Image Snippet, focused paste target, `Ctrl+V`, preview, metadata, and Save; labelled file selection is secondary.
- Image delivery remains opt-in clipboard preparation. The typed frame catalog carries no image bytes/base64/asset ID and `clipboardRead` remains prohibited. Manual real `Ctrl+V` is permanently supported; Decision 45's implemented optional focus-guarded Windows input attempt occurs only after clipboard success and does not change Image content transport.
- Decision 38 remains the fail-closed rule for legacy Rich local-image records. M14-I replaces Decision 39's transitional Image catalog exclusion with typed delivery while preserving Plain and portable Rich compatibility.
- Context Images remain a separate future M15 multimodal-input domain with generation-time provider/privacy rules.
- Variables, placeholders, customer-field interpolation, conditional logic, loops, scripting, arbitrary HTML/CSS, tables, video, embeds, AI-generated fields, page scraping, analytics, trigger syntax changes, provider changes, OpenAI, collaboration, sync, and new Chrome permissions are explicit non-goals.

## Architecture Status

- Extension platform: WXT targeting Manifest V3.
- Language and UI: TypeScript, React, and Tailwind CSS.
- Package and quality tooling: pnpm, ESLint, Prettier, Husky, and lint-staged.
- State and persistence: React Context and Hooks, with Dexie behind project-owned storage contracts.
- Testing: Vitest for unit, UI, and integration tests; Playwright for browser-level end-to-end tests.
- Business logic remains local-first, layered, storage-independent, and AI-provider-independent.
- Development tooling, automated validation, the runnable Manifest V3 extension shell, the Dexie-backed local persistence foundation, the Knowledge and Snippet Libraries, the Retrieval Engine, the Prompt Builder, and the Ollama Provider exist.
- The initial physical database schema, project-owned CRUD contracts, identity and timestamp semantics, error behavior, transaction policy, migration policy, and isolated test adapter are approved in `DATABASE_SCHEMA.md` and `DECISIONS.md`.
- Knowledge and Snippet management share the existing options-page Library surface, opened in a browser tab from popup navigation, with lightweight local tab navigation between the libraries. Their presentation uses separate application-layer boundaries over `KnowledgeEntryRepository` and `SnippetEntryRepository` and does not access Dexie directly.
- Retrieval Engine v1 is implemented as one headless application-level operation over the two existing repository contracts. It returns separately ranked Knowledge and Snippet collections, scores records in memory, remains local and read-only, and does not access Dexie directly or depend on UI or AI-provider behavior.
- `DECISIONS.md` is authoritative for the M6 normalization, fields, scoring, repeated-term behavior, empty and no-match behavior, deterministic per-domain ordering, absence of result limits, and performance direction.
- Prompt Builder v1 is implemented as a pure, headless application-layer composition boundary over optional Merchant Context, optional Guidance, and already-computed Retrieval Results. M9 `OutputWorkflow` owns query construction and Retrieval Engine invocation; Prompt Builder validates primary input, preserves M6 ranking, selects the first five Knowledge and first three Snippet results, applies `Guidance > Merchant Context > Knowledge > Snippets`, and returns an explicitly sectioned provider-independent `PromptAssembly`.
- `DECISIONS.md` is authoritative for the M7 input and output contracts, minimum valid input, default instructions, precedence and grounding, content-versus-metadata policy, selection limits, deterministic formatting, empty behavior, purity, and provider, UI, persistence, token, and image boundaries.
- Milestone 8 implemented a narrow project-owned `GenerationProvider` boundary whose `generate` operation accepts a transient `GenerationRequest`, optionally accepts an `AbortSignal`, and returns a provider-independent `GenerationResult`. The first infrastructure adapter is `OllamaProvider`, identified as `ollama`.
- Ollama Provider v1 uses native `fetch` against fixed local endpoint `http://localhost:11434/api/chat`, sends exactly one system message and one deterministically serialized user message with `stream: false`, and exposes no raw provider response. M9 assigns generation to the foreground Side Panel page, requires exactly `sidePanel` permission plus `http://localhost/*` host access and external Ollama origin allowance, and introduces no generation messaging. M11 now approves only optional default-model persistence outside the provider adapter; retries, provider timeouts, model pulling, health checks, provider selection, and endpoint configuration remain deferred.
- `DECISIONS.md` is authoritative for the M8 request, result, translation, transport, response validation, cancellation, error taxonomy, privacy, configuration, replaceability, and deferred-runtime boundaries.
- Milestone 9 implemented one extension-owned global Chrome Side Panel and one focused application-layer `OutputWorkflow`. The native WXT Side Panel entry point generates `sidepanel.html` and composes the existing repositories, Retrieval Engine, Prompt Builder, and `OllamaProvider`, while `OutputWorkflow` depends only on `RetrievalEngine`, `PromptBuilder`, and `GenerationProvider`.
- Each Generate action constructs the frozen Context-then-Guidance retrieval query joined by exactly `\n\n`, performs one complete retrieval-to-generation workflow, and returns editable transient plain-text output. M9 uses a blank-initial transient model field, runs generation in the foreground Side Panel page, adds only `sidePanel` plus `http://localhost/*`, and requires external Ollama allowance for the installed extension origin.
- `DECISIONS.md` is authoritative for M9 input, orchestration, retrieval, provider, runtime, permission, origin, state, output, copy, error, privacy, persistence, accessibility, testing, and manual-validation contracts.
- Milestone 10 implements one normal Chrome command with description `Capture selected text in AI Support Workspace`, suggested keys `Ctrl+Shift+Space` by default and `Command+Shift+Space` on macOS, browser-only scope, Chrome-native remapping, and no Generate, Copy, toggle, OS-global, or in-app shortcut-system behavior. The user's local `Ctrl+Shift+Y` remap resolved a Text Blaze conflict without changing the manifest default.
- M10 selection capture is explicit, active-tab, main-frame, text-only, and on demand. A focused textarea or text-capable input selection takes precedence over document selection; exact non-whitespace text is preserved, persistent content-script matches remain unchanged, and surrounding-page scraping, cross-frame capture, screenshots, and permanent site access remain excluded.
- M10 runtime sequencing invokes `chrome.scripting.executeScript(...)` first, immediately invokes `chrome.sidePanel.open({ windowId })` in the same keyboard-command user-action turn without awaiting capture, and only then observes the independent capture/open outcomes. Capture initiation precedes open initiation; capture completion need not precede open initiation.
- M10 adds exactly `activeTab` and `scripting` alongside `sidePanel`, retains exactly `http://localhost/*` in host permissions and `https://example.com/*` as the persistent content-script match, and adds no `tabs`, storage, `clipboardRead`, `clipboardWrite`, `<all_urls>`, permanent support-site host, `127.0.0.1`, dependency, Settings, persistence, or schema change.
- A focused typed runtime boundary assigns each transient result a delivery ID, retries pending delivery when a newly mounted Side Panel announces readiness, acknowledges only after application, and removes only the matching acknowledged queue head. It uses no Dexie, `chrome.storage`, `localStorage`, generic event bus, or durable queue. Success replaces only Merchant Context, preserves Guidance, and requests Guidance DOM focus with a collapsed caret at the end without selecting or changing its value; model, output, and active generation are preserved, and automatic Generate remains excluded. Empty or failed capture preserves Context and Output and causes no required Guidance focus movement. Automated checks prove the Side Panel document state only; real Chrome validation owns browser-level activation and keyboard-routing observations.
- `DECISIONS.md` is authoritative for the exact M10 command, manifest, selection, sequencing, Side Panel, runtime, delivery, state, focus, error, scope-protection, testing, and manual-validation contracts.
- Milestone 11 architecture defines exactly one local setting, `defaultModel: string | null`, with `null` as the application default. Saving trims outer whitespace, stores non-empty model identifiers as opaque text, and stores `null` for empty or whitespace-only input without contacting Ollama.
- Settings is the third top-level section in the existing options page alongside Knowledge and Snippets. It provides one explicit-save form, accessible loading and status feedback, and no separate page, router, generic preference system, popup action, autosave, reset, import, or export.
- M11 implements a project-owned typed Settings aggregate, minimal singleton load/save repository, focused application normalization/default boundaries, and a Dexie infrastructure adapter. The implemented schema migrated from version 1 to version 2 by adding only `settings: 'id'` with physical record `{ id: 'global', defaultModel }`, no timestamps or indexes, no automatic record, and no Knowledge or Snippet transformation.
- Each Side Panel session loads Settings once before establishing editable model state. The saved default initializes the transient field; missing, null, or failed load initializes blank, with safe non-blocking failure feedback. Workspace overrides remain transient, do not persist or live-sync, and Generate continues using the current field through the unchanged provider boundary.
- M11 defers provider selection to M16, keeps `http://localhost:11434` fixed, and excludes endpoint configuration, remote or LAN Ollama, OpenAI, credentials, discovery, health checks, behavior tuning, writing preferences, editable grounding instructions, theme, shortcut settings, Workspace persistence, multimodal Context, Rich Snippets, history, and manifest changes.

## Completed Work

- Completed Milestone 0 documentation and engineering workflow setup.
- Added a dedicated UI workflow document describing the user journey from a product perspective.
- Finalized repository documentation so it can serve as the project's primary memory across future conversations.
- Established the required lifecycle from approved decisions through validation, documentation, and a Git checkpoint.
- Completed Milestone 0B documentation finalization and created its Git checkpoint.
- Documented the technical architecture and application boundaries in Milestone 0C.
- Approved and froze the platform stack in Milestone 0D.
- Completed Milestone 1 by configuring pnpm, WXT, TypeScript, React, Tailwind CSS, ESLint, Prettier, Husky, lint-staged, Vitest, Playwright, and continuous integration.
- Validated dependency installation, linting, formatting, type-checking, Vitest execution, and Playwright configuration without creating an extension runtime or running a WXT production build.
- Completed Milestone 2 by adding the WXT-owned Manifest V3 runtime shell with the approved background service worker, content script, popup, and options page.
- Added minimal React and Tailwind runtime surfaces without product or business functionality.
- Added the first production WXT build, generated-manifest validation, React shell tests, and the production build continuous-integration gate.
- Confirmed that the generated manifest contains no `permissions` or `host_permissions`, restricts the content script to `https://example.com/*`, and does not introduce Side Panel.
- Completed Principal Engineer review and manual Chrome validation of unpacked loading, Manifest V3 acceptance, popup and options rendering, service-worker operation, content-script initialization, absence of page modification, and absence of browser/runtime errors.
- Completed the Milestone 2 Documentation Impact Review. Project-state, changelog, README, roadmap, architecture-status, and database-status documentation were synchronized without changing architecture, product requirements, milestone definitions, or roadmap scope.
- Created Milestone 2 checkpoint `6a8b0ae` (`feat: implement extension shell`), pushed `master` to `origin/master`, and confirmed local and GitHub synchronization at that checkpoint.
- Defined the implementation-ready Milestone 3 database architecture and synchronized it at checkpoint `1513d13` (`docs: define local persistence architecture`).
- Completed Milestone 3 by implementing database `ai-support-workspace`, schema version 1, the approved `knowledgeEntries` and `snippetEntries` tables, and project-owned Knowledge Entry and Snippet Entry repositories without changing the approved architecture or schema.
- Validated the persistence foundation with 13 passing integration tests, including close-and-reopen persistence; the full project suite passed with 4 files and 15 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, and `git diff --check`, while regression validation confirmed that the existing Manifest V3 extension shell remains operational.
- Completed the Milestone 3 Documentation Impact Review and synchronized all affected status, schema, architecture, testing, roadmap, README, and changelog documentation.
- Determined that no Milestone 3-specific manual Chrome validation was required because isolated IndexedDB integration tests are the appropriate persistence validation and temporary browser UI would exceed the approved milestone boundary.
- Created Milestone 3 checkpoint `fd6ffe5` (`feat: implement local persistence foundation`), pushed `master` to `origin/master`, and confirmed local and GitHub synchronization at that checkpoint.
- Completed Milestone 4 by adding the application-layer Knowledge Library boundary and a focused create, list, edit, and confirmation-protected delete experience on the existing options page, reached through popup navigation.
- Kept the UI behind `KnowledgeEntryRepository`, used the real M3 Dexie implementation in production, and preserved database `ai-support-workspace`, physical schema version 1, table definitions, indexes, and persistence semantics.
- Added application, React UI, and application-to-Dexie integration coverage. The full project suite passed with 7 test files and 25 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, generated Manifest V3 validation, and `git diff --check` without adding permissions, host permissions, or Side Panel.
- Completed Principal Engineer review and manual Chrome validation of popup navigation, immediate create and edit behavior, persistence across reload or reopen, delete cancellation, confirmed deletion, deletion persistence, and absence of reported runtime problems.
- Completed the Milestone 4 Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation were synchronized; product requirements and UI workflow were reviewed and required no changes.
- Created Milestone 4 checkpoint `8f65922` (`feat: implement knowledge library`), pushed `master` to `origin/master`, and confirmed local and remote synchronization at that checkpoint.
- Completed Milestone 5 by adding a focused create, list, edit, and confirmation-protected delete experience for Snippets on the existing options-page Library surface.
- Added lightweight local tab navigation between the Knowledge and Snippet libraries while preserving the existing popup-to-Library browser-tab navigation and keeping the Knowledge Library operational.
- Kept Snippet UI behavior behind a separate application-layer boundary over `SnippetEntryRepository`, used the real Milestone 3 Dexie implementation in production, and preserved database `ai-support-workspace`, physical schema version 1, table definitions, indexes, contracts, and persistence semantics.
- Added focused application, React UI, and application-to-Dexie integration coverage. The focused Milestone 5 suite passed with 3 files and 11 tests, and the full project suite passed with 10 files and 36 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, generated Manifest V3 validation, and `git diff --check` without adding permissions, host permissions, schema or index changes, snippet expansion or insertion, retrieval, AI, Settings, or Side Panel functionality.
- Completed Principal Engineer review and manual Chrome validation of Library navigation, the Snippet empty state, immediate create and edit behavior, persistence across reload or reopen, delete cancellation, confirmed deletion, deletion persistence, Knowledge Library regression behavior, and absence of reported runtime problems.
- Completed the Milestone 5 Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation were synchronized; product requirements, UI workflow, and backlog were reviewed and required no changes.
- Created Milestone 5 checkpoint `10fbd72` (`feat: implement snippet library`), pushed `master` to `origin/master`, and confirmed local and remote synchronization at that checkpoint.
- Defined the implementation-ready Milestone 6 Retrieval Engine v1 architecture as a local, deterministic, lexical, provider-independent, read-only application operation over the existing Knowledge and Snippet repository contracts.
- Approved separate Knowledge and Snippet result collections; NFKC, locale-independent lowercase, and Unicode letter-or-number tokenization; exact title/tag/body-or-content weights of 5/3/1; query and field token deduplication; zero-score exclusion; empty-query behavior; deterministic score/`createdAt`/`id` ordering; and no fixed result limit.
- During the architecture-definition task, preserved the existing database, schema version, tables, fields, indexes, migrations, repository contracts, browser surfaces, permissions, and provider-independent boundaries while adding no implementation code or dependencies.
- Created Retrieval Engine architecture checkpoint `5f2e0a0` (`docs: define retrieval engine architecture`), pushed `master` to `origin/master`, and confirmed local and remote synchronization before implementation began.
- Completed Milestone 6 by implementing the approved headless Retrieval Engine over the existing Knowledge and Snippet repository `list()` contracts, with separate typed result collections and no direct Dexie, browser UI, provider, or network dependency.
- Implemented the frozen NFKC, lowercase, Unicode letter-or-number tokenization and exact 5/3/1 lexical scoring behavior, including query and field token deduplication, Knowledge source exclusion, zero-score exclusion, tokenless-query handling, deterministic per-domain ordering, no fixed result limit, and read-only operation.
- Added deterministic unit and isolated IndexedDB repository-integration coverage. Focused retrieval validation passed with 2 files and 14 tests, and the full project suite passed with 12 files and 50 tests.
- Passed dependency installation, linting, final formatting validation, type-checking, Playwright discovery of 1 test, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Completed Principal Engineer review and determined that no M6-specific manual Chrome validation was required because the Retrieval Engine is headless, the algorithm and real repository boundary are comprehensively automated, and temporary demonstration UI would violate milestone scope.
- Completed the Milestone 6 Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation were synchronized; decisions, product requirements, and UI workflow were reviewed and required no changes.
- Created Milestone 6 implementation checkpoint `9649c1b` (`feat: implement retrieval engine`), pushed `master` to `origin/master`, and confirmed local and remote synchronization at that checkpoint.
- Defined the implementation-ready Milestone 7 Prompt Builder v1 architecture as a deterministic, pure, headless application-layer composition boundary that receives already-computed Retrieval Results and produces a typed provider-independent `PromptAssembly`.
- Approved optional Merchant Context and Guidance with at least one non-whitespace primary input; `Guidance > Merchant Context > Knowledge > Snippets` authority; a static grounding instruction section; fixed top-five Knowledge and top-three Snippet selection; canonical section ordering; and separation of provider-facing content from application metadata.
- Deferred retrieval orchestration, provider selection and serialization, AI execution, model and token handling, images, UI, persistence, Prompt Templates, and database changes from M7 while adding no implementation code, tests, dependencies, permissions, or browser surfaces during architecture definition.
- Created Prompt Builder architecture checkpoint `2c2c0ae` (`docs: define prompt builder architecture`), pushed `master` to `origin/master`, and confirmed local and remote synchronization before implementation began.
- Completed Milestone 7 by implementing the approved deterministic headless Prompt Builder over optional Merchant Context, optional Guidance, and optional prepared Retrieval Results, with a focused missing-primary-input error and acceptance of minimal non-whitespace Guidance such as `follow up`.
- Implemented the frozen static provider-independent instructions, `Guidance > Merchant Context > Knowledge > Snippets` precedence, first-five Knowledge and first-three Snippet selection in M6 order, explicit canonical section ordering, empty-section omission, content-versus-metadata separation, deterministic output, and input immutability.
- Preserved retrieval ownership, provider independence, transient operation, schema version 1, browser surfaces, and permissions while introducing no retrieval invocation, orchestration, provider execution or serialization, AI behavior, token handling, images, UI, persistence, Prompt Templates, snippet expansion, or `;hello` behavior.
- Added comprehensive deterministic unit coverage. Focused Milestone 7 validation passed with 1 file and 22 tests, and the full project suite passed with 13 files and 72 tests.
- Passed dependency installation, linting, final formatting validation, type-checking, Playwright discovery of 1 test, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Completed Principal Engineer review and determined that no M7-specific manual Chrome validation was required because Prompt Builder is headless, its behavior is comprehensively covered by deterministic unit tests, and temporary demonstration UI would violate milestone scope.
- Completed the Milestone 7 Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation required synchronization; decisions, product requirements, and UI workflow were reviewed and required no changes.
- Created Milestone 7 implementation checkpoint `a71dfed` (`feat: implement prompt builder`), pushed `master` to `origin/master`, and confirmed local and remote synchronization at that checkpoint.
- Defined the implementation-ready Milestone 8 provider boundary as a project-owned `GenerationProvider` contract with provider identity, transient model and `PromptAssembly` input, optional caller cancellation, and a minimal provider-independent text result.
- Defined `OllamaProvider` as a runtime-independent infrastructure adapter using native `fetch`, an injectable fetch-compatible test seam, fixed local-only `/api/chat` access, exactly two translated messages, non-streaming generation, strict success-response validation, and focused project-owned provider errors.
- Preserved provider replaceability, prompt composition semantics, privacy, schema version 1, extension runtime files, browser surfaces, and manifest permissions while explicitly deferring runtime ownership, CORS and extension access, Settings, model persistence, UI, output workflow integration, retries, timeouts, health checks, model pulling, and provider tuning.
- Defined deterministic automated provider-contract coverage and an optional opt-in live Ollama smoke-validation policy without adding implementation code, tests, dependencies, manifests, permissions, or WXT configuration during architecture definition.
- Created and synchronized the Milestone 8 architecture checkpoint `b54f141` (`docs: define ollama provider architecture`) before implementation began.
- Completed Milestone 8 by implementing the project-owned transient `GenerationRequest` and `GenerationResult` contracts, the focused provider-error boundary, and the replaceable `OllamaProvider` adapter without changing Prompt Builder.
- Implemented deterministic translation into one Instructions system message and one structured JSON user message, followed by exactly one native-fetch `POST` to fixed local endpoint `http://localhost:11434/api/chat` with `stream: false`.
- Preserved the caller-supplied model, excluded application metadata and raw Ollama responses from application contracts, and added no retries, internal timeout, health check, automatic model pull, tuning options, telemetry, analytics, or cloud fallback.
- Added 30 focused deterministic unit tests in 1 file plus an explicit opt-in live Ollama smoke test. The normal full suite passed with 102 tests and skipped the live test when `OLLAMA_LIVE_MODEL` was absent.
- Passed dependency installation, linting, formatting, type-checking, the normal Vitest suite, Playwright discovery, the production build, generated Manifest V3 validation, and `git diff --check`; the manifest retained no `permissions`, `host_permissions`, or `side_panel`.
- Validated the real provider against local Ollama `/api/chat` with `OLLAMA_LIVE_MODEL=qwen2.5:7b`, producing a non-empty `GenerationResult` in approximately 25 seconds. The live test has an individual 120-second test-only timeout; `OllamaProvider` still has no internal timeout.
- Completed the mandatory Milestone 8 Documentation Impact Review. Project-state, architecture-status, roadmap, testing, changelog, engineering-principles, database-status, UI-workflow, and README documentation required synchronization; decisions and product requirements were reviewed and required no changes.
- Preserved database `ai-support-workspace` schema version 1, tables, fields, indexes, migrations, persistence contracts, extension runtime files, Chrome permissions, browser surfaces, and WXT configuration. Chrome generation orchestration, messaging, localhost access, CORS, `OLLAMA_ORIGINS`, Output Workspace, Settings, and other deferred functionality remain later-milestone work.
- Created and synchronized Milestone 8 implementation checkpoint `2de8dcb` (`feat: implement ollama provider`) before M9 architecture definition began.
- Defined the original implementation-ready Milestone 9 architecture for a dedicated transient Workspace, focused `OutputWorkflow`, deterministic automatic retrieval, existing Prompt Builder and provider boundaries, foreground-page generation, minimal localhost host permission, external Ollama origin configuration, editable output, Copy, safe errors, and real Chrome validation. The standalone page and Side Panel exclusion in that original surface decision are superseded by the later M9 amendment.
- Preserved existing M6, M7, and M8 behavior, Libraries and content-script ownership, provider replaceability, schema version 1, and later milestone boundaries while introducing no implementation code, tests, dependencies, runtime files, permissions, persistence, Settings, OpenAI, or browser-page integration during the original architecture definition.
- Amended the M9 surface after manual product review to one global WXT Chrome Side Panel with `sidePanel` permission, current-window popup opening, fluid narrow-width layout, and Side Panel-specific automated and manual validation. The amendment changed no workflow, provider, persistence, privacy, or deferred-feature contract and did not modify the then-uncommitted implementation.
- Created Milestone 9 Side Panel architecture amendment checkpoint `e587398` (`docs: move output workspace to side panel`), pushed it to `origin/master`, and synchronized local and remote state before the final implementation migration.
- Completed Milestone 9 by migrating the unfinished standalone Workspace surface to WXT's native global Chrome Side Panel entry point generated as `sidepanel.html`, opening it from popup Open Workspace, preserving options-page Libraries, and adapting the existing view to fluid narrow panel widths.
- Implemented the focused `OutputWorkflow` orchestration from transient Merchant Context, Guidance, and model through automatic Retrieval Engine invocation, Prompt Builder, `GenerationProvider`, `OllamaProvider`, editable exact provider output, and Copy of the current edited draft. Repeated Generate reruns the complete workflow; failures preserve existing output.
- Corrected a browser-runtime transport defect discovered during manual validation: native `globalThis.fetch` was stored unbound and invoked through the provider instance, causing `TypeError: Illegal invocation` and an incorrect `ProviderUnavailableError`. The production default is now bound to `globalThis`, request construction occurs outside the transport catch, and focused regression tests protect the error taxonomy.
- Completed final automated validation with 136 passing tests and 1 opt-in live Ollama test skipped in the normal suite. The focused provider/workflow/UI regression run passed 60 of 60 tests; installation, linting, formatting, type-checking, Playwright discovery, production build, generated-output validation, and `git diff --check` also passed.
- Completed real Chrome manual validation of extension reload, popup and Side Panel opening, companion-panel and narrow-width behavior, Context, Guidance, transient model, Generate eligibility, real `qwen2.5:7b` generation, loading and success feedback, editable output, edited-output Copy with line breaks, repeated generation, Guidance influence, safe missing-model and provider-unavailable errors with output preservation, and both Library regressions without blocking runtime or network errors after the transport fix.
- Completed the mandatory Milestone 9 Documentation Impact Review. Project state, architecture status, UI workflow, roadmap, testing strategy, changelog, database status, backlog, and README required synchronization; decisions, product requirements, engineering principles, and coding-agent rules were reviewed and required no change. The observation that one local-model response said “Delivery should be soon.” despite contrary Guidance is recorded as future prompt/model-quality work rather than an M9 workflow failure.
- Created Milestone 9 implementation checkpoint `7b88b94` (`feat: implement output workspace`), pushed `master`, and confirmed local `master` and `origin/master` synchronization before M10 architecture definition began.
- Defined M10 as one browser-scoped standard Chrome command for exact active-page main-frame selection capture, global Workspace Side Panel open/activation, Merchant Context replacement, a Guidance DOM focus request with a collapsed caret at the end of its preserved value, and manual future generation.
- Approved the exact command identity, description, suggested Windows/Linux/default and macOS keys, Chrome-native remapping, `activeTab` plus `scripting` least-privilege capture, unchanged persistent content script, typed transient ready/acknowledgement delivery, state preservation, safe feedback, automated validation, and manual Chrome validation contracts.
- Preserved M9 foreground generation, existing application boundaries, database schema version 1, M11 Settings scope, future Rich Snippet Trigger Expansion, future Multimodal Context Attachments, and all excluded permissions and hosts while making no implementation, test, dependency, configuration, or persistence change during architecture definition.
- Created M10 architecture checkpoint `7f5bbe8` (`docs: define keyboard shortcut architecture`), pushed it to `origin/master`, and synchronized local and remote state before implementation began.
- Implemented the M10 command, selection extractor, delivery-ID ready/acknowledgement queue, Workspace application, focused tests, generated-output validation, and least-privilege manifest changes. The completed implementation, tests, and closeout documentation are committed and pushed at checkpoint `6093361` (`feat: add selected-text capture shortcut`).
- During real Chrome validation, confirmed Chrome-native shortcut remapping to `Ctrl+Shift+Y`, production command dispatch, on-demand exact selection scripting, and direct command-turn Side Panel opening. Diagnosed that awaiting capture completion before `chrome.sidePanel.open(...)` exhausted Chrome's user-action eligibility and was silently swallowed by safe open-failure handling.
- Validated the amended sequence end to end in real Chrome by initiating selection capture first, immediately initiating Side Panel opening without an intervening await, and then observing both outcomes. Capture, open, typed delivery, exact Context replacement, and exact leading-whitespace preservation passed.
- Implemented and covered the amended successful-capture behavior so exact Merchant Context replacement is followed on every success by `guidanceElement.focus()` and `setSelectionRange(end, end)`. Empty and failed capture preserve existing feedback and do not force Guidance focus.
- Completed full real Chrome M10 validation. The command appeared in `chrome://extensions/shortcuts`; the suggested `Ctrl+Shift+Space` conflicted with Text Blaze; Chrome-native remapping to `Ctrl+Shift+Y` dispatched correctly without changing the manifest default. Normal document, textarea, and contenteditable selection; first and repeated invocation; exact Context replacement; state preservation; empty and restricted-page feedback; Generate with captured Context and preserved Guidance; Copy with line breaks; popup navigation; and Knowledge and Snippet Library regressions all passed.
- First invocation from a closed panel passed panel opening, capture, exact Context replacement, state preservation, immediately usable Guidance focus, collapsed end-caret behavior, and no automatic Generate. Repeated invocation with the panel already visible passed panel visibility, capture, delivery, exact Context replacement, state preservation, and the internal focus/caret implementation and test contract, but Chrome kept browser-level keyboard routing on the webpage and required a click in Guidance.
- Classified repeated-invocation automatic browser focus as unavailable because Chrome exposes no supported API to activate or focus an already-visible Side Panel. The limitation did not block M10 and authorizes no focus retry, delay, polling, close/reopen, toggle, permission, persistence, notification, tab, or window workaround.
- Recorded the observed cross-world preload mismatch and unused generated preloads as non-blocking WXT/Vite/Chrome generated-output warnings with no observed functional impact and no explicit application-source request. M10 makes no configuration change; investigate separately only if functional or performance evidence emerges.
- Completed final automated validation: focused M10/Workspace tests passed; the full Vitest suite passed 171 tests with one opt-in live Ollama test skipped; lint, formatting, type-checking, Playwright discovery of 1 Chromium infrastructure test, the production WXT Chrome MV3 build, generated-output and manifest validation, and `git diff --check` passed. Only expected Windows LF-to-CRLF notices occurred, and no live Ollama test was required for M10.
- Completed the mandatory M10 Documentation Impact Review. Project state, architecture status, decision-record delivery and closeout wording, UI workflow, roadmap, backlog status, testing strategy, database status, changelog, and README required synchronization. Product requirements, engineering principles, and coding-agent rules were reviewed and required no changes.
- Marked Milestone 10 complete and advanced the current roadmap milestone to Milestone 11 — Settings without defining M11 architecture or implementation. The M10 implementation checkpoint is `6093361` (`feat: add selected-text capture shortcut`), committed, pushed, and synchronized between local `master` and `origin/master`.
- Defined the implementation-ready M11 architecture for one optional saved default Ollama model, an options-page Settings section, explicit normalized save behavior, typed application and persistence boundaries, one-time Side Panel initialization, safe load/save feedback, and the Dexie version 2 singleton migration. This architecture task adds no implementation, test, dependency, configuration, permission, or physical database change and does not mark M11 complete.
- Completed the M11 architecture-definition Documentation Impact Review. Project state, architecture, decisions, product requirements, UI workflow, roadmap, database schema planning, testing strategy, changelog, and README required synchronization. Backlog, engineering principles, and coding-agent rules were reviewed; only backlog wording for explicitly deferred provider configuration and Prompt Profile work required synchronization.
- Implemented exactly one optional saved default Ollama model through the typed `Settings` aggregate, focused `SettingsRepository` and application service, Dexie version 2 singleton adapter, third options-page Settings section, and one-time Side Panel bootstrap before editable model state.
- Preserved the approved normalization, missing-record, clear-to-null, safe error, transient override, no-live-sync, provider-boundary, manifest, permission, M9 state, and M10 ready/retry/acknowledgement contracts without adding a generic Settings framework.
- Completed final automated validation: the focused suite passed 69 tests in 9 files; the full Vitest suite passed 200 tests in 25 files with 1 opt-in live Ollama test skipped in 1 file; lint, formatting, type-checking, Playwright discovery of 1 Chromium test in 1 file, the production Chrome MV3 build, generated-output and manifest validation, and `git diff --check` passed. Only expected Windows LF-to-CRLF notices occurred.
- Completed real Chrome M11 validation of first-run blank state, save and options-page reload persistence, new Side Panel initialization, transient Workspace override and reopen restoration, real `qwen2.5:7b` generation, clear-to-null behavior, Knowledge and Snippet preservation, M10 capture/state behavior, popup navigation, and unchanged permissions. Persistence failure UI remains deterministically covered by automation; manual database fault injection was not required or performed.
- Completed the mandatory M11 Documentation Impact Review. Project state, architecture status, decision implementation status, UI workflow, roadmap, backlog, database schema, testing strategy, changelog, and README required synchronization. Product requirements, engineering principles, and coding-agent rules were reviewed and required no change.
- Marked Milestone 11 complete and advanced the current roadmap milestone to Milestone 12 — Import / Export without defining or expanding M12 architecture or implementation. The M11 implementation and closeout were later committed and synchronized at checkpoint `d40e031` (`feat: add default Ollama model settings`).
- Completed M12-A.1 as the corrective documentation-only execution of M12-A after the original M12-A produced no repository changes. M12-A.1 passed Principal review, introduced task governance, assigned M14 and M15 without defining their detailed architecture, and was committed and synchronized at `f09e776` (`docs: add task identifiers and assign future milestones`).
- Completed M12-B as a read-only Import / Export architecture-readiness review. It changed no files and concluded `ARCHITECTURE DEFINITION REQUIRED` because deterministic data, format, validation, restore, transaction, UI, and acceptance behavior remained undecided.
- Completed M12-C as the documentation-only definition of the implementation-ready M12 architecture. M12-C passed Principal Engineer review and is committed and synchronized at `7ebe874` (`docs: define import and export architecture`); it changed no source, test, database, schema, manifest, permission, dependency, or configuration.
- Executed M12-D as the approved Import / Export implementation task. Principal Engineer source review rejected the initial implementation because Backup Format v1 directly reused live `KnowledgeEntry`, `SnippetEntry`, and `Settings` types and object spreads, allowing future domain fields to silently enter the frozen version 1 contract.
- Completed M12-D.1 as the focused corrective continuation and Milestone 12 closeout. Dedicated frozen v1 DTOs replace live domain types at the public file contract, and export, validator, restore, and Dexie boundaries map every approved field explicitly. Principal Engineer source review approved the corrected implementation and its regression coverage.
- Completed automated M12 validation: 48 focused tests passed; the full suite passed 251 tests with 1 existing opt-in test skipped; lint, formatting, type-checking, Playwright discovery, production build and output validation, and `git diff --check` passed. Source review and automated integration tests verified atomic transaction and rollback behavior.
- Completed risk-based real Chrome validation for backup export and download; filename, envelope, version, and exact approved keys; preview and destructive acknowledgement; successful full restore; Knowledge, Snippets, and Settings restoration; round-trip equality including IDs, timestamps, tags, and source; invalid JSON and unsupported-version rejection; failed-validation preservation; valid empty-backup replacement; subsequent normal-backup restoration; and restored default-model loading in a recreated Side Panel.
- Applied the permanent risk-based manual-validation standard: destructive, persistence, data-loss or corruption, security-sensitive, external-integration, and core browser-only risks receive manual validation; reliable automation may carry low-risk, reversible, readily detectable edge cases. The already-mounted Side Panel live-refresh edge case and manual oversized-file exercise were not repeated manually because source review, automated coverage, and existing regression evidence made them non-blocking.
- Completed the Documentation Impact Review. No updates are required to `ARCHITECTURE.md`, `DECISIONS.md`, `DATABASE_SCHEMA.md`, `PRODUCT_REQUIREMENTS.md`, `UI_WORKFLOW.md`, `BACKLOG.md`, `ENGINEERING_PRINCIPLES.md`, or `CODING_AGENT_RULES.md`. The closeout restores and completes the approved architecture and creates no new architecture decision. No schema, manifest, permission, dependency, provider, architecture, or configuration change occurred.
- Created and pushed final Milestone 12 implementation checkpoint `d304f90` (`feat: add import and export backup workflow`). The working tree was clean after the checkpoint, and local `master` and `origin/master` were synchronized.
- Synchronized Milestone 12 closeout documentation at `ea3e90d` (`docs: close milestone 12 and advance to milestone 13`). The original M13-A OpenAI readiness review did not start and was superseded by the product owner's new milestone priority.
- Completed M13-A.1 as a documentation-only corrective roadmap and architecture definition. It realigns M13–M16, defines the canonical trigger, Space activation, generic editor adapters, transient catalog coordination, Dexie version 3 migration, strict Backup Format v2, Snippet UI, safety, and validation contracts, and changes no implementation, tests, dependency, or configuration. Principal Engineer approved the corrected architecture, including the single-line input capability boundary and reliable port-connected transient-cache invalidation protocol.
- M13-A.1 Documentation Impact Review: `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PRODUCT_REQUIREMENTS.md`, `DATABASE_SCHEMA.md`, `UI_WORKFLOW.md`, `ROADMAP.md`, `TESTING_STRATEGY.md`, `CHANGELOG.md`, `BACKLOG.md`, and `README.md` require synchronization. `PRODUCT_VISION.md`, `ENGINEERING_PRINCIPLES.md`, and `CODING_AGENT_RULES.md` were reviewed and require no change.
- Implemented M13-B across the Snippet domain, application and persistence boundaries, Snippet management UI, Dexie version 3, Backup Format v2 with v1 compatibility, transient trigger catalog, typed runtime messaging, editor adapters, exact trigger replacement, caret behavior, and automated regression coverage.
- Completed M13-B.1 as the catalog publication barrier correction: every active mutation participates in one global barrier, snapshot publication remains blocked until the final mutation finishes, and unknown or duplicate completion cannot release the barrier.
- Completed M13-B.2 as the all-sites and isolated-world correction. It replaced unsafe cross-world constructor checks with structural and realm-safe event/DOM boundaries, preserved the generic editor contract, and expanded content-script matching to exactly `http://*/*` and `https://*/*` under Decision 35.
- Principal Engineer source review approved M13-B and its corrections. Automated validation passed, and the product owner then completed real Chrome validation: trigger expansion, exact surrounding-content preservation, trailing-space caret placement, and multiline expansion passed in the real Intercom editor; live Snippet edit and delete updated or invalidated the catalog without reloading Intercom; expansion passed on another normal website; and unknown or deleted triggers preserved normal typing. This validates the tested workflows, not every website or editor framework.
- Committed and pushed the complete M13 implementation and corrections at `b76fcb4` (`feat: add snippet trigger expansion`). M13-C completed the documentation-only closeout and advanced project continuity to unstarted M14 without changing source or tests.
- Completed M14-I — Clipboard Delivery and committed/pushed it at `ebe915f` (`feat: add clipboard delivery for text and image snippets`). Automated validation passed. Real Chrome validated Text preparation/cleanup/notice and formatted native paste; Windows Settings readiness, Image activation, native clipboard preparation, cleanup, notice, and visible genuine-image native paste; and the post-cleanup smoke test. Failed browser Image transports and A1/A2/B probes remain historical evidence only and are absent from active runtime.

## Next Engineering Action

- Principal reviews the M14-M.4 documentation-only diff and validation evidence, then explicitly authorizes its documentation checkpoint if accepted. M14-N Automatic Backup remains the next separately gated product implementation milestone and must not start within M14-M.4.
- M14-K.2 implements the existing-Settings `snippetPasteMode`, strict Backup v6 with v1-v5 defaulting to clipboard-only, shared post-clipboard boundary, one-use browser/editor authorization, strict protocol v2, direct Win32 `SendInput`, global no-queue concurrency, and typed fallback UX while preserving protocol v1 and existing Text/Image clipboard transports.
- M14-K.3 real-browser validation is complete: automatic and clipboard-only Text/Image pass in Intercom and Crisp, unknown-trigger safety passes, and a saved clipboard-only-to-automatic change applies to an already-open Intercom tab. Deterministic focus-change, identity, modifier, sequence, concurrency, fallback, and no-retry coverage remains the safety baseline; the residual same-window native instant is documented.
- M14-H remains absorbed into M14-G.2 and is not separately active.
- A2/F9 was not run and is no longer required for the current decision tree. Do not request it again unless a future architecture task explicitly reopens it for a justified reason.

## Repository Status

- The working tree remains in the synchronized Google Drive project directory. Its root `.git` is a pointer file to a separate local non-synchronized Git metadata directory; discover the real location with `git rev-parse --absolute-git-dir`. GitHub remains the authoritative remote history and normal clone/recovery source.
- The repository contains the completed Milestone 1 development foundation and completed Milestone 2 extension shell.
- A fresh-thread reconstruction validation successfully recovered the frozen architecture, repository status, and correct current milestone using repository documentation alone.
- The approved platform may not be substituted without an explicit architecture review.
- Package management, build-tool configuration, quality tooling, testing configuration, production manifest validation, an infrastructure-only Playwright discovery test, and continuous integration are configured.
- Milestone 9 implementation checkpoint `7b88b94` is committed and synchronized locally and remotely. It generates the approved `sidepanel.html`, opens it through the popup, and satisfies the frozen M9 manifest and workflow contracts.
- The implemented Dexie-backed persistence foundation is at schema version 6. Historical v1-v5 declarations remain unchanged; v6 adds `snippetUsageStats`, `snippetGeneratedMetadata`, and local singleton `automaticBackupState`. Canonical export is Backup v7 and v1-v6 remain importable.
- The Knowledge and Snippet libraries share the options-page Library surface with lightweight local tab navigation, popup navigation, and locally persisted create, list, edit, and confirmation-protected delete workflows.
- The M10 implementation checkpoint is `6093361` (`feat: add selected-text capture shortcut`), and the M11 implementation checkpoint is `d40e031` (`feat: add default Ollama model settings`).
- M12-C architecture is committed and pushed at `7ebe874` (`docs: define import and export architecture`). The corrected and approved M12-D/M12-D.1 implementation is committed and pushed at final implementation checkpoint `d304f90` (`feat: add import and export backup workflow`); the working tree was clean after that checkpoint and local `master` matched `origin/master`.
- M14-I implementation is committed and pushed at `ebe915f` (`feat: add clipboard delivery for text and image snippets`); immediately after that checkpoint, local `master` matched `origin/master` and the working tree was clean.
- M14-I closeout documentation is committed and pushed at `28dcf53`; M14-J.1 through M14-J.5.1 are committed and pushed at `797a68a` (`feat: validate destination compatibility`); and completed M14-J lifecycle recovery/closeout is synchronized at `e4e9645` (`feat: add always-on snippet lifecycle recovery`).
- M14-K Automatic Paste is Principal-approved, real-browser validated, complete, and closed at implementation checkpoint `e34cd76` (`feat: add automatic snippet paste delivery`) and synchronized closeout checkpoint `3e5d545` (`docs: close out automatic snippet paste milestone`). M14-L preflight confirmed clean synchronized `master`.
- The headless Retrieval Engine exists with deterministic exact-token lexical ranking over Knowledge and Snippets through their existing repository contracts.
- The headless Prompt Builder exists with deterministic provider-independent composition over optional Merchant Context, optional Guidance, and optional prepared Retrieval Results.
- The project-owned `GenerationProvider` and local-only `OllamaProvider` exist and remain unchanged. Rich Snippet Templates is assigned to M14, Multimodal Screenshot Context to M15, OpenAI Provider Expansion to M16, and supported future activation of an already-visible Chrome Side Panel remains an approved unassigned direction.

## Continuity Handoff

- Frozen architecture: WXT and Manifest V3 with the approved TypeScript, React, Tailwind CSS, pnpm, Dexie, validation, testing, and commit-gate stack listed above.
- Last completed architecture checkpoint: M14-L/L.1 at `5450cff`. M14-K remains CLOSED / COMPLETE and REAL-BROWSER VALIDATED. M14-M.0 is **PASS / REAL-CHROME VALIDATED**; M14-M.1 plus M14-M.1.1 are committed and synchronized at `20b509c`; M14-M.2 is committed and synchronized at `f4d9ab0`; M14-M.3/M14-M.3.1 is committed and synchronized at `2475f8b`; and M14-M.4 records the completed separate Git metadata relocation without changing product architecture.
- Approved M13 implementation checkpoint: `b76fcb4` (`feat: add snippet trigger expansion`). It contains M13-B, M13-B.1, and M13-B.2 and remains the implementation checkpoint after the later documentation closeout.
- Historical M14-A preflight and starting point: branch `master`, clean working tree, and local `master` synchronized with `origin/master` at M13-C closeout checkpoint `9a3c7ef` (`docs: close milestone 13 and activate milestone 14`). This is historical starting-state information, not the expected post-architecture HEAD.
- M14-A architecture checkpoint: `c1105d4` (`docs: define rich snippet template architecture`).
- M14-B implementation checkpoint: `ed23f30` (`feat: add structured snippet content foundation`).
- Future continuity: M14-A is complete and approved architecture. A future thread must not treat it as active, pending, uncommitted architecture work, or work that must be recreated.
- M14-C implements Rich Snippet Library authoring at `a787100` on the existing aggregate and application boundary.
- M14-D is complete at `64504df`, Decision 38 at `f9b5097`, and M14-E at `1828f09`.
- Historical architecture correction: M14-F.1/Decision 39 at `b7d16ec`. Former M14-F is cancelled before implementation. M14-I.2 / Decision 43 and the M14-I.3–M14-I.5 implementation are committed in `ebe915f`; Decisions 42 and 43 are unchanged by closeout.
- Exact next action: Principal reviews the unstaged M14-M.4 documentation and validation evidence, then decides whether to authorize its documentation checkpoint. M14-N remains the next separately gated product implementation milestone and must not start in this task.
- Additional business functionality starts only in its assigned later milestones.

## Outstanding Risks

- Browser-specific behaviors require automated and manual validation. M14-J.3 JSDOM event-shaped composed-path/target-range fixtures prove controlled logic, and real Intercom validates that correction plus ordinary rich Text. M14-J.4 JSDOM parsing proves standards-valid list topology and hard-break output. M14-J.5 confirms the corrected live record through persistence, serialization, delivery-payload equality, and normal Intercom paste. Intercom bullet-list triggering immediately after Shift+Enter remains a known low-priority compatibility limitation. Crisp validates the M14-J.2 structural path and Image paste; Intercom Image paste also passes.
- Image Snippets are perceived as somewhat slower than Text Snippets. Crisp and Intercom Image delivery remain functionally PASS, and the Class-C architecture opportunity remains deferred while hardening foundations are active. Before M14-P closes, re-measure real-world Text/Image delivery; if meaningful user-visible delay remains, require a focused optimization gate before M15 rather than automatically deferring it until after AI Workspace implementation.
- Windows validates foreground/root-window/process and clipboard identity immediately before `SendInput` but cannot atomically identify a DOM editor at that instant. Automated M14-K.2 guards minimize the interval, and M14-K.3 real-browser evidence accepted the residual same-window race within the documented layered safety model. Any future evidence of wrong-editor paste reopens that safety assessment.
- Chrome may retain webpage keyboard routing when an already-visible Side Panel receives an internal Guidance focus/caret request. The user may need to click Guidance until Chrome exposes a supported panel-activation API; no M10 workaround is authorized.
- Cross-world preload mismatch and unused generated preload warnings are currently classified as non-blocking WXT/Vite/Chrome generated-output observations with no functional impact. Revisit only with functional or performance evidence.
- Broad normal-site access is intentional for M13 trigger expansion: generated output must match exactly `http://*/*` and `https://*/*` with frame-local `all_frames: true`. Chrome-protected and non-HTTP(S) pages remain unavailable. This increases permission exposure, so bounded candidate reading, password/specialized-input exclusion, no logging or transmission, no persistent catalog, and fail-closed unsupported-editor behavior remain mandatory.
- Real browser generation depends on the M9 `sidePanel` permission, localhost host permission, and environment-specific external Ollama `OLLAMA_ORIGINS` configuration. These boundaries passed manual Chrome validation, but environment setup remains external and must not be changed automatically.
- Local-model instruction following is not perfect; one validated `qwen2.5:7b` response used the phrase “Delivery should be soon.” despite Guidance not to promise a delivery date. This is a future prompt/model-quality concern rather than an M9 workflow failure.
- M14-I.1.5.2 preserves historical evidence: Offscreen Async, M14-I.1.4 `snippet.png`, and A1 `TEXT` failed Image semantics; focused extension-page B `VISIBLE IMAGE` passed only as a capability control. M14-I.5 removes all of those experimental runtime paths and probes. M15 Context Images and M16 OpenAI remain separate.
- Decision 43 is backed by native automated coverage, a real-Chrome end-to-end Image pass, and a post-cleanup smoke pass through the registered development companion. Production installer/signing/reputation, enterprise user-level-host policy, and broad destination compatibility remain unresolved; the development pass is not a production-packaging claim.
- Product-owner Chrome validation passed the real Intercom editor and another normal website, but did not test every website or editor framework. Unsupported or unsafe editor structures continue to fail closed, and Chrome-protected, browser-internal, extension, `file://`, and unsupported-scheme pages remain unavailable.
- History remains intentionally undecided and must not be assumed to be in scope.
- The already-mounted Side Panel does not live-refresh a restored default model; recreating the Side Panel loads the restored value. This edge case and a manual oversized-file exercise were not repeated during M12 closeout and are non-blocking because their required behavior is covered by source review and automated tests.

## Git Checkpoint Continuity

- Approved M13 implementation checkpoint: `b76fcb4` (`feat: add snippet trigger expansion`). It remains the authoritative M13 source-and-test checkpoint.
- M13-C documentation checkpoint: `9a3c7ef` (`docs: close milestone 13 and activate milestone 14`).
- Historical M14-A starting checkpoint: `9a3c7ef`. At preflight, branch `master` was clean and local `master` was synchronized with `origin/master`; this does not describe the expected HEAD after the architecture checkpoint.
- M14-A architecture checkpoint: `c1105d4` (`docs: define rich snippet template architecture`).
- M14-B implementation checkpoint: `ed23f30` (`feat: add structured snippet content foundation`).
- M14-C implementation checkpoint: `a787100` (`feat: add rich snippet authoring`).
- M14-D architecture checkpoint: `64504df` (`docs: define rich snippet delivery and local image architecture`).
- M14-D.2 architecture clarification checkpoint: `f9b5097` (`docs: define pre-delivery local image trigger safety`).
- M14-E implementation checkpoint: `1828f09` (`feat: add local image asset foundation and backup v4`).
- M14-F.1 Decision 39 is committed at `b7d16ec`; M14-G/G.1/G.2/G.2.1 is committed at `672185e`; M14-I through M14-I.5 is committed and pushed at `ebe915f`; its documentation closeout is committed at `28dcf53`; M14-J.1 through M14-J.5.1 are committed at `797a68a`; M14-J lifecycle recovery/closeout is committed and pushed at `e4e9645`; M14-K.1 / Decision 45 is committed at `5066476`; the complete approved M14-K implementation is synchronized at `e34cd76`; and M14-K.5 closeout is synchronized at `3e5d545`.
- M14-M.3/M14-M.3.1 usage-statistics implementation is committed and synchronized at `2475f8b` (`feat: add snippet usage statistics`). M14-M.4 begins from that clean synchronized checkpoint and creates no commit or push.
- Checkpoint history relevant to the handoff: `043daca` defined M13 architecture, `b76fcb4` implemented M13, `9a3c7ef` closed M13, `c1105d4` defined M14-A, `ed23f30` implemented M14-B, and `a787100` implemented M14-C.
