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
- **IMPLEMENTED / AUTOMATED PASS / REAL-BROWSER PASS — M14-K.2 Windows Automatic Paste Implementation:** Settings/Backup v6 evolution, shared boundary, one-use browser authorization, strict protocol v2, direct Win32 input, typed fallback UX, and deterministic browser/native safety coverage are implemented without changing protocol v1 or Decisions 42/43.
- **PRINCIPAL APPROVED — M14-K.3:** automatic and clipboard-only Text/Image pass in Intercom and Crisp; unknown-trigger safety and live Settings propagation pass; the successful native trace records 4/4 input, last error 0, and struct size 40.
- **ACTIVE / DOCUMENTATION ONLY — M14-K.4:** lock Decisions 46–49 and the AI handoff. M14-K implementation is real-browser validated/Principal-approved, but the checkpoint remains pending final Principal review and Git authorization; M14-K is not closed.
- **FUTURE ARCHITECTURAL PERFORMANCE OPPORTUNITY (C):** consider reducing JPEG/WebP-to-PNG conversion latency and consolidating repeated one-shot native-host contacts only in a separately approved architecture task. Controlled 1440×900 conversions measured about 1.04–1.06 s; content-free host startup measured 67.0 ms median / 76.1 ms p95. Direct PNG preparation is already fast. Do not replace one-shot Native Messaging inside M14-K closeout.
- Keep variables, arbitrary HTML/CSS, non-image attachments, provider work, M15 Context images, analytics, alternate triggers, cloud hosting, destination-upload integration, sync, and collaboration out of M14.

### Approved Post-M14 Snippet Hardening (Task ID Pending)

- Add periodic local automatic backup by reusing the canonical Backup/Export format. Cadence is `Off | Daily | Weekly`, weekly recommended/default; manual Export remains; failure never blocks Snippet use; retention is bounded. Determine location, retention count, Chrome capabilities, and permissions during implementation architecture review.
- Add provider-independent generated Text Snippet tags as non-authoritative retrieval hints. Preserve current caller-authored ordered tags, never overwrite content, never make generated tags the sole eligibility condition, and explicitly design generated/authored coexistence plus any schema/Backup evolution.
- Add best-effort mutable usage metadata conceptually containing `snippetId`, `usageCount`, and `lastUsedAt`. Count after clipboard success plus exact trigger cleanup in either paste mode, do not observe physical `Ctrl+V`, and never block delivery. Prefer separation from authored Snippet content subject to schema review.
- Keep textual relevance primary, generated tags supporting, and usage/recency weak tie-breakers. Popularity must not dominate relevance.
- This gate occurs after M14 closes and before M15 implementation. Its task ID remains intentionally unassigned because M15/M16 already have established meanings.

### M15 — AI Drafting Workflow Refinement and Multimodal Context

- Make Text Snippets the sole active user-managed AI reference library; retire Knowledge from the active AI workflow/UI without deleting the compatibility domain/store/backups until a separate cleanup task.
- Implement optional Guidance / Gist, Context/Gist empty-state rules, factual grounding, application defaults, and Text-Snippet reference precedence from Decision 46.
- Implement the compact Decision 47 Workspace order, bounded auto-growing inputs, provider-independent Model dropdown, editable preserved output, Copy, and reduced primary-workflow explanatory copy.
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

### Workspace Shell Action UX

- Replace the current toolbar-action-to-popup-to-Workspace path with direct opening/showing of the existing global AI Support Workspace Side Panel through Chrome's supported toolbar-action Side Panel behavior.
- Add a Library action inside the Side Panel that opens the existing full options/Library page in a normal browser tab. Keep Knowledge, Snippets, Settings, Import / Export, and future management in options; do not duplicate the full Library shell in the panel.
- Inspect WXT's generated manifest/action configuration and retire the default popup cleanly so direct Side Panel opening and `action.default_popup` do not compete. Preserve the existing keyboard shortcut, global Side Panel behavior, and least-privilege permissions; no new permission is expected solely for this change.
- This capability is unassigned, has no milestone, is not M14-G through M14-J, and must not interrupt the approved Snippet sequence.

### Optional Windows Automatic Native Paste

- Architecture investigation is complete in M14-K.1 / Decision 45. Windows automatic paste will extend the existing C# companion after authoritative clipboard preparation; it is not part of or a modification to Decision 43 protocol v1.
- Automatic mode is optional and defaults off. Clipboard-only/manual `Ctrl+V` remains a permanent supported workflow and fallback, and clipboard content remains available after automatic success.
- M14-K.2 implements one direct four-event `SendInput` call and strict protocol v2. Arbitrary send-keys, AutoHotkey, focus stealing, retries after possible input, stale request queues, and non-Windows native hosts remain prohibited.
- M14-K.3 incorporates successful live automatic delivery plus deterministic stale editor/tab/window/application focus coverage. The known residual same-window last-instant race remains documented and is not permission to weaken focus safety.
- This separable capability is not part of the M14-I.2 clipboard-writing requirement or M14-J. Decision 45 supplies its independent focus/race-safety architecture; the complete M14-K tree now awaits Principal closeout review.

### Production Native Companion Packaging

- Build a production native installer only through a separately approved packaging task. Production installer technology, stable installation paths, repair, rollback, and uninstall remain unimplemented.
- Production code signing, publisher reputation, release identity, exact production Native Messaging registration, and production companion identity remain deferred.
- A production updater is not implemented; update and rollback mechanics require their own validated release workflow.
- Non-Windows companion support remains future platform work and is not part of M14-J.

Context screenshots and Snippet images remain separate domains: Context images are transient inputs to generation, while Snippet images are reusable Library-owned response content for editor expansion.

## Notes

M13 is complete at `b76fcb4`/`9a3c7ef`. M14-I is complete at `ebe915f`/`28dcf53`. M14-J is complete and real-browser validated, including Crisp/Intercom no-refresh recovery and repeated-reload duplicate safety. The Intercom Shift+Enter bullet edge and measured class-C Image performance opportunity are non-blocking follow-ups. M14-K.3 is Principal-approved; M14-K.4 decision lockdown is active. The M14-K checkpoint awaits final Principal review/Git authorization and M14-K is not closed. Post-M14 Snippet hardening precedes M15, whose implementation is not started.
