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
- **COMPLETE / CHECKPOINT PENDING — M14-J.7:** final M14-J documentation is synchronized for Principal review of one combined M14-J.6 implementation/tests/configuration plus closeout checkpoint.
- **NEXT / NOT STARTED — M14-K Automatic Paste:** begin with architecture and focus/race safety, then an approved Windows implementation, then Crisp/Intercom real-world validation. Prefer extending the existing C# native companion if feasible; AutoHotkey remains a reference comparison only. Manual `Ctrl+V` remains current behavior.
- **NON-BLOCKING PERFORMANCE FOLLOW-UP:** investigate perceived Image Snippet latency relative to Text Snippets. Crisp and Intercom Image delivery are functionally PASS; do not block M14-K on this investigation.
- Keep variables, arbitrary HTML/CSS, non-image attachments, provider work, M15 Context images, analytics, alternate triggers, cloud hosting, destination-upload integration, sync, and collaboration out of M14.

### M15 — Multimodal Screenshot Context

- Extend Merchant Context beyond ordinary text to one or more screenshots for AI generation when the selected provider and model support image understanding.
- Allow direct screenshot clipboard paste without requiring a disk save or cloud upload first.
- Provide visible attachment indication, appropriate preview, and removal before generation. Image reordering remains unresolved.
- Keep screenshots transient and local-first by default; no persistence or image table is currently approved.
- Preserve provider independence through a future capability boundary and never silently discard screenshots when a provider is text-only.
- Defer representation, unsupported-provider UX details, count/size/format limits, persistence, Prompt Builder changes, provider serialization, and implementation tasks to future M15 architecture work.

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

- Investigate separately whether an installed Windows companion can later issue a focus-safe native `Ctrl+V` after clipboard preparation. Do not combine this with M14-I.2 clipboard writing prematurely.
- A future auto-paste capability may extend the existing native companion or use separately approved Windows input mechanics. No AutoHotkey/`SendInput` implementation, new dependency, additional registration, or additional permission is approved now.
- The helper must be optional, must never paste into a different focused window, must retain manual `Ctrl+V` as fallback, and must address installation, security, and cross-platform implications before becoming product scope.
- This separable capability is not part of the M14-I.2 clipboard-writing requirement or M14-J and requires independent focus/race-safety approval.

### Production Native Companion Packaging

- Build a production native installer only through a separately approved packaging task. Production installer technology, stable installation paths, repair, rollback, and uninstall remain unimplemented.
- Production code signing, publisher reputation, release identity, exact production Native Messaging registration, and production companion identity remain deferred.
- A production updater is not implemented; update and rollback mechanics require their own validated release workflow.
- Non-Windows companion support remains future platform work and is not part of M14-J.

Context screenshots and Snippet images remain separate domains: Context images are transient inputs to generation, while Snippet images are reusable Library-owned response content for editor expansion.

## Notes

M13 is complete at `b76fcb4`/`9a3c7ef`. M14-I is complete at `ebe915f`/`28dcf53`. M14-J.1 through M14-J.5.1 are committed at `797a68a`; M14-J.6 plus M14-J.7 await one Principal-approved combined checkpoint. M14-J is complete and real-browser validated, including Crisp/Intercom no-refresh recovery and repeated-reload duplicate safety. The Intercom Shift+Enter bullet edge and perceived Image latency are non-blocking follow-ups. M14-K is exact next and not started; M15 remains separate and not started.
