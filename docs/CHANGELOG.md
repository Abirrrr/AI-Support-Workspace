# Changelog

## [Unreleased]

### M14-G.2 — Unified Snippet Library UX and Image Snippet Authoring

- Replaced the technical Plain/Rich block-and-segment workflow with a unified Text Snippet experience backed by Tiptap 3.29.2. New Text records are Rich, supported content is constrained to paragraphs/line breaks, bold, italic, safe links, bullets, and numbering, and a project-owned adapter keeps Tiptap/HTML out of persistence.
- Added historical Plain draft conversion on successful Save only, natural supported Rich reopen, nested-list/unsupported-node rejection, image-paste rejection in Text, and read-only preservation for legacy Rich image/reference records.
- Simplified the Library with search, All/Text/Images filters, Text/Image labels, and a New Snippet chooser. Added Image Snippet clipboard screenshot paste, secondary file selection, M14-E validation, local revocation-safe preview, create/edit/replace/cancel/reopen/delete, and exactly-one atomic persistence without exposing asset IDs.
- Preserved Backup v5 and v1-v4 import compatibility, Dexie v5, Retrieval/Prompt/catalog Image isolation, Decision 38, and the M13-B.1 publication barrier. Added no Backup v6, schema migration, external clipboard transport, clipboard permission, offscreen document, rich destination delivery, Workspace Shell change, or M15 Context behavior.
- Added Decision 41. M14-H is absorbed into M14-G.2; M14-I becomes unified Text + Image clipboard delivery and trigger planning; M14-J remains destination validation. This work is uncommitted pending Principal review.

### M14-G — Rich Snippet Structured Lists and Backup v5 Foundation

- Added non-recursive unordered and ordered Rich list blocks with exact item/inline validation, deterministic bullet/one-based plain projection, and project-owned keyboard-accessible list authoring for items, marks, validated links, item/block ordering, and removal. Persisted content remains structured data, never HTML.
- Added the minimal exact top-level `ImageSnippetContent` contract containing only `kind: 'image'` and a canonical `assetId`. Reused the M14-E graph validator to enforce exactly one same-owner asset and reject missing, foreign, additional, or orphan assets without changing asset size/MIME/signature rules.
- Explicitly excluded Image Snippets from Retrieval, Prompt Builder reference content, and the current plain trigger catalog. The Library identifies pre-M14-H Image records without exposing asset IDs or binary data and disables Plain/Rich editing while preserving normal deletion/cascade behavior.
- Implemented strict frozen Backup Format v5 with explicit version-owned DTOs and mappings for lists, top-level Image content, legacy Rich references/local images, and existing binary assets. New exports use v5 with deterministic ordering, exact bytes, the retained 96 MiB guard, strict untrusted validation, authoritative graph reuse, and atomic four-store restore. Frozen v1-v4 imports remain supported and v4 legacy Rich images are not converted.
- Kept Dexie at physical version 5 with no new store, index, migration, or row rewrite. Preserved Decision 38 legacy Rich local-image fail-closed behavior, the M13-B.1 publication barrier, existing Plain/Rich authoring, and all historical backup behavior.
- Added domain, editor, Library, persistence, retrieval, Prompt Builder, trigger-catalog, asset-graph, and Backup v5 coverage including PNG/JPEG/WebP byte round trips and strict rejection cases. Added no Image Snippet authoring, screenshot paste UI, image clipboard transport, permission, offscreen document, Workspace Shell change, Rich destination rendering, or M15 Context Image behavior.
- At the M14-G foundation stage, Image authoring remained assigned to M14-H; Decision 41/M14-G.2 now supersedes that forward-looking assignment by absorbing and implementing it.

### M14-F.1 — Snippet Image Product Boundary Architecture Correction

- Cancelled M14-F Unified Rich Editor Inline Image Authoring before implementation. Decision 39 supersedes Decision 37's unimplemented target of locally owned images embedded among Rich text while preserving Decision 37/M14-E's local asset, validation, persistence, backup-history, native-paste, and M15-separation foundations.
- Defined the authoritative product split: Plain/Rich Snippets are portable reusable text targeting paragraphs, bold, italic, links, bullets, and numbered lists; Image Snippets are a distinct image-only `SnippetContent` type with exactly one locally owned image and the normal trigger system; Context Images remain future M15 generation inputs.
- Defined the minimal non-recursive Rich list block and deterministic `- ` / one-based numeric plain projection. Excluded nested lists, tasks, tables, HTML/CSS, embeds, and new local-image Rich authoring.
- Reused M14-E rather than reverting it: keep `SnippetAsset`, PNG/JPEG/WebP validation, Blob persistence, Dexie v5 `snippetAssets`, one-Snippet ownership, aggregate limits, atomic transactions, base64 utilities, Backup v4 import, and graph validation. Repurpose them for one-image Image Snippets.
- Froze Backup v4 and approved one Backup v5 transition for both list blocks and `ImageSnippetContent`, with v1-v4 import compatibility and atomic restore. Dexie remains physical version 5 because content discriminants/blocks require no store or index change.
- Preserved existing Rich local-image records as parseable, non-destructive, Backup-v4-compatible legacy data under Decision 38. Defined no automatic conversion and an optional future conversion only for exactly one valid local-image block with one owned asset and no other content/asset.
- Defined a typed future catalog whose Image entry contains only trigger/Snippet identity and delivery kind. Blob, base64, asset ID, and filename never enter frame snapshots; the service worker retrieves and validates the requested asset from Dexie only at activation.
- Defined Image delivery as opt-in PNG clipboard preparation followed by real user `Ctrl+V`, with no synthetic paste or destination-placement promise. Failure preserves the trigger; success removes only the unchanged trigger plus activation space, leaves no placeholder/trailing space, and reports `Image copied — press Ctrl+V`.
- Reverified current primary platform constraints: warning-bearing `clipboardWrite`; runtime optional-permission rules; MV3 `offscreen` with `CLIPBOARD`; PNG as the portable clipboard image representation; and the need to prove WXT optional declarations, grant/runtime lifecycle, JPEG/WebP-to-PNG conversion, decoded-pixel safety, and native destination paste in M14-I. Added no permission.
- Revised the remaining sequence to M14-G lists/Backup v5, M14-H Image Snippet authoring, M14-I typed clipboard image delivery, and M14-J Rich text/list destination validation. M14-F.1 changes documentation only: no source, tests, configuration, dependency, database, backup implementation, manifest, or permission changes; no commit or push.

### M14-E — Local Image Asset Foundation and Backup v4

- Added the exact Snippet-owned `SnippetAsset` model and local-image Rich block with PNG/JPEG/WebP MIME and signature validation, byte-count checks, canonical UUID/timestamp checks, and 5 MiB per-asset, 20 MiB per-Snippet, and 40 MiB project limits.
- Added complete ownership-graph validation and atomic Snippet/asset create, update, removal, and cascading delete behavior. Existing Snippet callers require no assets, and metadata edits preserve referenced assets.
- Implemented forward-only Dexie v5 with only `snippetAssets: 'id, snippetId, createdAt'` added. V1-v4 declarations remain unchanged, and v4-to-v5 creates an empty table without rewriting structured Snippets.
- Implemented strict Backup Format v4 with dedicated DTOs, canonical padded base64, exact byte/signature and graph validation, deterministic asset ordering, a 96 MiB v4 guard, and atomic four-store restore. Frozen v1-v3 imports remain supported and restore no synthetic assets.
- Preserved deterministic Retrieval/Prompt projections and added a non-fetching Rich-editor compatibility guard. Decision 38 omits legacy Rich local-image-containing Snippets from the transient catalog without changing Plain, portable Rich text, or legacy URL-reference publication.
- Added focused unit and fake-indexeddb coverage for asset validation, graph integrity, transaction rollback, migration, backup byte round trips and rejection cases, editor preservation, and catalog exclusion. No authoring ingestion, preview/object URL, clipboard permission/transport, destination adapter, or rich host rendering was added.

### M14-D — Rich Snippet Delivery and Local Image Architecture

- Added Decision 37 as a deliberate partial supersession of Decision 36 after M14-C product evidence. Preserved the single Snippet aggregate/Library, project-owned structured content, deterministic text projection, Retrieval/Prompt Builder compatibility, M13 catalog/trigger guarantees, local-first ownership, and provider independence.
- Defined the target authoring UX as one continuous Rich document surface with normal clipboard paste and Insert Image from disk. The M14-C Label/URL Image Reference controls are transitional; existing URL references remain readable/importable/removable and are never fetched or automatically converted.
- Defined Snippet-owned local image blocks and assets, draft-only ingestion/previews, object-URL revocation, atomic Save/delete/cancel semantics, PNG/JPEG/WebP validation, and explicit 5 MiB per-asset, 20 MiB per-Snippet, and 40 MiB project/profile limits. Durable assets remain separate from M15 screenshots and provider requests.
- Defined Dexie v5 with dedicated `snippetAssets: 'id, snippetId, createdAt'`, no v4 record rewrite, and transactionally enforced ownership/orphan prevention. Defined strict single-JSON Backup v4 with canonical base64 assets, deterministic order, a 96 MiB serialized guard, complete graph validation, atomic restore, and frozen v1/v2/v3 import compatibility.
- Added the application Delivery Planner and behavioral capability/outcome model for reliable direct insertion, clipboard-assisted native paste, intentional degradation, and unsupported cases. Local images cannot be silently omitted, exposed as asset IDs, or claimed delivered without evidence.
- Defined globally opt-in clipboard fallback using future optional `clipboardWrite` and optional `offscreen`, separate safe plain/HTML serialization and transport, a short-lived MV3 offscreen document, no `clipboardRead`, failure-safe input preservation, and compare-and-swap cleanup only after successful write. M14-D adds no manifest permission or runtime behavior.
- Recorded Crisp evidence accurately: ordinary direct Plain insertion fails in the tested editor, the same Snippet works elsewhere, the failed speculative contenteditable patch was removed, and manual native paste works. No Crisp-specific adapter or synthetic paste is approved.
- Revised the sequence to M14-E asset/Dexie v5/Backup v4 foundation, M14-F unified inline-image authoring, M14-G delivery/clipboard fallback, and M14-H proven Rich/image destination delivery. Reviewed `ENGINEERING_PRINCIPLES.md` and `CODING_AGENT_RULES.md`; no changes were materially required.
- M14-D is architecture/documentation only. It changes no source, tests, configuration, dependency, manifest, permission, schema implementation, or backup implementation, and performs no commit or push. M14-C remains the last completed implementation task at `a787100`; the next action is M14-E — Local Image Asset Foundation and Backup v4.

### M14-C — Rich Snippet Library Authoring UI

- Added explicit draft-only `Convert to rich template` behavior in the existing Snippet Library. Conversion preserves exact readable text in one unformatted paragraph, does not persist before Save, updates the same Snippet identity, and leaves stored Plain content unchanged on Cancel.
- Added a project-owned structured Rich editor for ordered paragraph and image-reference blocks. Paragraphs support ordered text/link segments, explicit bold and italic marks, link creation/edit/removal, segment removal, and keyboard-operable block movement through semantic buttons.
- Reused the M14-B URL validators for focused link and image-reference feedback. Unsafe protocols prevent Save, image URLs remain text-only references, pasted markup stays inert input text, and the UI creates no `contenteditable`, HTML parser, live `<img>` preview, fetch, upload, asset store, or clipboard permission.
- Preserved ordinary Plain creation/editing, title/tags/trigger ownership, canonical trigger behavior, delete/cancel/save flows, projected list previews, and the single `SnippetEntry` application/repository path. Added Plain/Rich list indicators without creating another Library, entity, repository, or trigger system.
- Added focused conversion, structured-editor, URL-safety, ordering, persistence/reopen, plain-regression, deterministic-projection, and Backup v3 compatibility coverage. M13-B.1 catalog publication remains unchanged, and browser expansion continues using deterministic plain projection.
- Documentation Impact Review synchronized project state, architecture status, product requirements, roadmap, backlog, UI workflow, testing strategy, changelog, and README. `DECISIONS.md`, `DATABASE_SCHEMA.md`, `CODING_AGENT_RULES.md`, and `ENGINEERING_PRINCIPLES.md` required no changes.
- M14-C is complete at `a787100` (`feat: add rich snippet authoring`). M14-D later revised the pending local-image and delivery architecture without changing M14-C source.

### M14-B — Structured Snippet Content and Backup Foundation

- Implemented the Decision 36 `SnippetContent` union, exact structured validation, approved link/image URL protocols, deep explicit mapping, and deterministic plain-text projection.
- Evolved the existing `SnippetEntry` and repository contracts without adding another aggregate, repository, Library, or trigger system. Existing UI-created Snippets default to plain content.
- Implemented forward-only Dexie version 4 with unchanged indexes and no new table. The migration wraps every legacy v3 content string exactly as plain content, preserves metadata and timestamps, retains physical trigger omission, and fails unexpected legacy content.
- Implemented Backup Format v3 with dedicated exact DTOs, explicit export/restore mappings, strict rich-content validation, and plain/rich round trips. Frozen Backup v1 and v2 imports remain supported and map their strings to current plain content.
- Routed Retrieval Engine, Prompt Builder, and the unchanged M13 transient catalog through the canonical plain projection. The M13-B.1 publication barrier and plain browser-expansion contract remain intact.
- Added the minimal existing Snippet Library guard: projected rich previews, safe deletion, and metadata edits that preserve structured content. Rich authoring and rich browser rendering remain out of scope.
- Added focused domain, migration, repository, backup, retrieval, Prompt Builder, trigger-catalog, and UI regression coverage. Introduced no dependency, binary asset system, provider change, network behavior, or Chrome permission.
- M14-B implements the foundation only. The next action is M14-C — Rich Snippet Library Authoring UI; no M14-B checkpoint hash is recorded before the eventual Principal-approved implementation commit exists.

### M14-A — Rich Snippet Templates Architecture and Product Boundary

- Defined M14 as an extension of the existing `SnippetEntry`, Snippet Library, repository, M13 trigger, transient catalog, and editor-adapter system rather than a second Template entity, Library, or trigger mechanism.
- Approved one canonical `SnippetContent` discriminated union for exact plain text or ordered rich blocks. Limited rich v1 data to paragraphs with ordered text/link inline nodes and labelled HTTP(S) image-reference blocks; prohibited persisted HTML, arbitrary nesting, executable markup, and unapproved URL schemes.
- Fixed the reusable-image boundary at explicit URL references only. No Blob, base64 content, local asset table, clipboard ingestion, automatic fetch, file upload, hosting provider, or reuse of M15 screenshot Context is approved.
- Defined deterministic plain projection as the universal fallback and the only Rich Snippet input to Retrieval Engine and Prompt Builder. Fixed paragraph separation, readable emphasis, link rendering, image-reference rendering, and the rule that no block disappears.
- Extended destination-aware expansion through M13 adapters while preserving all semicolon-trigger, Space activation, caret, notification, normal-typing, long-lived port, epoch/revision, invalidation, global mutation barrier, and fail-closed guarantees. Constrained generic rich insertion to target-owned safe DOM nodes with no HTML parser or automatic image creation.
- Approved future Dexie version 4 with unchanged indexes and no new table. The v3-to-v4 migration wraps every string exactly as plain content while preserving identity, metadata, tags, trigger, and timestamps. Version 3 remains implemented; version 4 is not implemented by this task.
- Kept Backup Formats v1 and v2 frozen and importable and approved strict Backup Format v3 with dedicated exact DTOs, explicit mappings, rich validation, deterministic ordering, and existing atomic restore guarantees. Backup v3 is not implemented by this task.
- Kept one Snippet Library, default-to-plain authoring, explicit readable-content-preserving plain-to-rich conversion, structured rich editing, and keyboard-accessible block ordering. Deferred rich-to-plain conversion and any third-party rich-editor dependency.
- Excluded variables, merge fields, scripting, arbitrary HTML/CSS, local binary assets, uploads, automatic remote images, AI-generated fields, page scraping, analytics, alternate trigger syntax, provider changes, OpenAI, collaboration, sync, and new permissions.
- Added Decision 36 and synchronized project state, architecture, product requirements, database planning, roadmap, backlog, UI workflow, future testing acceptance, changelog, and README. Reviewed `ENGINEERING_PRINCIPLES.md` and `CODING_AGENT_RULES.md`; no changes were required.
- M14-A is documentation-only. It changes no source, tests, configuration, dependency, schema implementation, backup implementation, manifest, or permission and performs no commit or push. M14 architecture is defined, implementation remains unstarted, and the next action is M14-B — Structured Snippet Content and Backup Foundation.

### M13-C — Milestone 13 Closeout and Project Handoff Update

- Closed Milestone 13 after Principal Engineer approval, complete automated validation, product-owner real Chrome validation, and the approved pushed implementation checkpoint `b76fcb4` (`feat: add snippet trigger expansion`).
- Recorded delivery of trigger-enabled Snippets; canonical unique trigger persistence; Dexie version 3; Backup Format v2 with version 1 compatibility; the transient runtime catalog and long-lived typed frame synchronization; and safe exact plain-text expansion with predictable caret behavior in supported editors.
- Recorded M13-B.1's overlapping-mutation publication barrier and M13-B.2's Intercom isolated-world/realm correction plus intentional `http://*/*` and `https://*/*` content-script scope under Decision 35.
- Recorded product-owner Chrome validation of real Intercom single-line and multiline expansion, exact surrounding-content and caret behavior, live edit/delete catalog updates, normal typing for unknown/deleted triggers, and expansion on another normal website. This evidence does not claim every website or editor framework was tested.
- Marked M14 — Rich Snippet Templates current but not started. The exact next Principal Engineer action is to create M14-A — Rich Snippet Templates Architecture and Product Boundary; this documentation-only closeout defines or implements no M14 behavior.
- Documentation Impact Review updated project continuity, roadmap, backlog, testing/manual evidence, implemented schema/status references, workflow wording, and README status. No application, test, configuration, dependency, schema, manifest, or generated-output file changed, and no commit or push was performed.

### M13-B.2 — All-Sites Scope and Isolated-World Expansion Correction

- Preserved the existing uncommitted M13-B implementation and M13-B.1 overlapping-mutation barrier while correcting the real-browser expansion path. Intercom diagnostics confirmed the approved trusted, cancelable Space `beforeinput`, isolating the failure to extension integration rather than the host editor.
- Replaced the content-script `event instanceof InputEvent` gate with a structurally validated project-owned event-like boundary. Trusted, cancelable, Space, non-composition, and enabled-catalog enforcement remains in the controller; wrong, pasted, programmatic, untrusted, noncancelable, or composing input continues normally without prevention.
- Removed current-global constructor identity from supported editor, element, text-node, and internally created Range/candidate handling. Realm-safe detection uses node type, local name, owner document, capabilities, and internal candidate identity while preserving the exact textarea/input/contenteditable capability boundary and safe plain-text insertion.
- Expanded the content-script match set to exactly `http://*/*` and `https://*/*` with `allFrames: true`. Chrome-protected, extension, file, and non-HTTP(S) pages remain unsupported; `<all_urls>`, fallback-origin injection, `match_about_blank`, cross-frame traversal, new permissions, persistent catalogs, logging, analytics, clipboard access, and provider transmission remain excluded.
- Added focused structural-event, iframe-realm editor, nested framework-style contenteditable, exact range/caret/input, HTML-safety, and generated-manifest regression coverage. M13-B.1 catalog mutation tests remain unchanged and passing.
- Decision 35 supersedes only Decision 34's restricted-origin clause and records broad normal HTTP/HTTPS access plus the isolated-world-safe integration boundary. M13-B.2 remains uncommitted, M13 is incomplete, and Principal Engineer source review and real Chrome validation are pending. No commit or push was performed.

### M13-A.1.1 — Snippet Trigger Architecture Review Corrections

- Corrected the editor capability boundary: `textarea` and `contenteditable` preserve complete single-line and multiline Snippet content, with contenteditable using safe text nodes and `<br>` insertion. Supported absent/text/search inputs expand only content containing no `\r` or `\n`; multiline matches decline before Space prevention without host-value mutation, flattening, truncation, normalization, or partial insertion, so normal Space behavior continues unchanged.
- Replaced the transient-cache lifecycle with one long-lived typed `chrome.runtime.Port` per matched frame. A frame cache is enabled only while the port is connected and a complete validated current-epoch snapshot is installed; invalidation and snapshot messages are ordered, disconnect clears and disables the cache, reconnect requires a complete snapshot, worker restart replaces the epoch, and stale snapshots are rejected.
- Required pre-persistence invalidation of every connected frame for Snippet create, edit, delete, import, and restore; immediate cache clearing; one complete rebuilt snapshot after success; unchanged snapshot republication after persistence failure; and affected-frame disablement after publication failure until reconnect or successful refresh. No durable queue, browser-storage catalog, polling loop, or per-keystroke service-worker lookup is introduced.
- Expanded automated coverage for the input capability boundary, multiline preservation, decline-without-mutation behavior, port connection and initial snapshot, ordered invalidation and refresh, disconnect clearing, epoch replacement, stale-snapshot rejection, normal typing while disconnected, and prevention of pre-mutation snapshot use after disconnect or invalidation. Added the single-line input limitation to risk-based manual validation.
- Marked M13-A.1 complete and Principal Engineer approved. M13-B — Snippet Trigger Expansion Implementation is active but has not started; no M13 source implementation exists yet, and M13-B is the exact next engineering action. The committed repository base before these uncommitted M13-A.1 documents remains `ea3e90d`.

### M13-A.1 — Snippet Trigger Expansion Roadmap and Architecture Definition

- Recorded the product-priority order as M13 Snippet Trigger Expansion v1, M14 Rich Snippet Templates, M15 Multimodal Screenshot Context, M16 OpenAI Provider Expansion, followed by later workflow polish and additional integrations. The original M13-A OpenAI readiness review did not start and is superseded by M13-A.1.
- Defined one optional `trigger: string | null` per existing plain-text Snippet. Non-null values are canonical lowercase, unique, 2–32 ASCII characters including the leading semicolon, and match `^;[a-z0-9]+(?:-[a-z0-9]+)*$`; whitespace is rejected rather than trimmed.
- Defined low-accident Space activation through trusted cancelable `beforeinput`: expand only a complete trigger immediately before a collapsed caret with editor-start or whitespace left boundary, replace exactly that range with preserved plain-text Snippet content plus one space, preserve surroundings and line breaks, emit expected host input behavior, place the caret after the inserted space, and prevent recursion.
- Defined generic focused adapters for `textarea`, absent/text/search inputs, and `contenteditable`, with safe fallback for selected text, composition, misses, unsupported editors, unsafe ranges, and runtime failures. Intercom is a required real-world validation target but does not enter domain or application logic.
- Approved content-script matching only for `https://example.com/*` and `https://app.intercom.com/*`, frame-local operation in matching frames, and no `<all_urls>`, arbitrary-site injection, clipboard/storage permission, password capture, editor-content logging, provider transmission, or generalized automation framework.
- Defined a service-worker-owned transient trigger catalog and typed epoch/revision snapshot/invalidation protocol. Dexie remains the sole persistent source of truth; content scripts never access it, no browser storage duplicates it, and create/edit/delete/import/restore invalidates before persistence and publishes a rebuilt complete snapshot afterward. Failures disable expansion while preserving normal typing.
- Approved forward-only Dexie schema version 3 with only `snippetEntries: 'id, createdAt, &trigger'` changed. Triggerless records omit the indexed property and map to domain `null`; existing Knowledge, Snippets, and Settings migrate without data loss.
- Froze Backup Format v1 unchanged and importable, mapping v1 Snippets to null triggers. Defined strict Backup Format v2 for new exports with exact required `trigger: string | null` on every Snippet and preserved M12 identifier, limits, ordering, mappings, security, preview, acknowledgement, atomic transaction, rollback, and data-integrity guarantees.
- Defined minimal Snippet Library UI changes: optional Trigger field, clear format guidance, inline invalid and duplicate feedback, configured-trigger list display, and compatibility with existing triggerless Snippets. Rich editing remains excluded.
- Defined deterministic automated coverage and risk-based manual validation for trigger rules, uniqueness, migration, backup v1/v2, catalog refresh/failure safety, exact textarea/input/contenteditable replacement, caret and surrounding content, Intercom, CRUD refresh, backup round trip, and unchanged core extension and AI/provider workflows.
- Completed the Documentation Impact Review. `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PRODUCT_REQUIREMENTS.md`, `DATABASE_SCHEMA.md`, `UI_WORKFLOW.md`, `ROADMAP.md`, `TESTING_STRATEGY.md`, `CHANGELOG.md`, `BACKLOG.md`, and `README.md` require synchronization. `PRODUCT_VISION.md`, `ENGINEERING_PRINCIPLES.md`, and `CODING_AGENT_RULES.md` were reviewed and require no change.
- This task changes documentation only. It introduces no source, test, dependency, configuration, implemented schema, or implemented manifest change and performs no commit or push. After the M13-A.1.1 corrections, M13-A.1 is complete and Principal Engineer approved; M13-B — Snippet Trigger Expansion Implementation is active but unstarted, and no M13 source implementation exists yet.

### M12-D.1 — Backup Format v1 DTO Isolation Correction and Milestone 12 Closeout

- Completed the focused correction after M12-D source review rejected direct reuse of live `KnowledgeEntry`, `SnippetEntry`, and `Settings` types at the public versioned backup boundary. Dedicated exact `BackupKnowledgeRecordV1`, `BackupSnippetRecordV1`, and `BackupSettingsV1` DTOs now freeze Backup Format v1 independently from live domain and persistence models.
- Replaced record-level spreads at export, validation, restore, persistence-snapshot, and persistence-write boundaries with explicit approved-field mappings while preserving deterministic ordering, tag order, IDs, timestamps, text, source, Settings semantics, and JSON format version 1. Regression coverage proves simulated future domain and persistence fields cannot enter serialized v1 backups or restored IndexedDB records.
- Principal Engineer source review approved the corrected implementation with no remaining architecture correction.
- Completed automated validation: 48 focused tests passed; the full suite passed 251 tests with 1 existing opt-in test skipped; lint, formatting, type-checking, Playwright discovery, production build and output validation, and `git diff --check` passed. Source review and automated integration tests verified atomic transaction and rollback behavior.
- Completed risk-based real Chrome validation of backup export and download; the filename, envelope, version, and exact approved keys; preview and destructive acknowledgement; successful full restore; Knowledge, Snippets, and Settings restoration; round-trip data equality including IDs, timestamps, tags, and source; invalid JSON rejection; unsupported-version rejection; failed-validation preservation of existing data; valid empty-backup replacement; subsequent normal-backup restoration; and restored default-model loading in a recreated Side Panel.
- Did not manually repeat the already-mounted Side Panel live-refresh edge case or the oversized-file exercise. Both are low-risk or readily detectable at the manual layer, their required behavior remains covered by source review and automated tests, and they are non-blocking under the permanent risk-based validation standard.
- Recorded the permanent manual-validation policy: manually validate destructive operations, data-loss or corruption risks, persistence, security-sensitive behavior, external integrations, and core browser-only workflows; permit reliable automation to carry low-risk, reversible, readily detectable edge cases; record manual coverage and omissions at closeout; and avoid exhaustive manual repetition that does not materially reduce project risk.
- Completed the Documentation Impact Review. No updates are required to `ARCHITECTURE.md`, `DECISIONS.md`, `DATABASE_SCHEMA.md`, `PRODUCT_REQUIREMENTS.md`, `UI_WORKFLOW.md`, `BACKLOG.md`, `ENGINEERING_PRINCIPLES.md`, or `CODING_AGENT_RULES.md`. This closeout restores and completes the approved architecture and creates no new architecture decision.
- Confirmed that no schema, manifest, permission, dependency, provider, architecture, or configuration change occurred.
- Recorded final implementation checkpoint `d304f90` (`feat: add import and export backup workflow`) as committed and pushed to GitHub. The working tree was clean after the checkpoint, and local `master` and `origin/master` were synchronized.
- Marked M12-D.1 and Milestone 12 complete. Advanced the current milestone to Milestone 13 — Provider Expansion / OpenAI and activated the unstarted M13-A — Provider Expansion / OpenAI Architecture Readiness Review. No M13 implementation is authorized; the exact next action is the read-only M13-A review.
- This closeout task changes only `PROJECT_STATE.md`, `CHANGELOG.md`, `ROADMAP.md`, `TESTING_STRATEGY.md`, and `README.md`; it changes no source or tests and creates no commit or push.

### M12-D Principal Review Rejection and M12-D.1 Activation

- Recorded that M12-C — Import / Export Architecture Definition is committed and synchronized at checkpoint `7ebe874` (`docs: define import and export architecture`).
- Recorded execution of M12-D — Import / Export Implementation in the working tree. At that review point, the implementation and tests remained uncommitted and no M12 implementation checkpoint existed; the later M12-D.1 closeout above supersedes that repository state.
- Recorded the Principal Engineer source-review rejection of M12-D. The public Backup Format v1 boundary directly reused live `KnowledgeEntry`, `SnippetEntry`, and `Settings` domain types and used record-level object spreads, so future domain fields could silently enter or invalidate the frozen independently versioned format.
- Activated M12-D.1 — Backup Format v1 DTO Isolation Correction as the focused corrective continuation of M12-D. The correction must introduce dedicated exact version 1 DTOs, explicitly map every approved field during export and restore, remove record-level spreads at the versioned boundary, and add regression coverage proving future domain fields are excluded.
- Blocked manual Chrome validation, M12 implementation approval, and any implementation checkpoint until M12-D.1 passes Principal Engineer source review.
- This continuity update changes documentation only. It does not modify the existing M12-D implementation, tests, architecture, database schema version 2, manifest, permissions, dependencies, or configuration, and it does not mark M12 complete or advance to M13.

### M12-C — Import / Export Architecture Definition

- Recorded completion of M12-B — Import / Export Architecture Readiness Review with verdict `ARCHITECTURE DEFINITION REQUIRED`, followed by M12-C's approved architecture definition. M12 was current and incomplete at that architecture-definition point; the later M12-D.1 closeout above records completion.
- Defined manual local backup for recovery after reinstall or browser-data loss and user-mediated transfer between Chrome profiles or computers. Excluded cloud sync, collaboration, sharing, bulk editing, automatic backup, and scheduled backup.
- Defined strict public JSON format version 1 with identifier `ai-support-workspace-backup`, UTC export timestamp, and exact Knowledge, Snippet, and always-present Settings data. Kept format versioning independent of application and Dexie schema versions and excluded physical persistence details, transient state, provider state, secrets, and future M14/M15 data.
- Defined deterministic export ordering, exact logical-value preservation, UTC filename pattern, in-memory JSON Blob/object-URL delivery, aligned 25 MiB import and serialized UTF-8 export limits, and no downloads or filesystem permission.
- Defined untrusted all-or-nothing parsing and strict validation, including exact keys and types, canonical UUIDs, ISO timestamps, dangerous-key rejection, duplicate-ID rejection, safe unknown-version behavior, no repair, and no executable or external-resource interpretation.
- Approved replace-only restore after complete validation, preserving imported IDs, timestamps, text, tag order, source, and Settings through one focused application port and one Dexie read/write transaction across all three existing stores. Any failure rolls back completely; `defaultModel: null` clears the saved default and valid empty arrays clear the Libraries.
- Added Import / Export as the fourth options-page section with one Export action; one labelled JSON input; metadata-only preview; exact destructive warning and acknowledgement; Restore, Cancel, busy and accessible status states; exact safe messages; privacy warning; and options-page-local refresh without mounted-Side-Panel live synchronization.
- Defined automated and future real Chrome validation contracts for the format, strict security boundary, size limit, deterministic serialization, preview and confirmation UX, atomic rollback, round-trip equivalence, accessibility, regressions, and unchanged generated manifest and schema.
- Deferred merge, selective or per-Library restore, drag-and-drop, pasted JSON, raw editor, history, scheduling, cloud behavior, encryption, password protection, compression, ZIP, signing, generalized data-management infrastructure, future-format migration implementation, M14 data, and M15 data.
- Added Decision 33 and synchronized project state, architecture, product requirements, UI workflow, roadmap, backlog, database schema, testing strategy, changelog, and README. Engineering principles and coding-agent rules were reviewed and required no change.
- This documentation-only definition changes no implementation, test, database schema version 2, manifest, permission, host access, dependency, or configuration.
- M12-C passed Principal Engineer review and was later committed and synchronized at checkpoint `7ebe874` (`docs: define import and export architecture`). M12-D was subsequently executed in the working tree and rejected during Principal Engineer source review; the current corrective state is recorded in the M12-D.1 section above. No M12 implementation checkpoint exists.

### M12-A.1 — Task Identification and Future Capability Roadmap Alignment

- Introduced mandatory milestone task identifiers using the parent milestone number plus sequential non-reusable letters, required the exact identifier in Codex task and completion-report headings, and added active-task tracking in `PROJECT_STATE.md`.
- Introduced sequential decimal suffixes for focused corrections or continuations of the same task without consuming the next normal letter. Recorded M12-A.1 as the corrective execution after M12-A ran only a Principal-readiness self-check, produced no repository changes, and was superseded rather than reused.
- Added coding-agent continuity gates for identifier reuse or mismatch, incorrect corrective-task representation, milestone mismatch, unexplained sequential skips, and material disagreement between documentation and Git state.
- Added a permanent final independent Principal-readiness self-check requirement and required PASS or FAIL reporting before any task completion claim.
- Kept M12 as Import / Export and M13 as Provider Expansion / OpenAI. Assigned M14 only to Multimodal Context Attachments and M15 only to Rich Snippet Templates & Trigger Expansion, while moving generic Polish work to the backlog.
- Protected M12 at a high level: export-file versioning remains independent from Dexie schema versioning; future versions may support future persisted data types; transient screenshot Context is excluded; and future Rich Snippet data is outside the initial M12 scope. Detailed Import / Export decisions begin with the unstarted M12-B architecture-readiness task.
- Preserved the approved high-level multimodal and Rich Snippet product directions while deferring detailed M14 and M15 architecture and all implementation.
- Completed a documentation-only impact review covering workflow governance, project continuity, roadmap assignment, and coding-agent process. No product implementation, application-architecture implementation, test, database, schema, manifest, permission, dependency, or configuration change was made.
- M12-A.1 passed Principal review and is complete. Its shared documentation checkpoint was committed and synchronized at `f09e776` (`docs: add task identifiers and assign future milestones`). M12-B subsequently completed its readiness review and M12-C now defines the Import / Export architecture.

### Milestone 11 — Default Ollama Model Settings Closeout

- Completed exactly one local setting, `Settings { defaultModel: string | null }`, with `null` as the application default, no implicit installed model, `qwen2.5:7b` as placeholder/example text only, trim-on-save normalization, opaque non-empty identifiers, and empty or whitespace-only clearing to `null` without contacting Ollama.
- Implemented the typed domain aggregate, minimal singleton `SettingsRepository`, focused load/save/default/normalization application service, and Dexie adapter behind project-owned contracts. React never calls Dexie, Prompt Builder never reads Settings, `OllamaProvider` remains persistence-independent, and `GenerationRequest` is unchanged.
- Advanced database `ai-support-workspace` from Dexie schema version 1 to version 2 by adding only `settings: 'id'` with physical singleton `{ id: 'global', defaultModel }`, no timestamps or secondary indexes, no automatic record, and forward-only migration behavior. Saving `null` retains the singleton record, and missing state resolves at the application boundary to `{ defaultModel: null }`.
- Preserved the version 1 Knowledge and Snippet declarations and every existing Library record without transformation. Automated migration coverage proved representative version 1 data survives the upgrade, the Settings record is not created on load, and singleton values persist across database reopen.
- Added Settings as the third section in the existing options page with one `Default Ollama model` input, explanatory help, explicit `Save settings`, loading/saving and normalized dirty-state behavior, exact success/failure messages, retained failed input and retry, accessible status feedback, natural keyboard flow, and narrow-width-safe navigation and form layout.
- Added one-time Side Panel Settings bootstrap before editable Workspace model state. Saved non-null values initialize new sessions; missing, null, or failed load initializes blank; failure shows `Couldn't load the saved model. Enter a model manually.` while Context editing, Guidance editing, selected-text capture, Output editing, Copy, manual model entry, and Generate after valid model entry remain usable; raw persistence errors stay hidden; session edits stay transient; new sessions reload the saved value; and mounted panels do not live-sync.
- Preserved M9 Context, Guidance, Output, Generate, editing, and Copy behavior. Preserved the M10 capture-first open sequence and ready/retry/acknowledgement handshake: delayed Settings bootstrap sends no premature readiness or acknowledgement, pending delivery completes after Workspace readiness, captured text replaces Context, Guidance/model/Output remain preserved, and no automatic Generate occurs.
- Preserved provider identity `ollama`, fixed `http://localhost:11434`, Prompt Builder, `OllamaProvider`, the manifest, ordinary permissions, host permissions, content-script matches, keyboard command, popup actions, dependencies, and configuration. Dexie/IndexedDB requires no Chrome `storage` permission.
- Completed automated validation: 69 focused tests passed in 9 files; the normal suite passed 200 tests in 25 files with 1 opt-in live Ollama test skipped in 1 file; lint passed with zero warnings; formatting and type-checking passed; Playwright discovered 1 Chromium test in 1 file; the production Chrome MV3 build and generated-output/manifest validation passed; and `git diff --check` passed with only expected Windows LF-to-CRLF notices. The skipped automated live-provider test was not run.
- Completed real Chrome validation of the visible Settings section, blank first-run state, disabled initial Save, migration preservation, `qwen2.5:7b` save and options reload persistence, new Side Panel initialization, transient `temporary-test-model` override and reopen restoration, real local Ollama generation, clear-to-null across reload and new session, `Ctrl+Shift+Y` M10 capture with model preservation and no automatic Generate, popup navigation, and unchanged permissions. Persistence load/save failure UI was validated through automation; manual database fault injection was not performed.
- Kept provider selection; configurable `providerBaseUrl`; LAN or remote Ollama; OpenAI; API keys and credentials; model discovery, pulling, health checks, and automatic installation; generation tuning, temperature, and token limits; writing preferences, persistent custom instructions, and editable Prompt Builder grounding instructions; theme; `shortcutsEnabled` and in-app remapping; Snippet triggers and Rich Snippets; multimodal Context and screenshots; Workspace Context, Guidance, and Output persistence; history; reset; import/export and backup/restore; a generic Settings renderer; multiple Settings categories; and live cross-page synchronization out of M11. M12 retains its documented import/export ownership.
- Completed the Documentation Impact Review. Project state, architecture status, Decision 31 implementation status, UI workflow, roadmap, backlog, database schema, testing strategy, changelog, and README required synchronization. Product requirements, engineering principles, and coding-agent rules were reviewed and required no change.
- Marked M11 complete and advanced the current roadmap milestone to Milestone 12 — Import / Export without defining or expanding M12 architecture or implementation. The M11 implementation and closeout were later committed and synchronized at checkpoint `d40e031` (`feat: add default Ollama model settings`).

### Milestone 11 — Settings Architecture Definition

- Replaced the broad M11 provider-selection/model-choice/behavior-tuning wording with one deterministic capability: a local options-page Settings form that saves `defaultModel: string | null` and initializes each new Workspace Side Panel session's transient model field from that value.
- Defined `null` as the application default, retained `qwen2.5:7b` only as possible example text, approved trim-on-save and whitespace-to-null clearing, and kept model identifiers opaque without discovery, availability checks, model pulls, health checks, retries, timeouts, or Ollama calls during save.
- Added Settings as the third section in the existing options-page shell with one labelled input, concise help, an explicit normalized dirty-state Save action, accessible loading and status feedback, no autosave or unsaved-change prompt, and no new popup action, page, router, generic Settings renderer, or preference framework.
- Defined one typed application-owned Settings aggregate, focused load/save application boundaries, a minimal singleton `SettingsRepository`, and a Dexie adapter whose physical record is `{ id: 'global', defaultModel }`. React, Prompt Builder, and `OllamaProvider` do not access Settings persistence.
- Approved the future implementation's forward-only Dexie schema version 1 to version 2 migration, adding only `settings: 'id'` with no timestamps or secondary indexes, no automatic record, no existing Library transformation, and mandatory preservation of all Knowledge and Snippet records.
- Defined one-time Side Panel startup loading before editable model state, blank fallback for missing/null/failed Settings load, exact non-blocking failure feedback, transient session overrides, reload-on-new-session behavior, no live synchronization for mounted panels, and unchanged `GenerationRequest`, M9 state, and M10 capture semantics.
- Deferred provider selection to M13 and deferred endpoint configuration to provider expansion or a dedicated security/permissions review. Excluded behavior tuning, persistent writing preferences, editable grounding instructions, theme, shortcut settings, credentials, Workspace persistence, history, reset, import/export, multimodal Context, and Rich Snippets from M11.
- Preserved the existing fixed Ollama endpoint, provider identity, Chrome-native shortcut management, popup behavior, permissions, host access, dependencies, configuration, and physical version 1 database during this documentation-only task.
- Defined deterministic automated and real Chrome validation contracts for the future implementation. Normal tests require no live Ollama.
- Completed the Documentation Impact Review. Project state, architecture, decisions, product requirements, UI workflow, roadmap, backlog, database schema planning, testing strategy, changelog, and README required synchronization. Engineering principles and coding-agent rules were reviewed and required no change. No implementation, test, dependency, configuration, permission, or physical database change was made, and M11 remains current rather than complete.

### Repository Continuity Correction — M10 Implementation Checkpoint

- Corrected active repository continuity to record `6093361` (`feat: add selected-text capture shortcut`) as the completed Milestone 10 implementation checkpoint, committed and pushed with local `master` synchronized to `origin/master`; verified preflight found a clean working tree at that checkpoint.
- Confirmed Milestone 10 — Keyboard Shortcut is complete and Milestone 11 — Settings is current. This correction does not define or implement M11.
- Completed a documentation-only Documentation Impact Review for repository-state synchronization. `PROJECT_STATE.md`, the current architecture status, the changelog, and README required correction; the roadmap and coding-agent rules were reviewed and required no changes. No source, test, dependency, configuration, architecture, product behavior, or database-schema change was made.

### Milestone 10 — Keyboard Shortcut Closeout

- Completed exactly one browser-scoped command, `capture-selection-to-workspace`, with description `Capture selected text in AI Support Workspace`, suggested default `Ctrl+Shift+Space`, suggested macOS key `Command+Shift+Space`, no global scope, and Chrome-native customization through `chrome://extensions/shortcuts`. The user's local `Ctrl+Shift+Y` remap resolved a Text Blaze conflict without changing the manifest default.
- Finalized the generated Manifest V3 contract with exactly `sidePanel`, `activeTab`, and `scripting` ordinary permissions; exactly `http://localhost/*` host access; the unchanged `https://example.com/*` persistent content-script match; and no `tabs`, storage, `clipboardRead`, `clipboardWrite`, `<all_urls>`, permanent support-site host, or `127.0.0.1` access.
- Implemented Chrome-compatible command sequencing: invoke main-frame selection capture first, immediately invoke `chrome.sidePanel.open({ windowId })` without awaiting capture, settle both outcomes independently, then deliver the typed result. Real Chrome confirmed this avoids the silent panel-open failure caused when awaiting `executeScript` exhausted command user activation.
- Implemented active-tab main-frame explicit selection with focused textarea or supported text-input range precedence and document/contenteditable fallback. Exact Unicode, line breaks, and surrounding whitespace are preserved when the selection contains non-whitespace; whitespace-only selection is empty. M10 performs no page scraping, cross-origin iframe capture, screenshot capture, or multimodal behavior.
- Implemented focused transient delivery with typed success/empty/failure results, positive delivery IDs, Side Panel readiness, acknowledgement only after application, retry across the newly opened panel mount race, and removal only after a matching acknowledgement. No Dexie, `chrome.storage`, `localStorage`, generic event bus, or durable message queue was introduced; database schema remains version 1.
- Completed exact Merchant Context replacement without append or merge while preserving Guidance, model, generated or edited Output, and any active generation request. Captured Context affects only future manual Generate actions; M10 never automatically generates.
- Completed safe feedback: empty selection preserves Context and Output and shows `Select text on the page, then use the shortcut again.` Restricted or failed capture preserves them and shows `Couldn't capture selected text from this page. Copy and paste it into Merchant Context.` Raw Chrome errors remain hidden, with no scraping, notification, tab, window, or broader-permission fallback.
- Completed real Chrome validation of command registration and remapping; normal document, textarea, and contenteditable capture; first and repeated invocation; exact Context replacement; state preservation; empty and restricted-page behavior; Generate using captured Context and existing Guidance; Copy with line breaks; popup Open Workspace and Open Libraries; and Knowledge and Snippet Library regressions.
- Confirmed usable Guidance keyboard focus and a collapsed end caret when a closed Side Panel opens. On repeated capture with an already-visible panel, internal DOM focus/caret behavior passes but Chrome may retain webpage keyboard routing and require a click in Guidance. This non-blocking host/WebContents limitation is not an implementation failure; the supported-API future backlog item remains unassigned.
- Recorded final automated validation: focused M10/Workspace tests passed; the full Vitest suite passed 171 tests with one opt-in live Ollama test skipped; lint, formatting, type-checking, Playwright discovery of 1 Chromium infrastructure test, production WXT Chrome MV3 build, generated-output and manifest validation, and `git diff --check` passed. Only expected Windows LF-to-CRLF notices occurred; no live Ollama test was fabricated or required for M10.
- Classified the observed cross-world extension-resource mismatch and generated preload reported unused shortly after load as non-blocking WXT/Vite/Chrome module-preload output. Application source creates no such links explicitly, no functional failure or duplicate module execution was identified, and no WXT/Vite configuration change was authorized.
- Completed the Documentation Impact Review. Project state, architecture status, decision-record delivery and closeout wording, UI workflow, roadmap, backlog status, testing strategy, database status, changelog, and README required synchronization. Product requirements, engineering principles, and coding-agent rules were reviewed and required no changes.
- Preserved deferred scope: no automatic Generate, Generate or Copy shortcut, OS-global shortcut, Settings, shortcut persistence or editor, Snippet triggers or rich expansion, screenshots, multimodal Context, OpenAI, permanent support-site permission, cross-origin iframe capture, page scraping, Workspace persistence, or database migration. Retrieval Engine, Prompt Builder, and `OllamaProvider` remain unchanged.
- Marked M10 complete and advanced the current roadmap milestone to M11 — Settings without defining or implementing M11. The latest existing checkpoint remains `8cfc38b` (`docs: record repeated side panel focus limitation`); the completed M10 implementation, tests, and closeout documentation await Principal approval and an authorized Git checkpoint. No commit or push was performed by this closeout task.

### Milestone 10 — Repeated Side Panel Focus Platform Limitation Amendment

- Distinguished first invocation from repeated invocation: opening a closed Side Panel passed capture, exact Context replacement, state preservation, immediately usable Guidance focus, and collapsed end-caret validation.
- Recorded that repeated invocation while the Side Panel is already visible passes panel visibility, capture, delivery, exact Context replacement, preserved state, and the internal Guidance DOM focus/caret request, while Chrome may keep browser-level keyboard routing on the webpage and require the user to click Guidance.
- Retained `guidanceElement.focus()` followed by `setSelectionRange(end, end)` on every successful capture. Added no `window.focus()` assumption, retry, delay, polling, close/reopen, toggle, permission, persistence, notification, tab, or window workaround because Chrome exposes no supported API for activating an already-visible Side Panel.
- Clarified that JSDOM and controlled tests prove document-level focus, caret, and state behavior but cannot prove Chrome WebContents activation or physical keyboard routing; real Chrome manual validation owns the browser-level observation.
- Classified the observed cross-world preload mismatch and unused generated preloads as non-blocking WXT/Vite/Chrome generated-output warnings with no observed functional impact and no explicit application-source request. No WXT configuration change is authorized; investigate separately only if functional or performance evidence emerges.
- Added an approved unassigned backlog item to activate or focus an already-visible Chrome Side Panel after shortcut capture if Chrome exposes a supported API. It has no milestone and does not alter M10.
- At the amendment checkpoint, recorded the platform limitation as non-blocking once the later M10 functional checks passed; the closeout section above now records M10 completion and the roadmap transition to M11.
- Changed documentation only. No source, test, dependency, configuration, permission, persistence, or schema file was changed, and no checkpoint was created or pushed.

### Milestone 10 — Guidance Focus UX Amendment

- Amended successful shortcut capture so exact Merchant Context replacement is followed by a Guidance DOM focus request rather than a Merchant Context focus request, matching the next natural step of entering optional case-specific instructions. Browser-level behavior for an already-visible panel is qualified by the later platform-limitation amendment above.
- Required a collapsed caret at the end of the preserved Guidance value; empty Guidance is immediately ready for typing when a closed Side Panel opens, while existing Guidance is not selected, replaced, appended to, or otherwise modified.
- Preserved exact Context replacement, Guidance/model/Output/active-generation state, manual Generate behavior, runtime sequencing, transient ready/acknowledgement delivery, permissions, persistence, database schema version 1, M11 separation, Snippet-trigger separation, and multimodal separation.
- Kept empty, restricted-page, and failed-capture feedback unchanged and required those paths not to force Guidance focus.
- Amended future automated validation to cover the internal Guidance DOM focus request and collapsed end-caret placement, Guidance preservation without selection, absence of requested final Merchant Context focus, failure-path focus behavior, and absence of automatic Generate; real Chrome validation separately owns browser-level activation and keyboard-routing observations.
- Made no implementation, test, dependency, WXT configuration, permission, persistence, or schema change and did not mark M10 complete.

### Milestone 10 — Runtime Sequencing Architecture Amendment

- Recorded real Chrome evidence that command registration, Chrome-native remapping to `Ctrl+Shift+Y`, command dispatch, `activeTab`, main-frame `scripting`, and direct keyboard-command Side Panel opening all work independently.
- Diagnosed the production runtime defect: awaiting `chrome.scripting.executeScript(...)` before `chrome.sidePanel.open(...)` exhausts Chrome's keyboard-command user-action eligibility, while safe open-failure handling swallows the rejection and produces no visible M10 behavior.
- Replaced the capture-completion-before-open requirement with capture invocation first, immediate Side Panel open invocation second without an intervening await, and independent settlement handling only after both operations have started.
- Recorded repeated real Chrome diagnostic success for the amended invocation ordering, including fulfilled capture/open outcomes and exact leading-whitespace preservation. Delivery into Merchant Context was intentionally outside that diagnostic; the closeout section above records the later successful end-to-end validation.
- Preserved the existing typed success/empty/failure contract, transient ready/acknowledgement delivery, exact Context replacement, mounted state preservation, safe failure behavior, permissions, host access, content-script matches, database schema version 1, M11 separation, Snippet-trigger separation, and multimodal separation.
- Required structural automated regression coverage for capture-first invocation, immediate synchronous open invocation, absence of an awaited boundary between them, independent outcomes, and delivery only after the capture result exists. Real Chrome validation remains mandatory because API fakes cannot prove transient user activation.
- Made no implementation, test, dependency, WXT configuration, permission, persistence, or schema change and did not mark M10 complete.

### Milestone 10 — Keyboard Shortcut Architecture Definition

- Corrected repository continuity to record Milestone 9 implementation checkpoint `7b88b94` (`feat: implement output workspace`) as committed, pushed to `origin/master`, and synchronized before M10 architecture definition began.
- Defined exactly one browser-scoped standard Chrome command, `capture-selection-to-workspace`, with description `Capture selected text in AI Support Workspace`, suggested default `Ctrl+Shift+Space`, suggested macOS key `Command+Shift+Space`, Chrome-native remapping, no `_execute_action`, and no global scope.
- Assigned focused command recognition, active-tab and window validation, on-demand selection extraction, global Side Panel opening, transient delivery, acknowledgement, and safe failure coordination to the existing service worker without moving Retrieval Engine, Prompt Builder, `OutputWorkflow`, Ollama generation, persistence, or Workspace state into the background.
- Approved least-privilege main-frame selection capture through exactly `activeTab` and `scripting`, retaining `sidePanel`, exactly `http://localhost/*` host access, and the unchanged `https://example.com/*` persistent content-script match without `tabs`, storage, clipboard, `<all_urls>`, or permanent support-site permission.
- Defined textarea or text-capable input range precedence over main-frame document selection; exact preservation of non-whitespace Unicode, line breaks, and surrounding whitespace; whitespace-only empty behavior; capture-invocation-before-panel-open-invocation ordering as superseded and clarified by the runtime sequencing amendment; and exclusion of surrounding-page scraping, cross-frame capture, and screenshots.
- Defined open/activate rather than toggle Side Panel behavior and a focused typed ready-and-acknowledgement runtime contract that reliably delivers success or safe failure to mounted and newly opened panels without durable storage or a generalized message bus.
- Defined exact Merchant Context replacement, preservation of Guidance, model, generated or edited Output, and active generation, manual-only future Generate behavior, and safe empty-selection and restricted-page feedback. Its original Context-focus requirement is superseded by the Guidance Focus UX Amendment above.
- Defined generated-manifest, background command, selection extraction, transient delivery, Side Panel state/focus, regression, and real Chrome validation requirements. Normal shortcut tests require no live Ollama.
- Preserved database `ai-support-workspace` schema version 1 and excluded Settings, shortcut persistence or editor UI, Generate and Copy shortcuts, automatic generation, Snippet triggers or expansion, multimodal capture, dependencies, implementation code, tests, and WXT/manifest configuration changes from this documentation-only task.
- Kept Milestone 10 current and made its architecture implementation-ready without marking M10 complete, creating a Git checkpoint, or pushing this documentation change.

### Future Product Directions — Multimodal Context and Rich Snippet Expansion

- Approved Multimodal Context Attachments as a future product direction: Merchant Context may eventually combine text with one or more pasted screenshots or visual assets for capable providers and models. The capability is now assigned to M14.
- Required future direct clipboard image paste, visible attachment state, appropriate preview, and removal before generation without requiring every screenshot to be saved to disk or uploaded to a cloud service. Count, size, format, and reordering rules remain unresolved.
- Established transient, local-first Context images as the preferred default and required a provider-independent capability boundary that never silently discards unsupported images.
- Approved Rich Snippet Templates & Trigger Expansion as a separate future direction, including a future Shortcut or Trigger field with semicolon syntax such as `;hello` and `;shopify-limit`. The capability is now assigned to M15.
- Explicitly separated Snippet triggers from M10 Keyboard Shortcut: application key combinations invoke extension behavior, while typed semicolon triggers expand saved content inside supported editors.
- Approved ordered structured Snippet content capable of preserving text → image/reference → following text, with future paragraphs, links, emphasis, images, and other appropriate structured blocks. Arbitrary executable HTML is not approved.
- Required target-aware expansion through a focused editor capability boundary, rich insertion where supported, and deterministic plain-text fallback that preserves image/reference position and does not silently omit local or remote assets.
- Required future expansion safety for trigger replacement range, surrounding-content preservation, caret placement, and unsupported-editor behavior, plus backward compatibility for existing plain-text Snippets.
- Distinguished transient generation-owned Context images from reusable Library-owned Snippet images; shared low-level utilities may be considered later without collapsing domain ownership.
- Deferred all implementation architecture, including image and rich-content representation, provider capability interfaces, unsupported-provider UX, limits, persistence, serialization, trigger validation and uniqueness, database migration, reusable asset ownership, expansion engine, editor adapters, insertion mechanics, compatibility matrix, caret behavior, and local-asset fallback.
- This earlier direction added no milestone number and did not reopen M9 or redefine M10 or M11; Decision 32 now assigns the capabilities to M14 and M15. No implementation, test, dependency, permission, or database-schema change was made.

### Milestone 9 — Output Workspace

- Completed the first end-to-end manual support-drafting workflow in one extension-owned global Chrome Side Panel generated as `sidepanel.html` through WXT's native Side Panel entry point. Popup Open Workspace opens the current-window global panel; Open Libraries retains the options-page browser-tab behavior.
- Added the focused application-layer `OutputWorkflow` over `RetrievalEngine`, `PromptBuilder`, and `GenerationProvider`, with the Side Panel entry point composing the existing Knowledge and Snippet repositories and `OllamaProvider`. React remains presentation-only and provider replaceability remains intact.
- Implemented automatic retrieval on every Generate action using non-whitespace Merchant Context first and Guidance second, joined by exactly `\n\n` when both are present. Existing M6 ranking and M7 selection, precedence, static Instructions, and `PromptAssembly` contracts remain unchanged and internal.
- Added optional manual multiline transient Merchant Context and Guidance plus a blank-initial caller-entered transient model field. Guidance remains case-specific steering such as `follow up` and does not replace Prompt Builder's permanent Instructions; no input or model value is persisted or discovered.
- Implemented guarded foreground Side Panel generation, visible loading and safe error states, exact initial preservation of provider output, editable plain-text drafts, and repeated Generate through a new complete workflow. Successful repetition replaces output; failure preserves the existing draft. M9 adds no Regenerate, Cancel, Clear, Reset, Save as Snippet, or history.
- Implemented Copy through `navigator.clipboard.writeText` from direct user interaction, copying the current edited value with line breaks preserved and providing safe success or failure feedback without clipboard permission.
- Preserved foreground extension-page execution with no service-worker orchestration, background generation messaging, content-script integration, Intercom scraping, active-page reading, or reply insertion.
- Final generated MV3 output contains exactly `sidePanel` in ordinary permissions, exactly `http://localhost/*` in host permissions, and `side_panel.default_path: sidepanel.html`. It adds no `tabs`, `activeTab`, storage, clipboard, scripting, `127.0.0.1`, or broad URL permission and leaves content-script matches unchanged.
- Preserved fixed local provider endpoint `http://localhost:11434/api/chat`. Browser use requires external `OLLAMA_ORIGINS` allowance for the installed extension origin; the extension neither changes Ollama configuration nor adds a health check, model pull, endpoint setting, retry, or provider timeout.
- Corrected a browser-runtime transport defect found during manual validation: native `globalThis.fetch` had been stored unbound and invocation through the provider instance caused `TypeError: Illegal invocation`, which was caught as `ProviderUnavailableError`. The default transport now binds fetch to `globalThis`, request construction occurs outside the transport catch, and only genuine fetch failures map to provider unavailability.
- Added deterministic transport-binding and error-taxonomy regressions. The final full suite passed 136 tests with 1 opt-in live Ollama test skipped normally; the focused provider, workflow, and UI regression run passed 60 of 60 tests. Installation, linting, formatting, type-checking, Playwright discovery, production build, generated-output validation, and `git diff --check` passed.
- Completed Principal Engineer review and real Chrome manual validation of extension reload, popup and Side Panel opening, companion-panel and narrow-width behavior, all inputs, Generate eligibility, real `qwen2.5:7b` generation, loading and success feedback, editable output, edited-output Copy and line breaks, repeated generation, Guidance influence, and Knowledge and Snippet Library regressions without blocking runtime or network errors after the transport fix.
- Confirmed the safe provider-unavailable connection message and safe unavailable-model message in Chrome, with the previous output preserved after both failures. Direct Chrome-extension-origin connectivity to local Ollama and a successful `/api/chat` response were verified during diagnosis; no raw provider error, customer content, prompt assembly, or generated text was exposed by the Workspace error UI.
- Recorded one manual content-quality observation: a `qwen2.5:7b` response said “Delivery should be soon.” despite Guidance not to promise a delivery date. This is future prompt/model-quality work, not an M9 workflow failure or architecture change.
- Preserved transient-only Workspace state and database `ai-support-workspace` schema version 1 with no Context, Guidance, model, output, history, Settings, table, field, index, or migration change.
- Completed the mandatory Documentation Impact Review and advanced the current roadmap milestone to Milestone 10 — Keyboard Shortcut. Project state, architecture status, UI workflow, roadmap, testing strategy, changelog, database status, backlog, and README required synchronization; decisions, product requirements, engineering principles, and coding-agent rules required no changes.
- Recorded Side Panel architecture amendment checkpoint `e587398` (`docs: move output workspace to side panel`) as committed and pushed before the final implementation migration. The completed implementation and closeout documentation were later committed and synchronized at `7b88b94` (`feat: implement output workspace`).

### Milestone 9 — Side Panel Architecture Amendment

- Recorded the Principal Engineer's manual product-review decision to supersede the original standalone extension-tab Workspace before the existing M9 implementation was committed.
- Approved one extension-owned global Chrome Side Panel as the M9 Workspace companion beside the active support website, with no per-site enablement, tab-specific path, dynamic panel content, or content-script integration.
- Approved WXT's native Side Panel entry point, generated `sidepanel.html`, and generated `side_panel.default_path`; a standalone `workspace.html` page is no longer the primary or required M9 surface.
- Preserved the popup with Open Workspace and Open Libraries. Open Workspace opens the global Side Panel for the current browser window from the direct user interaction; Open Libraries continues opening the existing options page; no background message is added solely to open Workspace.
- Added exactly `sidePanel` to the approved ordinary Chrome permissions while retaining exactly `http://localhost/*` in host permissions. Excluded `tabs`, `activeTab`, storage, clipboard, scripting, `127.0.0.1`, and broad host access.
- Preserved foreground extension-UI generation, the fixed local Ollama endpoint, and environment-specific external `OLLAMA_ORIGINS` configuration for `chrome-extension://<extension-id>` without moving generation or panel opening into background messaging.
- Preserved transient Workspace state for the mounted Side Panel instance without localStorage, Chrome storage, Dexie, Settings, history, drafts, or schema changes.
- Replaced the centered full-page layout contract with a fluid, narrow-width-safe, vertically scrollable Side Panel layout that does not force Chrome's user-controlled panel width and avoids normal horizontal scrolling.
- Kept Knowledge and Snippet CRUD on the existing options page and retained all approved `OutputWorkflow`, Retrieval Engine, Prompt Builder, GenerationProvider, OllamaProvider, model, Generate, output, Copy, error, privacy, and deferred-feature behavior.
- Amended automated validation to cover the Side Panel entry point, `side_panel.default_path`, exact permissions, direct popup opening, absence of background messaging, reused Workspace behavior, regressions, and production build.
- Replaced standalone Workspace-tab manual validation with global Chrome Side Panel validation beside the active webpage, including normal narrow-width behavior, real Ollama generation, exact permissions, and Library regressions.
- Updated architecture and project continuity through the original `d0e01d7` definition, then created Side Panel amendment checkpoint `e587398` (`docs: move output workspace to side panel`) before the later focused implementation migration.
- This amendment changed documentation only. It did not modify the existing uncommitted implementation, tests, WXT or manifest configuration, dependencies, database, or milestone status.

### Milestone 9 — Output Workspace Architecture Definition

The original standalone Workspace page and Side Panel exclusion recorded in this historical section were superseded by the subsequent M9 Side Panel Architecture Amendment above. All workflow, provider, persistence, and non-surface decisions remain in force.

- Corrected repository continuity to record Milestone 8 implementation checkpoint `2de8dcb` (`feat: implement ollama provider`) as committed, pushed to `origin/master`, and synchronized before M9 architecture definition began.
- Defined M9 as the first complete manual Context-to-generated-output workflow with Merchant Context, Guidance, a transient Ollama model field, Generate, automatic local retrieval, Prompt Builder, `GenerationProvider`, the current Ollama adapter, safe loading and errors, editable plain-text output, and Copy.
- Approved one dedicated foreground extension Workspace page, with the popup remaining a launcher for Workspace and Libraries and the options page retaining Knowledge and Snippet CRUD. No router, Side Panel, injected UI, or content-script change is introduced.
- Defined focused application-layer `OutputWorkflow` orchestration over `RetrievalEngine`, `PromptBuilder`, and `GenerationProvider`, composed with existing concrete repositories and `OllamaProvider` by the Workspace entry point without a dependency-injection framework or provider registry.
- Approved automatic retrieval on every Generate action using non-whitespace Merchant Context followed by non-whitespace Guidance, preserving each included value and joining both with exactly `\n\n`. M6 scoring, empty results, M7 precedence and selection, and provider-independent `PromptAssembly` remain unchanged.
- Excluded manual Library selection, record pinning, retrieval override, Use in Builder behavior, and PromptAssembly preview.
- Approved a blank-initial transient model field whose UI value is trimmed before generation. An example `qwen2.5:7b` placeholder is allowed but is not a default; model persistence, discovery, `/api/tags`, and automatic selection remain excluded.
- Preserved the fixed `http://localhost:11434/api/chat` provider endpoint and approved foreground Workspace execution with no background generation or `chrome.runtime` generation messaging.
- Approved exactly `http://localhost/*` as the M9 host permission while excluding `127.0.0.1`, broad host patterns, ordinary Chrome API permissions for Ollama networking, endpoint configuration, LAN, remote, and cloud access.
- Documented the external requirement for Ollama to allow the environment-specific installed `chrome-extension://<extension-id>` origin through `OLLAMA_ORIGINS`; the extension never hardcodes the ID or modifies, launches, restarts, or broadens Ollama configuration.
- Defined guarded single-request Generate behavior, visible generating state, prior-output preservation during generation and after failures, successful replacement with exact provider text, repeat generation through the normal Generate action, and no retry, dedicated Regenerate, Cancel, Clear, or history.
- Defined manual multiline transient Context and Guidance, four-state idle/generating/success/error presentation, editable plain-text textarea output, exact Copy of current edited text through direct user-activation Clipboard API use, safe error messages, minimal Ollama helper text, and accessibility requirements.
- Preserved schema version 1 and excluded Dexie, localStorage, Chrome storage, workspace drafts, output persistence, Save as Snippet, Settings, provider selection, OpenAI, shortcuts, page scraping or insertion, telemetry, analytics, cloud fallback, and prompt or output logging.
- Defined deterministic `OutputWorkflow`, Workspace UI, generated-manifest, regression, and mandatory real Chrome validation contracts, including proof of host permission and external Ollama origin configuration at the actual browser boundary.
- Kept Milestone 9 current and implementation-ready without adding implementation code, tests, dependencies, runtime files, manifest permissions, database changes, or a Git checkpoint.

### Milestone 8 — Ollama Provider

- Completed the approved project-owned `GenerationProvider` boundary and `OllamaProvider` infrastructure adapter with provider identity `ollama`, preserving Prompt Builder provider independence and allowing a future OpenAI adapter to implement the same contract without changing Prompt Builder.
- Implemented transient `GenerationRequest` input containing an existing `PromptAssembly` and caller-supplied model, plus a minimal `GenerationResult` containing generated text, provider identity, and the requested model. No model configuration is persisted, and raw Ollama responses do not escape the adapter.
- Implemented deterministic translation into exactly one system message containing only Prompt Builder Instructions and one structured JSON user message. Applicable keys are inserted as `guidance`, `merchantContext`, `knowledge`, and `snippets`; absent sections are omitted; Knowledge exposes only title/body; Snippets expose only title/content; and application metadata is excluded.
- Implemented exactly one native-fetch `POST` per `generate` invocation to fixed local endpoint `http://localhost:11434/api/chat` with `stream: false`, no retry, internal timeout, health check, automatic model pull, generation tuning option, remote endpoint, or cloud fallback.
- Implemented focused `ProviderUnavailableError`, `ModelUnavailableError`, `ProviderRequestError`, `ProviderResponseError`, and `GenerationCancelledError` handling for connection failure, HTTP 404, other non-success responses, invalid successful responses, and caller `AbortSignal` cancellation.
- Preserved local-only privacy by adding no telemetry or analytics, logging no PromptAssembly, customer, Library, generated-response, or raw provider payloads, and exposing no raw Ollama response through application contracts.
- Added no Chrome generation workflow, background-service-worker integration, `chrome.runtime` generation messaging, localhost host permission, CORS or `OLLAMA_ORIGINS` configuration, Generate UI, Output Workspace, model selector, endpoint settings, connection indicator, or Test Connection. M8 validated the provider independently of Chrome runtime placement.
- Added no Settings, provider, model, or endpoint persistence and no database, schema-version, table, field, index, migration, dependency, WXT configuration, extension runtime, or manifest change.
- Other explicit M8 non-goals remained absent: OpenAI integration, a provider registry, streaming, snippet expansion, and Side Panel.
- Added 30 focused deterministic unit tests in 1 file. The normal full Vitest suite passed with 102 tests and skipped the single opt-in live Ollama integration test when `OLLAMA_LIVE_MODEL` was absent.
- Passed `pnpm install`, `pnpm lint`, `pnpm format --check`, `pnpm typecheck`, `pnpm test`, `pnpm exec playwright test --list`, `pnpm build`, generated Manifest V3 validation, and `git diff --check`. The generated manifest retained no `permissions`, `host_permissions`, or `side_panel`.
- Completed a real local Ollama interoperability smoke test with `OLLAMA_LIVE_MODEL=qwen2.5:7b`, the real `OllamaProvider`, and the fixed localhost `/api/chat` endpoint. The request returned a non-empty `GenerationResult` in approximately 25 seconds; no model-quality claim is implied.
- Hardened the opt-in live smoke test with an individual 120-second test-only timeout because real local loading and generation may exceed Vitest's normal 5-second timeout. `OllamaProvider` still has no internal timeout, and the normal suite remains independent of Ollama.
- Completed Principal Engineer implementation review and the mandatory Documentation Impact Review. Project state, architecture status, roadmap, testing strategy, changelog, engineering principles, database status, UI workflow, and README required synchronization; `DECISIONS.md` and product requirements were reviewed and required no changes.
- Corrected repository continuity to record architecture checkpoint `b54f141` (`docs: define ollama provider architecture`) as committed, pushed to `origin/master`, and synchronized before implementation began. No M8 implementation checkpoint has been created; implementation and closeout changes remain uncommitted pending approval.
- Advanced the current roadmap milestone to Milestone 9 — Output Workspace without changing milestone numbering or scope.

### Milestone 8 — Ollama Provider Architecture Definition

- Corrected repository continuity to record Milestone 7 implementation checkpoint `a71dfed` (`feat: implement prompt builder`) as committed, pushed to `origin/master`, and synchronized between local `master` and the remote.
- Defined a narrow project-owned `GenerationProvider` contract with stable provider identity, transient `PromptAssembly` and model input, optional caller cancellation, and a minimal provider-independent generated-text result.
- Defined `OllamaProvider` as the first infrastructure adapter with identity `ollama`, native `fetch`, an injected fetch-compatible test seam, fixed local-only `http://localhost:11434/api/chat` access, and no SDK or new HTTP dependency.
- Approved deterministic conversion of each `PromptAssembly` into exactly one unchanged Instructions system message and one JSON user message ordered as applicable Guidance, Merchant Context, Knowledge, and Snippets content, excluding application metadata.
- Approved an exact non-streaming chat request with `stream: false`, caller-supplied model validation, strict assistant-content response validation, optional `AbortSignal` forwarding, and focused unavailable, missing-model, request, response, and cancellation errors.
- Preserved provider replaceability and local privacy by keeping raw Ollama types internal, exposing no raw response or telemetry, adding no prompt or generated-content logging, and defining no OpenAI placeholder, provider registry, or provider-name branching across consumers.
- Explicitly deferred extension runtime ownership, Chrome messaging and localhost permissions, CORS and extension-origin handling, UI and output workflows, Settings and model persistence, health checks, model pulling, streaming, timeouts, retries, tuning options, and database changes.
- Defined deterministic injected-transport automated coverage and an optional opt-in live validation against a developer's existing local Ollama model; normal automated tests must not require Ollama or real network access.
- Kept Milestone 8 current and made its provider architecture implementation-ready without adding implementation code, tests, dependencies, manifests, permissions, browser-runtime changes, UI, or WXT configuration.

### Milestone 7 — Prompt Builder

- Completed the approved deterministic, pure, headless Prompt Builder v1 as an application-layer operation over optional Merchant Context, optional Guidance, and optional prepared M6 `RetrievalResults`.
- Implemented the focused missing-primary-input error: at least one non-whitespace Context or Guidance value is required, retrieval-only input is rejected, and minimal Guidance such as `follow up` is valid.
- Implemented the frozen static provider-independent instructions and `Guidance > Merchant Context > Knowledge > Snippets` precedence without AI-based conflict resolution.
- Preserved M6 ranking while selecting at most the first five Knowledge and first three Snippet results, with no reranking, rescoring, threshold, padding, or retrieval invocation.
- Implemented typed explicit Instructions, Guidance, Merchant Context, Knowledge, and Snippets sections in canonical order, omitting empty optional sections and producing structurally deterministic assemblies without mutating inputs.
- Kept human-readable Knowledge title/body and Snippet title/content separate from application metadata. Domain kinds, IDs, and scores remain metadata; tags and Knowledge source are not automatically rendered into prompt content.
- Added 22 focused deterministic unit tests in 1 file. The full Vitest suite passed with 13 files and 72 tests.
- Passed dependency installation, linting, the final formatting check, type-checking, Playwright discovery of 1 test, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Required no M7-specific manual Chrome validation because Prompt Builder is headless, deterministic unit tests comprehensively cover its behavior, no browser interaction was added, and temporary demonstration UI would violate milestone scope.
- Introduced no retrieval orchestration, provider execution or serialization, Ollama, OpenAI, AI behavior, UI, images, Prompt Templates, persistence or history, token handling, snippet expansion, `;hello` behavior, schema or index change, Chrome permission, or Side Panel.
- Completed the mandatory Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation required synchronization; decisions, product requirements, and the UI workflow were reviewed and required no changes.
- Corrected repository continuity to record Prompt Builder architecture checkpoint `2c2c0ae` (`docs: define prompt builder architecture`) as committed, pushed to `origin/master`, and synchronized locally and remotely before implementation began.
- Advanced the current project milestone to Milestone 8 — Ollama Provider, then created checkpoint `a71dfed` (`feat: implement prompt builder`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 7 — Prompt Builder Architecture Definition

- Corrected repository continuity to record Milestone 6 implementation checkpoint `9649c1b` (`feat: implement retrieval engine`) as committed, pushed to `origin/master`, and synchronized between local `master` and the remote.
- Defined Prompt Builder v1 as a pure, headless, deterministic application-layer composition boundary that validates already-prepared inputs, applies fixed retrieval selection and approved precedence, and produces a typed provider-independent `PromptAssembly`.
- Approved optional Merchant Context, optional Guidance, and optional already-computed `RetrievalResults` as the input contract, with at least one non-whitespace primary input required and a focused missing-primary-input validation error.
- Assigned retrieval-query construction and Retrieval Engine invocation to a future application orchestrator; Prompt Builder preserves M6 ranking and does not call retrieval, alter scores, or rerank results.
- Approved `Guidance > Merchant Context > Knowledge > Snippets`, a static provider-independent grounding instruction section, top-five Knowledge and top-three Snippet selection, and canonical instructions/Guidance/Merchant Context/Knowledge/Snippets section ordering.
- Separated provider-facing title/body or title/content material from application metadata such as domain kind, ID, score, tags, and Knowledge source, with no fabricated citations.
- Defined deterministic empty-section, purity, grounding, formatting, and testing contracts while deferring provider serialization, AI execution, token handling, images, UI, persistence, Prompt Templates, schema changes, and retrieval orchestration.
- Kept Milestone 7 current without implementation code, tests, dependencies, database changes, permissions, or browser surfaces, then created checkpoint `2c2c0ae` (`docs: define prompt builder architecture`), pushed it to `origin/master`, and confirmed local and remote synchronization before implementation began.

### Milestone 6 — Retrieval Engine

- Completed the approved headless Retrieval Engine v1 as a local-only, deterministic, read-only application operation over the existing `KnowledgeEntryRepository` and `SnippetEntryRepository` contracts.
- Implemented separate typed Knowledge and Snippet result collections with complete domain records and numeric relevance scores; no combined cross-domain ranking was introduced.
- Implemented the frozen NFKC, lowercase, Unicode letter-or-number tokenization and exact 5/3/1 title/tag/body-or-content scoring behavior defined in `DECISIONS.md`, including token deduplication, Knowledge source exclusion, zero-score exclusion, tokenless-query handling, deterministic score/`createdAt`/`id` ordering, and no fixed result limit.
- Kept retrieval in memory behind project-owned repository boundaries with no record mutation, direct Dexie access, persistence search API, schema or index change, browser UI, provider dependency, or network access.
- Added focused deterministic unit and isolated IndexedDB repository-integration coverage. Focused retrieval validation passed with 2 files and 14 tests, and the full Vitest suite passed with 12 files and 50 tests.
- Passed dependency installation, linting, the final formatting check, type-checking, Playwright discovery of 1 test, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Required no M6-specific manual Chrome validation because the feature is headless, its algorithm and real repository integration are comprehensively covered by automation, and temporary demonstration UI would violate milestone scope.
- Introduced no semantic or vector retrieval, embeddings, fuzzy, prefix, or stemming behavior, search UI, AI or provider functionality, Context Builder, Prompt Builder, snippet expansion, `;hello` behavior, database or index change, Chrome permission, or Side Panel.
- Completed the mandatory Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation required synchronization; decisions, product requirements, and the UI workflow were reviewed and required no changes.
- Corrected repository continuity to record retrieval architecture checkpoint `5f2e0a0` (`docs: define retrieval engine architecture`) as committed, pushed to `origin/master`, and synchronized locally and remotely before implementation began.
- Advanced the current project milestone to Milestone 7 — Prompt Builder, then created checkpoint `9649c1b` (`feat: implement retrieval engine`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 6 — Retrieval Architecture Definition

- Corrected repository continuity to record Milestone 5 checkpoint `10fbd72` (`feat: implement snippet library`) as committed, pushed to `origin/master`, and synchronized locally and remotely.
- Defined Retrieval Engine v1 as one local, deterministic, read-only, provider-independent application operation over the existing `KnowledgeEntryRepository` and `SnippetEntryRepository` contracts, with in-memory scoring and no direct Dexie access.
- Approved a project-owned result envelope with separately ranked `knowledge` and `snippets` collections. Results retain their explicit domain kind, record identity, complete domain record, and numeric lexical score; no combined cross-domain ordering is defined.
- Approved Unicode NFKC normalization, locale-independent lowercase conversion, contiguous Unicode letter-or-number tokenization, and query and field token deduplication without stemming, fuzzy or prefix matching, synonym expansion, stop-word removal, or phrase matching.
- Defined Knowledge scoring fields as title, tags, and body while excluding source, and Snippet scoring fields as title, tags, and content.
- Approved exact per-token field weights of 5 for title, 3 for tags, and 1 for body or content, with no repeated-term inflation or phrase, recency, usage, source, domain, or random bonuses.
- Defined zero-score exclusion, empty results for queries without tokens, independent score-descending ranking with `createdAt` and `id` tie-breakers, and no fixed M6 result limit.
- Preserved database `ai-support-workspace`, schema version 1, tables, fields, indexes, migrations, repository contracts, browser surfaces, permissions, and provider independence.
- Added deterministic Retrieval Engine unit and isolated repository-integration test requirements without requiring browser UI for retrieval validation.
- Kept Milestone 6 current without retrieval implementation, dependency, schema, or UI changes, then created checkpoint `5f2e0a0` (`docs: define retrieval engine architecture`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 5 — Snippet Library

- Completed the first usable local Snippet Library on the existing options-page Library surface shared with the Knowledge Library through lightweight local tab navigation.
- Preserved popup navigation to the Library in a browser tab and kept the Knowledge Library operational after the Milestone 5 changes.
- Added a separate application-layer Snippet Library boundary over the existing project-owned `SnippetEntryRepository`; presentation code does not access Dexie or IndexedDB directly.
- Implemented deterministic listing, empty and loading states, manual creation, editing, confirmation-protected deletion, and local success and error feedback for Snippet entries.
- Exposed only the approved user-authored Snippet fields: title, content, and tags. Identity and timestamps remain persistence-owned.
- Preserved the approved database `ai-support-workspace`, physical schema version 1, table definitions, indexes, repository contracts, and persistence semantics.
- Added focused application, React UI, and application-to-Dexie integration coverage. The focused Milestone 5 suite passed with 3 files and 11 tests, and the full Vitest suite passed with 10 files and 36 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Completed Principal Engineer review and manual Chrome validation. Popup navigation opened the Library, lightweight local tabs opened the Snippet Library, the empty state worked, create and edit changes appeared immediately and persisted across reload or reopen, canceled deletion preserved data, confirmed deletion remained effective after reload or reopen, the Knowledge Library remained operational, and no runtime problems were reported during the tested workflow.
- Introduced no Chrome permissions, host permissions, database schema or index changes, snippet expansion or insertion, retrieval, AI behavior, Settings functionality, Side Panel, or other later-milestone functionality.
- Completed the mandatory Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation required synchronization; product requirements, the UI workflow, and the backlog were reviewed and required no changes.
- Corrected repository continuity to record Milestone 4 checkpoint `8f65922` (`feat: implement knowledge library`) as committed, pushed to `origin/master`, and synchronized locally and remotely.
- Advanced the current project milestone to Milestone 6 — Retrieval Engine, then created checkpoint `10fbd72` (`feat: implement snippet library`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 4 — Knowledge Library

- Completed the first usable local Knowledge Library on the existing options-page surface, with popup navigation that opens the surface in a browser tab.
- Added an application-layer Knowledge Library boundary over the existing project-owned `KnowledgeEntryRepository`; presentation code does not access Dexie or IndexedDB directly.
- Implemented deterministic listing, empty and loading states, manual creation, editing, confirmation-protected deletion, and local success and error feedback for Knowledge entries.
- Exposed only the approved user-authored Knowledge fields: title, body as Content, tags, and source. Identity and timestamps remain persistence-owned.
- Preserved the approved database `ai-support-workspace`, physical schema version 1, table definitions, indexes, repository contracts, and persistence semantics.
- Added focused application, React UI, and application-to-Dexie integration coverage. The full Vitest suite passed with 7 files and 25 tests.
- Passed dependency installation, linting, formatting, type-checking, Playwright test discovery, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Completed Principal Engineer review and manual Chrome validation. Popup navigation opened the Knowledge Library, create and edit changes appeared immediately and persisted across reload or reopen, canceled deletion preserved data, confirmed deletion remained effective after reload or reopen, and no runtime problems were reported during the tested workflow.
- Introduced no Chrome permissions, host permissions, database schema or index changes, Snippet functionality, retrieval, search, ranking, AI behavior, Settings functionality, Side Panel, or other unapproved browser surface.
- Completed the mandatory Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation required synchronization; product requirements and the UI workflow were reviewed and required no changes.
- Corrected repository continuity to record Milestone 3 checkpoint `fd6ffe5` (`feat: implement local persistence foundation`) as committed, pushed to `origin/master`, and synchronized locally and remotely.
- Advanced the current project milestone to Milestone 5 — Snippet Library, then created checkpoint `8f65922` (`feat: implement knowledge library`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 3 — Local Database

- Completed the Dexie-backed local persistence foundation using database `ai-support-workspace` and physical schema version 1.
- Implemented the approved `knowledgeEntries` and `snippetEntries` tables with inbound `id` primary keys and `createdAt` indexes, without changing the approved schema.
- Implemented project-owned `KnowledgeEntryRepository` and `SnippetEntryRepository` contracts with the approved create, get, list, update, and delete semantics behind the persistence boundary.
- Validated UUID generation, timestamp behavior, deterministic ordering, missing-record behavior, persistence-error wrapping, update semantics, and persistence across database close and reopen.
- Kept `fake-indexeddb` isolated to automated tests. All 13 persistence integration tests passed, and the full Vitest suite passed with 4 files and 15 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, and `git diff --check`; regression validation confirmed that the existing Manifest V3 extension shell remains operational.
- Required no Milestone 3-specific manual Chrome validation because the persistence boundary is validated more appropriately through isolated IndexedDB integration tests, while temporary browser UI would exceed the approved milestone scope.
- Introduced no Chrome permissions or host permissions and no Settings persistence, search, retrieval, ranking, AI behavior, product UI, undocumented schema change, or architecture change.
- Completed the mandatory Documentation Impact Review and synchronized the affected project-state, roadmap, schema-status, architecture-status, testing, README, and changelog documentation.
- Advanced the current project milestone to Milestone 4 — Knowledge Library, then created checkpoint `fd6ffe5` (`feat: implement local persistence foundation`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 3 — Database Architecture Definition

- Corrected repository state to record Milestone 2 checkpoint `6a8b0ae`, its push to `origin/master`, and local/remote synchronization.
- Approved the `ai-support-workspace` IndexedDB/Dexie database identity and initial physical schema version 1.
- Defined `knowledgeEntries` and `snippetEntries` as the only Milestone 3 physical tables; kept Settings planned and deferred to its later roadmap milestone.
- Defined primary keys, minimal `createdAt` indexes, UUID identity, timestamp behavior, record defaults, deterministic list ordering, project-owned CRUD contracts, error behavior, transaction policy, and migration policy.
- Approved `fake-indexeddb` as a test-only adapter for isolated Dexie integration tests without adding the dependency or implementation code.
- Preserved all approved domain fields and excluded search, retrieval, product UI, Settings persistence, and other future functionality from Milestone 3.

### Milestone 2 — Extension Shell

- Completed the first runnable WXT Chrome extension shell targeting Manifest V3.
- Added the approved background service worker, content script, React popup, and React options page without product or business functionality.
- Restricted the content script to `https://example.com/*`; the generated manifest contains no `permissions` or `host_permissions` and does not include Side Panel.
- Validated React and Tailwind within the popup and options surfaces.
- Added the first production WXT build, automated generated-manifest and build-output validation, React shell tests, and a continuous-integration production-build gate.
- Passed dependency installation, linting, formatting, type-checking, Vitest execution, Playwright test discovery, production build validation, and `git diff --check`.
- Completed Principal Engineer review and manual Chrome validation. The unpacked extension loaded successfully, Chrome accepted the generated Manifest V3 manifest, all approved runtime surfaces operated without reported errors, the content script initialized on its test page, and no unintended page modification was observed.
- Completed the mandatory Documentation Impact Review and synchronized affected repository status documentation without changing architecture, product requirements, milestone definitions, or roadmap scope.
- Advanced the current project milestone to Milestone 3 — Local Database.

### Engineering Workflow v1

- Formalized the standard implementation milestone lifecycle from finalized Principal Engineer scope through Codex implementation, review, documentation synchronization, manual validation, Git checkpoint, and GitHub push.
- Added Documentation Impact Review as a mandatory checkpoint gate with an explicit repository record required even when no documentation updates are needed.
- Added a reusable Milestone Closeout Checklist.
- Documented Git and GitHub synchronization policy for milestone boundaries.
- Defined deterministic, directly copy-pasteable Principal Engineer implementation task standards.
- Preserved the current milestone, architecture, roadmap, and product requirements.

### Milestone 1 — Technical Foundation

- Completed the Milestone 1 development foundation without adding extension runtime or business functionality.
- Initialized pnpm project management with a reproducible lockfile and explicit dependency build-script policy.
- Configured WXT, Manifest V3 targeting, TypeScript, React, Tailwind CSS, and Vite for future extension implementation.
- Added ESLint, Prettier, Husky, and lint-staged quality tooling.
- Added Vitest and Playwright testing foundations, including an infrastructure-only Playwright discovery test.
- Added continuous integration for installation, linting, formatting, type-checking, Vitest execution, and Playwright configuration validation.
- Validated the complete development toolchain successfully.
- Preserved the milestone boundary: no manifest, extension entry point, runtime source, storage implementation, business feature, or WXT production build was introduced.
- Deferred the first WXT production build to Milestone 2 — Extension Shell.

### Added

- Repository foundation documentation structure
- Initial product vision and requirements
- Initial architecture and decision records
- Initial roadmap and testing strategy
- Initial coding agent rules
- Initial project state document
- `UI_WORKFLOW.md`

### Updated

- Repository foundation completed.
- Finalized repository documentation after Principal Engineer review.
- Marked Milestone 0 as completed and aligned the project state with the new documentation-first workflow.
- Split the technical foundation and extension shell into separate milestones and synchronized subsequent milestone numbering.
- Added Milestones 0B, 0C, and 0D to make documentation finalization, technical architecture decisions, and platform approval explicit roadmap gates.
- Documented Manifest V3, TypeScript, React, layered testing, minimal state management, provider independence, planned storage boundaries, and project-layer responsibilities.
- Platform architecture approved.
- Technology stack finalized as WXT, Manifest V3, TypeScript, React, Tailwind CSS, pnpm, Dexie, React Context and Hooks, Vitest, Playwright, ESLint, Prettier, Husky, and lint-staged.
- Infrastructure decisions frozen for implementation.
- Repository ready for Milestone 1 implementation under an approved task.
- Repository continuity validation completed through a successful fresh-thread reconstruction.
- Documentation clarified following reconstruction testing.
- Milestone boundaries and infrastructure, architecture, and business-functionality terminology clarified without architecture changes.

### Notes

- Milestone 0 completed without implementation code.
- Milestones 0C and 0D documented and approved architecture without adding implementation artifacts.
- DP-001 includes no architecture changes and no implementation changes.
- The repository is now documented in a way that supports future milestone continuity.
