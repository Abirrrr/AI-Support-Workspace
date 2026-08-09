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

- Preserve Decision 36's single `SnippetEntry`, Library, trigger/catalog, structured-content, deterministic-projection, Retrieval/Prompt Builder, and local-first foundations. Apply Decision 37's partial revision for local assets and delivery.
- Preserve legacy HTTP(S) Image Reference records without automatic fetch/conversion while making new image authoring use locally owned PNG/JPEG/WebP assets placed inline in one continuous Rich editor.
- **Next — M14-E:** implement the validated asset domain/repository, 5 MiB per-asset, 20 MiB per-Snippet and 40 MiB project limits, atomic Save/delete/cancel semantics, Dexie v5 `snippetAssets`, and Backup v4 single-JSON base64 round trip under its 96 MiB guard. Keep v1-v3 frozen/importable.
- **Then — M14-F:** implement clipboard-paste and local-file image ingestion, inline object-URL previews, lifecycle/revocation, reorder/remove, Save/reopen/cancel, and legacy-reference compatibility in one normal Rich document UX. Do not add destination delivery.
- **Then — M14-G:** implement the behavioral Delivery Planner, typed outcomes, safe plain/HTML serializer, globally opt-in optional `clipboardWrite`/`offscreen` workflow, real copy plus user native paste, failure-safe compare-and-swap trigger cleanup, and real-Chrome Crisp validation. Never use clipboard read or synthetic paste.
- **Then — M14-H:** implement direct Rich DOM rendering and image delivery only for capabilities proven by browser/destination evidence. Preserve M13 direct insertion where reliable and never silently omit Rich content.
- Keep variables, arbitrary HTML/CSS, shared/global assets, non-image attachments, provider work, M15 screenshots, analytics, alternate triggers, cloud hosting, sync, and collaboration out of M14.

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

M13 is complete at `b76fcb4`/`9a3c7ef`. M14 is current under Decision 36 as partially superseded by Decision 37; M14-B is at `ed23f30`, M14-C at `a787100`, and M14-D is documentation-only. The next action is M14-E — Local Image Asset Foundation and Backup v4. M15 remains Multimodal Screenshot Context, M16 remains OpenAI Provider Expansion, and workflow polish and integrations remain later work.
