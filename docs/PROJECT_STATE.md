# Project State

## Product Identity and Purpose

- AI Support Workspace is a long-lived, local-first Chrome extension for support work. It combines locally managed Knowledge and reusable Snippets, deterministic retrieval and prompt composition, local Ollama-assisted drafting in a Chrome Side Panel, explicit selected-text capture, local Settings, backup/restore, and safe Snippet trigger expansion in supported web editors.
- User-controlled support data remains local by default. The product has no hosted backend, cloud synchronization, telemetry, editor-content logging, or silent provider transmission.

## Current Milestone

- Milestone 14 — Snippet Authoring and Delivery
- Status: M14-J — Destination Compatibility Validation / Reliability is COMPLETE and REAL-BROWSER VALIDATED. M14-J.1–J.5.1 are committed at `797a68a`; M14-J.6 implementation/tests/configuration and this M14-J.7 closeout documentation remain unstaged pending the Principal's combined checkpoint review. M14-K — Automatic Paste is the exact next milestone task and is NOT STARTED. M15 is NOT STARTED.

## Task State

### M14-J.7 — M14-J Milestone Closeout & Git Checkpoint Preparation

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

- Status: Milestone 14 is current. M14-J is COMPLETE and REAL-BROWSER VALIDATED. M14-J.1–J.5.1 are committed at `797a68a`; the combined M14-J.6 implementation and M14-J.7 closeout remain unstaged pending Principal checkpoint review. Intercom/Crisp no-refresh recovery and repeated-reload idempotency pass. Text clipboard transport and Windows native Image architecture are unchanged. M14-K is next and NOT STARTED.
- Scope: Completed Milestone 9 provides the first complete manual Context-to-generated-output workflow through a global foreground Chrome Side Panel, a focused application `OutputWorkflow`, automatic local retrieval, Prompt Builder, the project-owned generation boundary, transient model input, editable plain-text output, and Copy. `DECISIONS.md` remains authoritative for the exact M9 scope and non-goals.
- Completed M10 scope: exactly one browser-scoped `capture-selection-to-workspace` command captures explicit main-frame selection through `activeTab` and `scripting`, immediately opens or activates the global Side Panel without awaiting capture, delivers the typed result through a transient delivery-ID ready/acknowledgement handshake, replaces Merchant Context, requests Guidance DOM focus with a collapsed end caret, and leaves Generate manual. Opening a closed panel makes Guidance immediately usable. For an already-visible panel, Chrome may retain webpage keyboard routing despite the internal focus/caret request, so the user may need to click Guidance. The service worker owns only browser coordination and transient acknowledged delivery; M9 foreground generation remains unchanged.
- Business functionality: The Knowledge Library, Snippet Library, local lexical Retrieval Engine, deterministic provider-independent Prompt Builder, project-owned generation boundary, local Ollama provider adapter, and global Side Panel Output Workspace are implemented and validated. Libraries remain in the options page and open in a normal browser tab.
- The completed runtime shell provides the approved background service worker, content script, popup, and options-page boundaries required for later milestones.
- Completed M13 provides optional unique Snippet triggers; canonical validation; Dexie schema version 3; Backup Format v2 with v1 import compatibility; a transient service-worker catalog synchronized through long-lived typed frame ports; exact plain-text-only replacement and caret restoration in supported textarea, absent/text/search input, and contenteditable editors; multiline textarea/contenteditable support; all-normal-HTTP/HTTPS availability; bounded trigger inspection with no full-editor scanning; no clipboard, telemetry, or provider transmission; and fail-safe normal typing when expansion is unavailable.

## Approved Future Product Directions

- **M14 — Snippet Authoring and Delivery:** The existing `SnippetEntry` aggregate remains authoritative. M14-I is complete at `ebe915f`; Backup v1-v5, Dexie v5, Decisions 42/43, metadata-only catalogs, and legacy compatibility remain unchanged. M14-J is complete and real-browser validated: Crisp Text/Image/no-refresh pass; Intercom Shadow-DOM Text/normal list/Image/no-refresh pass; repeated reload remains duplicate-safe. M14-J.4's generic `<br>` correction and M14-J.5's production-excluded diagnostic remain. Decision 44 is final. M14-K Automatic Paste is next and not started.
- **M14-I.3 — Windows Native Clipboard Companion Foundation:** IMPLEMENTED / PRINCIPAL ENGINEER APPROVED / COMMITTED IN `ebe915f`. M14-I.4 consumes this foundation without changing its framing or clipboard guarantees.
- **M14-I.3.1 — Native Host Framing and Partial-Failure Safety Correction:** IMPLEMENTED / AUTOMATED-VALIDATED / COMMITTED IN `ebe915f`. Production processing no longer inspects stdin after the declared frame, and deterministic fault-injection coverage records best-effort partial clearing, ownership, no retry, and close-error precedence. Decision 42 and Decision 43 architecture remain unchanged.
- **M14-I.4 — Chrome Native Messaging Integration and Development Registration:** IMPLEMENTED / AUTOMATED-VALIDATED / DEVELOPMENT HOST REGISTERED UNDER HKCU / REAL-CHROME IMAGE VALIDATED / COMMITTED IN `ebe915f`. `nativeMessaging` is optional and requested only from the Settings action; Text remains browser-only. Normal Windows Image delivery uses the `.dev` native host with no browser fallback.
- **M14-I.4.1 — Native Companion Capability Status Correction:** IMPLEMENTED / AUTOMATED-VALIDATED / REAL-CHROME SETTINGS READINESS PASS / COMMITTED IN `ebe915f`. Callback-aligned Native Messaging and stable service-worker `sendResponse` handling map compatible success to Ready while keeping unavailable, incompatible, and invalid responses distinct.
- **M14-I.5 — Native Image Delivery Cleanup and M14-I Finalization:** IMPLEMENTED / CLEANUP COMPLETE / POST-CLEANUP REAL-CHROME SMOKE PASS / COMMITTED IN `ebe915f`. Failed offscreen Image delivery, File semantics, A1/A2/B runtime probes, probe-only contracts/tests, and obsolete diagnostics are removed. Text offscreen delivery and Windows native Image delivery remain the only supported transports for their respective kinds.
- **Optional Automatic Native Paste Helper — Future Investigation:** A later separable capability could explore carefully focus-gated native `Ctrl+V`/input injection. It is not part of the M14-I.2 clipboard foundation, has no AutoHotkey or `SendInput` implementation approval, and must preserve manual `Ctrl+V` as fallback.
- **Workspace Shell Action UX — Unassigned:** The current toolbar action still opens the popup. A future shell task will make the toolbar action open the existing global Workspace Side Panel directly and add a panel Library action that opens the full options/Library page in a normal browser tab. Full Library, Settings, and Import / Export management stays in options. This is not M14-G through M14-J and does not interrupt the Snippet sequence.
- **M15 — Multimodal Screenshot Context:** Merchant Context should eventually combine text with one or more transient clipboard screenshots for generation through a provider-independent capability boundary. Unsupported screenshots must never disappear silently. Detailed M15 architecture remains deferred.
- **M16 — OpenAI Provider Expansion:** Add OpenAI and provider selection behind the existing provider-independent boundary after credentials, permissions, endpoints, models, privacy, and error behavior are defined.
- **Chrome Side Panel Focus Activation:** Activate or focus an already-visible Side Panel after shortcut capture if Chrome exposes a supported API; no M10 workaround is authorized.
- The Side Panel focus direction remains unassigned. M14–M16 retain their roadmap ownership. M13 remains authoritative for trigger persistence, editor activation, and runtime synchronization; M14-B preserves those behaviors while projecting structured content to the existing plain catalog payload. Decision 36 does not reopen M9, redefine M10, or change the existing Ollama/AI workflow.

## Milestone 12 Architecture

- M12 provides manual local backup, restoration after reinstall or browser-data loss, and file-based transfer to another Chrome profile or computer. It is not synchronization, collaboration, sharing workflow, bulk editing, automatic backup, or scheduled backup.
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
- Future Image delivery is opt-in clipboard preparation followed by real user `Ctrl+V`. The typed frame catalog carries no image bytes/base64/asset ID. `clipboardRead` and synthetic paste are prohibited. M14-F.1 adds no permission or transport.
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

- Principal review of the full unstaged M14-J.6 implementation/tests/configuration plus M14-J.7 closeout documentation is the exact next action. After approval, create and push one combined M14-J milestone checkpoint, verify local/remote synchronization, and then begin M14-K. Codex has not staged, committed, or pushed.
- M14-J.6 implementation, automated validation, Intercom/Crisp no-refresh recovery, and repeated-reload idempotency pass. Decision 44 fixes persistent host access at exactly `http://*/*` and `https://*/*`; `activeTab` remains for M10 but is not the recovery authority. No `tabs`, `file://`, `clipboardRead`, polling, alarm, or keepalive was added.
- M14-J.2 is real-Crisp PASS. M14-J.3 Shadow DOM support and ordinary rich Text are real-Intercom PASS. M14-J.4 controlled list/hard-break serialization passes. M14-J.5's corrected record and normal Intercom list paste pass, as do Crisp and Intercom Image paste. Intercom bullet triggering after Shift+Enter remains a known low-priority compatibility limitation. Automatic native paste remains deferred and is not part of M14-J.
- M14-H remains absorbed into M14-G.2 and is not separately active.
- A2/F9 was not run and is no longer required for the current decision tree. Do not request it again unless a future architecture task explicitly reopens it for a justified reason.

## Repository Status

- The repository contains the completed Milestone 1 development foundation and completed Milestone 2 extension shell.
- A fresh-thread reconstruction validation successfully recovered the frozen architecture, repository status, and correct current milestone using repository documentation alone.
- The approved platform may not be substituted without an explicit architecture review.
- Package management, build-tool configuration, quality tooling, testing configuration, production manifest validation, an infrastructure-only Playwright discovery test, and continuous integration are configured.
- Milestone 9 implementation checkpoint `7b88b94` is committed and synchronized locally and remotely. It generates the approved `sidepanel.html`, opens it through the popup, and satisfies the frozen M9 manifest and workflow contracts.
- The implemented Dexie-backed persistence foundation is at schema version 5. M14-E adds only `snippetAssets: 'id, snippetId, createdAt'`; historical v1-v4 declarations remain unchanged.
- The Knowledge and Snippet libraries share the options-page Library surface with lightweight local tab navigation, popup navigation, and locally persisted create, list, edit, and confirmation-protected delete workflows.
- The M10 implementation checkpoint is `6093361` (`feat: add selected-text capture shortcut`), and the M11 implementation checkpoint is `d40e031` (`feat: add default Ollama model settings`).
- M12-C architecture is committed and pushed at `7ebe874` (`docs: define import and export architecture`). The corrected and approved M12-D/M12-D.1 implementation is committed and pushed at final implementation checkpoint `d304f90` (`feat: add import and export backup workflow`); the working tree was clean after that checkpoint and local `master` matched `origin/master`.
- M14-I implementation is committed and pushed at `ebe915f` (`feat: add clipboard delivery for text and image snippets`); immediately after that checkpoint, local `master` matched `origin/master` and the working tree was clean.
- M14-I closeout documentation is committed and pushed at `28dcf53`; M14-J.1 through M14-J.5.1 are committed and pushed at `797a68a` (`feat: validate destination compatibility`).
- The headless Retrieval Engine exists with deterministic exact-token lexical ranking over Knowledge and Snippets through their existing repository contracts.
- The headless Prompt Builder exists with deterministic provider-independent composition over optional Merchant Context, optional Guidance, and optional prepared Retrieval Results.
- The project-owned `GenerationProvider` and local-only `OllamaProvider` exist and remain unchanged. Rich Snippet Templates is assigned to M14, Multimodal Screenshot Context to M15, OpenAI Provider Expansion to M16, and supported future activation of an already-visible Chrome Side Panel remains an approved unassigned direction.

## Continuity Handoff

- Frozen architecture: WXT and Manifest V3 with the approved TypeScript, React, Tailwind CSS, pnpm, Dexie, validation, testing, and commit-gate stack listed above.
- Last completed milestone task: M14-J — Destination Compatibility Validation / Reliability. It is COMPLETE and REAL-BROWSER VALIDATED. M14-J.1–J.5.1 are committed at `797a68a`; M14-J.6 implementation and M14-J.7 closeout remain unstaged pending a combined Principal-approved checkpoint. M14-K Automatic Paste is exact next and NOT STARTED.
- Approved M13 implementation checkpoint: `b76fcb4` (`feat: add snippet trigger expansion`). It contains M13-B, M13-B.1, and M13-B.2 and remains the implementation checkpoint after the later documentation closeout.
- Historical M14-A preflight and starting point: branch `master`, clean working tree, and local `master` synchronized with `origin/master` at M13-C closeout checkpoint `9a3c7ef` (`docs: close milestone 13 and activate milestone 14`). This is historical starting-state information, not the expected post-architecture HEAD.
- M14-A architecture checkpoint: `c1105d4` (`docs: define rich snippet template architecture`).
- M14-B implementation checkpoint: `ed23f30` (`feat: add structured snippet content foundation`).
- Future continuity: M14-A is complete and approved architecture. A future thread must not treat it as active, pending, uncommitted architecture work, or work that must be recreated.
- M14-C implements Rich Snippet Library authoring at `a787100` on the existing aggregate and application boundary.
- M14-D is complete at `64504df`, Decision 38 at `f9b5097`, and M14-E at `1828f09`.
- Historical architecture correction: M14-F.1/Decision 39 at `b7d16ec`. Former M14-F is cancelled before implementation. M14-I.2 / Decision 43 and the M14-I.3–M14-I.5 implementation are committed in `ebe915f`; Decisions 42 and 43 are unchanged by closeout.
- Exact next action: Principal Git review of the complete M14-J.6 + M14-J.7 working tree, followed by an authorized combined checkpoint and push. Then begin M14-K. Manual `Ctrl+V` remains current behavior until M14-K.
- Additional business functionality starts only in its assigned later milestones.

## Outstanding Risks

- Browser-specific behaviors require automated and manual validation. M14-J.3 JSDOM event-shaped composed-path/target-range fixtures prove controlled logic, and real Intercom validates that correction plus ordinary rich Text. M14-J.4 JSDOM parsing proves standards-valid list topology and hard-break output. M14-J.5 confirms the corrected live record through persistence, serialization, delivery-payload equality, and normal Intercom paste. Intercom bullet-list triggering immediately after Shift+Enter remains a known low-priority compatibility limitation. Crisp validates the M14-J.2 structural path and Image paste; Intercom Image paste also passes.
- Image Snippets are perceived as somewhat slower than Text Snippets. Crisp and Intercom Image delivery remain functionally PASS; latency is a non-blocking future performance investigation and is not a prerequisite for M14-K.
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
- M14-F.1 Decision 39 is committed at `b7d16ec`; M14-G/G.1/G.2/G.2.1 is committed at `672185e`; M14-I through M14-I.5 is committed and pushed at `ebe915f`; its documentation closeout is committed at `28dcf53`; and M14-J.1 through M14-J.5.1 are committed and pushed at `797a68a`. M14-J.6 implementation/tests/configuration and M14-J.7 closeout documentation form the current unstaged, uncommitted combined milestone-checkpoint candidate. M14-J is complete and real-browser validated.
- Checkpoint history relevant to the handoff: `043daca` defined M13 architecture, `b76fcb4` implemented M13, `9a3c7ef` closed M13, `c1105d4` defined M14-A, `ed23f30` implemented M14-B, and `a787100` implemented M14-C.
