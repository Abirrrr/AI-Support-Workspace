# Backlog

## Near-Term Backlog

- Establish the technical foundation and automated validation baseline.
- Create the initial extension shell and manifest.
- Add a local storage layer for knowledge and snippets.
- Implement a small retrieval engine with local search.
- Introduce a provider abstraction for Ollama and later OpenAI.
- Create a simple output workspace for reviewing generated content.

## Future Considerations

- Preserve the completed M12 backup and restore guarantees and completed M13 Backup Format v2/v1-compatibility guarantees in all later data-model evolution.
- Preserve the application-owned backup format independently from Dexie schema versioning; future format evolution must not silently redefine format version 1.
- Reconsider provider endpoint configuration only with provider expansion or a dedicated security and permissions architecture review.
- Consider persistent Prompt Profiles or writing preferences only through a separate product and precedence decision; they are not M11 behavior tuning.
- Refine the UI around Intercom support workflows.
- Evaluate prompt and local-model quality improvements for cases where generated wording implies unsupported commitments or timelines despite contrary Guidance.
- Expand testing coverage as implementation matures.
- Continue generic quality, usability, performance, and documentation polish as ongoing backlog work and a possible later milestone rather than folding it into M13–M16.
- Consider merge import, selective import/export, encrypted backup, compression, backup history, or scheduling only through separate future product and architecture decisions; none is part of M12.

## Approved Future Capabilities

### M14 — Rich Snippet Templates

- Preserve Decision 36's single `SnippetEntry`, Library, trigger/catalog, deterministic projection, Retrieval/Prompt Builder, and local-first foundations. Preserve M14-E's `SnippetAsset`, Dexie v5, Backup v4, ownership, validation, and atomic transaction infrastructure.
- Apply Decision 39: Rich Snippets target paragraphs, bold, italic, links, bullet lists, and numbered lists. M14-F inline local-image Rich authoring is cancelled before implementation.
- Add Image Snippets as a distinct `SnippetContent` type with exactly one same-owner local PNG/JPEG/WebP asset and the normal trigger system. Do not create an Image Library, galleries, shared assets, image/text combinations, or "Use as Context."
- Preserve legacy HTTP(S) Image References without fetching/conversion. Preserve existing Rich local-image blocks as compatibility-only Backup-v4 data under Decision 38; allow no new authoring or automatic mixed-record conversion.
- **Completed at `672185e` — M14-G/G.2:** implemented lists, the Image discriminant, Backup v5, semantic isolation, constrained Text WYSIWYG, simplified Library, and screenshot/file Image authoring with atomic asset lifecycle reuse.
- **M14-H:** ABSORBED INTO M14-G.2 / NOT A SEPARATE ACTIVE TASK.
- **Text compatibility correction — M14-I.1.3:** Real Chrome identified `clipboard-write-failed` at the final offscreen Async Clipboard Text write. Text now uses a temporary copy-event/`execCommand('copy')` path for both planned representations. Real Chrome validates preparation, cleanup, notice, formatting, and lists.
- **Image compatibility correction — M14-I.1.4 (historical):** The previous Decision 42-gated Async Clipboard path failed at `offscreen-write` / `clipboard-write-failed`. The copy-event `image/png` File path then reported success but real Chrome pasted `snippet.png`, not the intended image. It was not a valid Image Snippet transport and was removed during M14-I cleanup.
- **Native representation feasibility — M14-I.1.5.2 conclusion:** offscreen Async, M14-I.1.4 `snippet.png`, and focused-content A1 `TEXT` are real-Chrome failures for Image semantics. Focused extension-page B `VISIBLE IMAGE` is a real-Chrome capability pass but not acceptable production UX. A2/F9 was not run and is no longer required for this decision.
- **ARCHITECTURE DEFINED — M14-I.2 Windows Native Clipboard Companion Architecture:** Decision 43 selects the exact Windows-only optional companion boundary, one-shot protocol, .NET 10 LTS host, WIC/PNG+CF_DIBV5 clipboard path, origin controls, validation, failure, installation, versioning, concurrency, and cleanup policies. M14-I.2 itself was documentation-only; M14-I.3 now implements the standalone foundation.
- **COMPLETE AT `ebe915f` — M14-I.3 Windows Native Clipboard Companion Foundation:** the standalone .NET 10 `win-x64` host, strict v1, WIC, registered PNG + CF_DIBV5, HWND, ownership, retry, mutex, fixtures, and native automated tests are implemented and committed.
- **COMPLETE / REAL-CHROME VALIDATED AT `ebe915f` — M14-I.4/M14-I.4.1:** stable development identity, optional `nativeMessaging`, truthful Settings readiness UX, callback-aligned service-worker native transport, strict protocol/golden-fixture conformance, `.dev` host generation, and reversible HKCU development registration are implemented. Settings `Ready` and native Image end-to-end delivery passed.
- **COMPLETE / POST-CLEANUP SMOKE PASS AT `ebe915f` — M14-I.5:** failed browser Image transports, obsolete Image-only contracts/errors/tests, and A1/A2/B feasibility runtime probes are removed. Validated Text offscreen delivery, Windows native Image delivery, historical evidence, Decision 42, Decision 43, and development registration remain.
- **COMMITTED AT `797a68a` — M14-J.1–J.5.1:** Crisp Text/Image and Intercom normal Text/bullet/Image are real-destination PASS. M14-J.5 proved the first list result used an invalid two-item fixture; the corrected three-item record passes persistence, serializer, delivery-payload equality, and normal Intercom paste. The production-excluded one-shot diagnostic remains available for explicit local inspection.
- **KNOWN LOW-PRIORITY COMPATIBILITY LIMITATION:** triggering the bullet-list Snippet immediately after Shift+Enter in Intercom can omit the first bullet. This does not block normal list paste or reopen the persistence, serializer, planner, Image, or Shadow-DOM results.
- **COMPLETE / AUTOMATED PASS / REAL-CHROME PASS — M14-J.6:** Content Script Lifecycle Recovery & Always-On Availability preserves static injection, recovers eligible already-open HTTP/HTTPS frames after install/update/reload/startup, reconnects after ordinary worker termination, and prevents duplicate runtimes. Intercom/Crisp no-refresh recovery and repeated-reload idempotency pass. Decision 44 selects exact persistent HTTP/HTTPS host access; no `tabs`, polling, alarms, keepalive, page inspection, or automatic paste is introduced.
- **COMPLETE / SYNCHRONIZED AT `e4e9645` — M14-J.7:** final M14-J documentation and lifecycle implementation are checkpointed locally and remotely.
- **COMPLETE AT `5066476` — M14-K.1 Automatic Paste Architecture + Focus Safety:** Decision 45 defines the additive, opt-in, focus-safe architecture and permanent manual fallback.
- **COMPLETE AT `e34cd76` / AUTOMATED PASS / REAL-BROWSER PASS — M14-K.2 Windows Automatic Paste Implementation:** Settings/Backup v6 evolution, shared boundary, one-use browser authorization, strict protocol v2, direct Win32 input, typed fallback UX, and deterministic browser/native safety coverage are implemented without changing protocol v1 or Decisions 42/43.
- **PRINCIPAL APPROVED — M14-K.3:** automatic and clipboard-only Text/Image pass in Intercom and Crisp; unknown-trigger safety and live Settings propagation pass; the successful native trace records 4/4 input, last error 0, and struct size 40.
- **COMPLETE IN `e34cd76` / DOCUMENTATION ONLY — M14-K.4:** Decisions 46–49 and the AI handoff are locked without runtime, schema, permission, or dependency changes.
- **CLOSED / COMPLETE AT `e34cd76` — M14-K:** automatic paste is real-browser validated and Principal-approved. M14-K.5 records the checkpoint and final status without implementation changes.
- **M14-P.1 PERFORMANCE GATE IMPLEMENTED / AUTOMATED PASS:** current stable fixtures replace historical assumptions. Text and guarded PNG preparation are Category D; duplicate Blob reads/copies are Category B; genuine JPEG/WebP conversion and one-shot consolidation remain Category C. Native PNG request base64 serialization was Category A and now uses an equivalent efficient byte-array API plus exact bounded fallback, improving the 4.46 MiB warm median from 254.3 ms to 1.5 ms. Principal real-Chrome validation remains required; M14-P overall is not complete.
- Keep variables, arbitrary HTML/CSS, non-image attachments, provider work, M15 Context images, analytics, alternate triggers, cloud hosting, destination-upload integration, sync, and collaboration out of M14.

### M14-L–M14-P — Approved Snippet Hardening

- **M14-L/M14-L.1 — Architecture & Reconciliation:** Principal-approved Decisions 50–53 define coordinated portable evolution and independent failure boundaries; Decision 54 preserves the locked future toolbar-to-Side-Panel/Settings-gear navigation. Documentation only; current runtime remains unchanged.
- **M14-M.0 — Selected-Folder Backup Feasibility Gate:** **PASS / REAL-CHROME VALIDATED**. Critical selected-folder persistence, restart, background reuse, exact owned-file, same-folder, and unavailable-location premises passed without permission expansion. Different-folder distinction is a non-blocking M14-N verification before retention reliance.
- **M14-M.1/M14-M.1.1 — Shared Data Foundation (COMPLETE AT `20b509c`):** strict Backup v7, one additive Dexie v6 migration, exact portable `off | daily | weekly` cadence with `weekly` default, Text/Image usage and Text-only generated-metadata sidecars, local selected-directory/backup-set singleton boundary, atomic deletion/source invalidation, v1-v6 defaults, and atomic portable restore are implemented. Restore preserves the separately owned local authorization; no import creates it. No permission or dependency changed.
- **M14-M.2 — Daily-Use Feedback Recording (DOCUMENTATION ONLY):** F1 requires conventional blue/underlined safe-link presentation in the existing rich editor without new formatting/domain semantics. F2 requires deterministic accessible Edit-to-editor view/focus without timing hacks or route redesign. Both must resolve before M14-P closes. F3 **Save as Snippet** belongs to M15 and requires explicit user Save.
- **M14-M.3/M14-M.3.1 — Usage Statistics Behavior and Display Simplification (COMPLETE / CHECKPOINTED AT `2475f8b`):** a 30-second transient service-worker receipt now binds request/Snippet/kind/sender/catalog after clipboard success and consumes once only after exact cleanup. Atomic saturating sidecar writes are best effort and non-blocking; Text/Image and clipboard-only/automatic share semantics; worker loss safely undercounts; the Library shows only the numeric count with absence as `0` and an accessible label. Retrieval/view/edit/export do not count, and no catalog/authored/generated metadata churn occurs.
- **M14-N.1 — Automatic Backup Runtime Core (IMPLEMENTED / AUTOMATED PASS):** one stable named one-shot `alarms` schedule, anchor-aligned missed-run coalescing, background permission query only, canonical v7 creation, collision-safe selected-folder write/readback verification, bounded local ownership manifest, Daily latest-seven/Weekly latest-four exact-proof retention, folder-switch guards, and 30-minute persisted lease are implemented without Dexie/Backup version changes, scanning, `downloads`, polling, or keepalive.
- **M14-N.2 — Options Activation & Runtime Wiring (IMPLEMENTED / AUTOMATED PASS):** explicit user-gesture `showDirectoryPicker({ mode: 'readwrite' })`, Change Folder, Reauthorize, Off/Daily/Weekly, and safe status are connected through a typed facade to M14-N.1 adoption/cadence reconciliation. Manual Export stays independent; no silent Downloads fallback.
- **M14-N.3 — Backup Strategy Simplification & Monthly Reminder (COMPLETE AT `d410ecb`):** cancelled the former real-Chrome automatic-backup validation; retained Manual Backup v7; tracks local successful-export time; shows a 30-day advisory; retired production scheduling, selected-folder UI/runtime, retention, and `alarms`; keeps historical automatic state dormant and historical files untouched.
- **M14-P.1 — Snippet Delivery Performance Re-measurement & Optimization (IMPLEMENTED / AUTOMATED PASS):** measurement-first focused gate promoted ahead of M14-O. Only the evidence-backed Category-A native-request serializer changed. No persistent cache, protocol expansion, native source change, telemetry, permission, Dexie/Backup, trigger, destination, automatic-paste, or usage-receipt change is included.
- **M14-P.2 — Daily-Use Snippet UX Cleanup (F1 + F2) (IMPLEMENTED / AUTOMATED PASS):** editor-scoped blue/underlined safe links plus explicit-Edit-only deterministic scroll/focus are implemented over the existing unified authoring form. Text focuses content; Image focuses Title. No timer, polling, autofocus, automatic file picker/save, general formatting control, delivery/performance change, permission, dependency, schema, Backup, M14-O, F3, or M15 work is included.
- **M14-O — Generated Text Tags + Retrieval:** keep authored tags unchanged; store Text-only generated tags with source fingerprint; invalidate on material edit; generate after Save through injected `GenerationProvider` and configured-model resolver; accept only exact bounded JSON arrays; backfill only through edit or an explicit 20-record/concurrency-one batch. Generated tags score 1 after title 5/authored tags 3/content 1; usage/recency stay out of retrieval.
- **M14-P — Validation & Closeout:** validate migration, Backup v1-v7 compatibility, local reminder/import isolation, atomic restore, receipt idempotency, delivery failure isolation, provider/model failures, ranking, permissions, privacy, M14-K regressions, F1/F2, real-world UX, user-visible performance, and documentation consistency. Review the complete Snippet subsystem and perform a focused optimization gate if remeasurement still shows meaningful delay. M15 remains blocked until closeout.
- **Automatic-backup history:** Daily/Weekly retention values remain historical M14-N.1/N.2 design records only. Current product performs no automatic retention or filesystem deletion.

### M15 — AI Drafting Workflow Refinement and Multimodal Context

- Carry Decision 54 first: replace the popup-backed toolbar action with native global Side Panel open/toggle behavior and add the compact Settings gear-to-Options path without a new permission.
- Make Text Snippets the sole active user-managed AI reference library; retire Knowledge from the active AI workflow/UI without deleting the compatibility domain/store/backups until a separate cleanup task.
- Implement optional Guidance / Gist, Context/Gist empty-state rules, factual grounding, application defaults, and Text-Snippet reference precedence from Decision 46.
- Implement the compact Decision 47 Workspace order, bounded auto-growing inputs, provider-independent Model dropdown, editable preserved output, **Save as Snippet**, Copy, and reduced primary-workflow explanatory copy. Save as Snippet opens Text Snippet authoring with content prefilled and creates nothing until explicit user Save.
- Extend Merchant Context beyond ordinary text to one or more request-scoped screenshots/images for AI generation when the selected provider and model support image understanding.
- Allow direct screenshot clipboard paste without requiring a disk save or cloud upload first.
- Provide visible attachment indication, appropriate preview, and removal before generation. Image reordering remains unresolved.
- Keep screenshots transient and local-first by default; no persistence or image table is currently approved.
- Preserve provider independence through a future capability boundary and never silently discard screenshots when a provider is text-only.
- Defer representation, unsupported-provider UX details, count/size/format limits, workspace-continuity persistence, Prompt Builder/retrieval contract changes, provider serialization, and implementation decomposition to future M15 architecture work.

### M16 — OpenAI Provider Expansion

- Add OpenAI behind the existing project-owned generation-provider boundary.
- Define provider selection, credential storage, endpoint and permission policy, model selection, errors, privacy, and migration behavior before implementation.
- Preserve existing Ollama and provider-independent Prompt Builder behavior.

### Chrome Side Panel Focus Activation

- Activate/focus an already-visible Chrome Side Panel after shortcut capture when Chrome exposes a supported API.
- This capability is unassigned, has no milestone, and does not authorize M10 retries, delays, polling, panel close/reopen, toggle behavior, broader permissions, persistence, notifications, or alternate tab or window workarounds.

### M15 Workspace Shell Action UX

- Replace the current toolbar-action-to-popup-to-Workspace path with `chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true})`, a popup-free toolbar action, and native global Side Panel open/toggle behavior.
- Add one compact icon-only Settings gear in the Side Panel title row. It uses `chrome.runtime.openOptionsPage()`, accessible name `Open Settings and Libraries`, visible focus, native keyboard activation, and safe failure feedback. Do not add a full-width **Open Libraries** row or Settings dropdown/menu. Keep Knowledge compatibility, Text/Image Snippets, Settings, Import / Export, automatic backup, paste behavior, model/provider controls, and future management in Options.
- Inspect WXT's generated manifest/action configuration; retire the popup entry point and `action.default_popup`; preserve `side_panel.default_path`, `options_ui`, the existing keyboard shortcut, global Side Panel behavior, and least-privilege permissions. Replace popup tests and validate the locked flow in real Chrome.
- Decision 54 assigns this capability to M15. It is not implemented in M14-L and must not interrupt M14-M through M14-P.

### Optional Windows Automatic Native Paste

- Architecture investigation is complete in M14-K.1 / Decision 45. Windows automatic paste will extend the existing C# companion after authoritative clipboard preparation; it is not part of or a modification to Decision 43 protocol v1.
- Automatic mode is optional and defaults off. Clipboard-only/manual `Ctrl+V` remains a permanent supported workflow and fallback, and clipboard content remains available after automatic success.
- M14-K.2 implements one direct four-event `SendInput` call and strict protocol v2. Arbitrary send-keys, AutoHotkey, focus stealing, retries after possible input, stale request queues, and non-Windows native hosts remain prohibited.
- M14-K.3 incorporates successful live automatic delivery plus deterministic stale editor/tab/window/application focus coverage. The known residual same-window last-instant race remains documented and is not permission to weaken focus safety.
- This separable capability is not part of the M14-I.2 clipboard-writing requirement or M14-J. Decision 45 supplies its independent focus/race-safety architecture; M14-K is complete at `e34cd76`.

### Production Native Companion Packaging

- Build a production native installer only through a separately approved packaging task. Production installer technology, stable installation paths, repair, rollback, and uninstall remain unimplemented.
- Production code signing, publisher reputation, release identity, exact production Native Messaging registration, and production companion identity remain deferred.
- A production updater is not implemented; update and rollback mechanics require their own validated release workflow.
- Non-Windows companion support remains future platform work and is not part of M14-J.

Context screenshots and Snippet images remain separate domains: Context images are transient inputs to generation, while Snippet images are reusable Library-owned response content for editor expansion.

## Notes

M13 is complete at `b76fcb4`/`9a3c7ef`. M14-I is complete at `ebe915f`/`28dcf53`. M14-J is complete and real-browser validated. M14-K is closed at `e34cd76`. M14-M.0 remains PASS; M14-M.1 is the Dexie v6/Backup v7 foundation; M14-M.2 is checkpointed at `f4d9ab0`; M14-M.3/M14-M.3.1 at `2475f8b`; and M14-N.3 is complete at `d410ecb`. M14-P.1 is approved at `7bc5005`; M14-P.2 F1/F2 is the active implemented UX gate ahead of M14-O. M14-P overall and M15 remain gated and incomplete.
