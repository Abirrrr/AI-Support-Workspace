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

- Implement Decision 36 on the existing `SnippetEntry`, repository, Library, trigger, catalog, and editor-adapter system; do not create a second Template entity or Library.
- Introduce the canonical plain-or-rich `SnippetContent` union with ordered paragraphs, text/link inline nodes, explicit bold/italic marks, and labelled HTTP(S) image references. Persist no HTML or local binary assets.
- Make deterministic plain projection the Retrieval Engine, Prompt Builder, textarea, single-line-input capability check, and unsupported-destination boundary. Preserve every block's semantic position.
- Extend safe contenteditable rendering through target-owned DOM creation while preserving every M13 activation, caret, event, cache, invalidation, and failure guarantee.
- Implement Dexie version 4 without new indexes/tables and strict Backup Format v3 with v1/v2 frozen import compatibility and explicit DTO mappings.
- Keep the existing Library. Default new Snippets to plain, provide explicit plain-to-rich conversion, structured rich editing, and keyboard-accessible ordering; defer rich-to-plain conversion and third-party editor dependencies.
- Keep variables, arbitrary HTML/CSS, local assets, clipboard ingestion, uploads, provider work, M15 screenshots, analytics, alternate triggers, sync, collaboration, and new permissions out of M14 v1.
- Next task: create M14-B — Structured Snippet Content and Backup Foundation. Implementation has not started.

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

Context screenshots and Snippet images remain separate domains: Context images are transient inputs to generation, while Snippet images are reusable Library-owned response content for editor expansion.

## Notes

M13 — Snippet Trigger Expansion v1 is complete at implementation checkpoint `b76fcb4` and closeout checkpoint `9a3c7ef`. M14 — Rich Snippet Templates is current with architecture defined by M14-A; implementation has not started, and M14-B is the next action. M15 remains Multimodal Screenshot Context, M16 remains OpenAI Provider Expansion, and workflow polish and additional integrations remain later work.
