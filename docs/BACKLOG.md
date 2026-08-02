# Backlog

## Near-Term Backlog

- Establish the technical foundation and automated validation baseline.
- Create the initial extension shell and manifest.
- Add a local storage layer for knowledge and snippets.
- Implement a small retrieval engine with local search.
- Introduce a provider abstraction for Ollama and later OpenAI.
- Create a simple output workspace for reviewing generated content.

## Future Considerations

- Preserve the completed M12 backup and restore guarantees while M13 evolves Snippets and Backup Format v2.
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

- Build on the M13 optional-trigger and plain-text expansion foundation without redefining its canonical trigger or editor-adapter contracts unnecessarily.
- Support ordered structured content such as text → image/reference → following text, with later support for appropriate paragraphs, links, emphasis, and images.
- Preserve the image/reference's semantic position. Rich editors may receive inline rich content; plain-text editors require a deterministic positional link/reference fallback and explicit handling for local assets without public URLs.
- Keep existing plain-text Snippets valid and define backward compatibility before any future storage migration.
- Defer rich schema, image representation, reusable asset ownership, rich-editor serialization, fallback syntax, and implementation tasks to future M14 architecture work.

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

M13 is Snippet Trigger Expansion v1, M14 is Rich Snippet Templates, M15 is Multimodal Screenshot Context, and M16 is OpenAI Provider Expansion. Workflow polish and additional integrations remain later work. The original unstarted M13-A OpenAI readiness review was superseded by this priority order. M13-A.1 architecture is complete and Principal Engineer approved; M13-B — Snippet Trigger Expansion Implementation is active but has not started, and no M13 source implementation exists yet.
