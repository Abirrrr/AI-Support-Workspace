# Backlog

## Near-Term Backlog

- Establish the technical foundation and automated validation baseline.
- Create the initial extension shell and manifest.
- Add a local storage layer for knowledge and snippets.
- Implement a small retrieval engine with local search.
- Introduce a provider abstraction for Ollama and later OpenAI.
- Create a simple output workspace for reviewing generated content.

## Future Considerations

- Implement the approved M12 Import / Export architecture only through the unstarted M12-D implementation task after the M12-C documentation checkpoint is approved.
- Preserve the application-owned backup format independently from Dexie schema versioning; future format evolution must not silently redefine format version 1.
- Reconsider provider endpoint configuration only with provider expansion or a dedicated security and permissions architecture review.
- Consider persistent Prompt Profiles or writing preferences only through a separate product and precedence decision; they are not M11 behavior tuning.
- Refine the UI around Intercom support workflows.
- Evaluate prompt and local-model quality improvements for cases where generated wording implies unsupported commitments or timelines despite contrary Guidance.
- Expand testing coverage as implementation matures.
- Continue generic quality, usability, performance, and documentation polish as ongoing backlog work rather than a separately assigned M14 capability.
- Consider merge import, selective import/export, encrypted backup, compression, backup history, or scheduling only through separate future product and architecture decisions; none is part of M12.

## Approved Future Capabilities

### M14 — Multimodal Context Attachments

- Extend Merchant Context beyond ordinary text to one or more screenshots or visual context assets for AI generation when the selected provider and model support image understanding.
- Allow direct screenshot/image clipboard paste without requiring a disk save or cloud upload first.
- Provide visible attachment indication, appropriate preview, and removal before generation. Image reordering remains unresolved.
- Keep Context images transient and local-first by default; no persistence or image table is currently approved.
- Preserve provider independence through a future capability boundary and never silently discard images when a provider is text-only.
- Defer image representation, unsupported-provider UX details, count/size/format limits, persistence, Prompt Builder changes, provider serialization, and implementation tasks to future M14 architecture work.

### M15 — Rich Snippet Templates & Trigger Expansion

- Add a future Shortcut or Trigger field with semicolon-style expansion such as `;hello`, `;refund`, or `;shopify-limit`.
- Keep Snippet triggers separate from M10 application keyboard shortcuts.
- Support ordered structured content such as text → image/reference → following text, with later support for appropriate paragraphs, links, emphasis, and images.
- Preserve the image/reference's semantic position. Rich editors may receive inline rich content; plain-text editors require a deterministic positional link/reference fallback and explicit handling for local assets without public URLs.
- Introduce a future expansion engine and focused editor-adapter capability boundary for textarea/input, `contenteditable`, and genuinely required destination-specific rich editors.
- Preserve surrounding content, define the exact replacement range and post-expansion caret position, and fail safely in unsupported editors.

- Keep existing plain-text Snippets valid and define backward compatibility before any future storage migration.
- Defer schema, image representation, reusable asset ownership, trigger validation and uniqueness, database migration, rich content model, editor compatibility, insertion mechanics, fallback syntax, and implementation tasks to future M15 architecture work.

### Chrome Side Panel Focus Activation

- Activate/focus an already-visible Chrome Side Panel after shortcut capture when Chrome exposes a supported API.
- This capability is unassigned, has no milestone, and does not authorize M10 retries, delays, polling, panel close/reopen, toggle behavior, broader permissions, persistence, notifications, or alternate tab or window workarounds.

Context screenshots and Snippet images remain separate domains: Context images are transient inputs to generation, while Snippet images are reusable Library-owned response content for editor expansion.

## Notes

M12 remains Import / Export, M13 remains provider expansion, Multimodal Context Attachments is assigned to M14, and Rich Snippet Templates & Trigger Expansion is assigned to M15. These assignments do not alter M9, M10, or M11 and do not authorize implementation before the applicable milestone architecture is defined.
