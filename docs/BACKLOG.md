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
- **Next — M14-G:** implement structured unordered/ordered lists, the minimal image content discriminant needed for one complete Backup v5 contract, strict Backup v5, v1-v4 import regression coverage, and no Dexie v6. No Image Snippet UI/delivery.
- **Then — M14-H:** implement exactly-one Image Snippet ownership and paste/select/preview/replace/remove-before-Save/Save/Cancel/reopen UI through M14-E transactions. Keep image triggers excluded until typed delivery.
- **Then — M14-I:** implement typed catalog descriptors without binaries, on-demand asset lookup, optional `clipboardWrite`/`offscreen`, PNG preparation, safe post-copy trigger cleanup, `Image copied — press Ctrl+V`, and real user paste. Never use clipboard read or synthetic paste.
- **Then — M14-J:** implement Rich text/list delivery through proven safe direct or clipboard-assisted text/HTML strategies and record Crisp/Intercom capability evidence. No normal Rich image delivery.
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

Context screenshots and Snippet images remain separate domains: Context images are transient inputs to generation, while Snippet images are reusable Library-owned response content for editor expansion.

## Notes

M13 is complete at `b76fcb4`/`9a3c7ef`. M14-E is complete at `1828f09`. Decision 39 cancels the former M14-F before implementation and revises the remaining sequence to M14-G through M14-J. The next action after M14-F.1 approval is M14-G — Rich Snippet Structured Lists and Backup v5 Foundation. M15 remains Multimodal Screenshot Context, M16 remains OpenAI Provider Expansion, and workflow polish and integrations remain later work.
