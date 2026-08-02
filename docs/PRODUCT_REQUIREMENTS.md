# Product Requirements

## Product Scope

The product will eventually provide an integrated support workspace for Intercom users, combining local knowledge retrieval, reusable snippets, and AI-assisted drafting.

## Functional Requirements (Planned)

- Capture support context from the browser and local workspace.
- Store reusable knowledge entries locally as a Knowledge Library.
- Store reusable snippets locally as a Snippet Library.
- Retrieve relevant content quickly during support work.
- Build prompts for AI assistance without coupling business logic to a specific provider.
- Allow users to review and edit AI-generated drafts before use.

## Knowledge Library vs. Snippet Library

- The Knowledge Library owns broader, contextual support knowledge used for troubleshooting, reference, and retrieval during support work.
- The Snippet Library owns compact, reusable response content and message fragments intended for quick insertion or expansion into a reply. The current implementation is plain text; the approved future rich-Snippet direction may add ordered structured content after architecture and migration review.

The libraries may both contribute to a support response, but they have different responsibilities and must remain separate concepts in the product experience, persistence model, and documentation.

## Prompt Composition Semantics

- Prompt composition accepts Merchant Context, explicit Guidance, or both as the current-task input. At least one must contain non-whitespace text; retrieved Library material alone cannot define the user's task.
- Guidance is the user's highest-priority current instruction. Any non-whitespace Guidance is valid, including a minimal instruction such as `follow up`.
- Merchant Context represents the current support conversation or situation and takes priority over retrieved Library material.
- Retrieved Knowledge is supporting factual or reference material. Retrieved Snippets are lower-priority reusable wording, style, or examples and are not instructions or independent factual authority.
- Dynamic input conflicts follow `Guidance > Merchant Context > Knowledge > Snippets`.
- Prompt composition produces a structured provider-independent assembly. Provider selection, provider serialization, and AI execution occur outside this product boundary.
- Images and screenshots are not Prompt Builder v1 inputs. Multimodal Context Attachments are an approved future product direction, but their Prompt Builder, provider-capability, serialization, and runtime architecture remains deferred.

## Output Workspace v1

- M9 provides one extension-owned global Chrome Side Panel Workspace for manual Merchant Context, manual Guidance, a transient Ollama model value, generation, editable plain-text output, and copying the current edited draft while the user keeps the active support website visible beside it.
- At least one of Merchant Context or Guidance plus a non-whitespace model is required. Inputs and output remain transient for the mounted Workspace session and are lost on close or reload.
- Generate automatically runs local Knowledge and Snippet retrieval, Prompt Builder, and the current `GenerationProvider` once. A later Generate action repeats the complete workflow with current inputs.
- The generated draft remains editable before copying. Copy uses the current edited text and preserves it exactly.
- The popup opens the global Workspace Side Panel in the current browser window and continues to open the separate options-page Libraries. Knowledge and Snippet CRUD do not move into the Side Panel.
- M9 does not include a standalone Workspace tab, manual Library selection, dedicated Regenerate, Cancel, Clear, Save as Snippet, history, persistence, Settings, provider selection, model discovery, keyboard shortcuts, page scraping, or insertion.

## Selected-Text Keyboard Command v1

- M10 provides exactly one browser-scoped Chrome command that initiates capture of explicitly selected text from the active normal webpage, then immediately opens or activates the existing global Workspace Side Panel without awaiting capture completion.
- A successful capture replaces Merchant Context exactly, preserves Guidance, requests Guidance DOM focus with a collapsed caret at the end of its existing value without selecting or modifying that text, and leaves Generate manual. Merchant Context does not receive requested final DOM focus.
- When the command opens a closed Side Panel, Guidance must be immediately usable for typing. When the Side Panel is already visible and the webpage owns keyboard focus, the extension must still issue the Guidance focus and collapsed end-caret request, but Chrome may keep keyboard input routed to the webpage; the user may need to click Guidance.
- The already-visible-panel behavior is a Chrome platform limitation, not authorization for focus retries, delays, polling, panel close/reopen or toggle behavior, broader permissions, persistence, notifications, or alternate tab or window surfaces.
- Guidance, the transient model, generated or edited Output, and any active generation request remain unchanged. The captured Context applies only to later Generate actions and never triggers generation automatically.
- Selection is active-tab, main-frame, text-only, and explicit. A focused textarea or text-capable input selection takes precedence over ordinary document selection; surrounding page content, conversation structure, cross-origin frames, and screenshots are not captured.
- Empty or unavailable selection never replaces Context or forces Guidance focus. The Side Panel provides safe selection or copy-and-paste guidance where it can open, without exposing raw Chrome errors or requesting permanent support-site access.
- The suggested shortcut is `Ctrl+Shift+Space` by default and `Command+Shift+Space` on macOS. Chrome's native extension shortcut manager owns remapping, collision handling, and unassigned commands; M10 adds no in-app shortcut editor or Settings persistence.
- M10 adds no Generate shortcut, Copy shortcut, toggle command, OS-global behavior, persistent Workspace state, Snippet expansion, or multimodal capture.

## Settings v1

- M11 provides one Settings section in the existing options-page experience. Its only configurable value is `defaultModel: string | null`, representing an optional saved default Ollama model for the current Chrome browser profile.
- The initial application default is `null`. No model is selected automatically, and example or placeholder text such as `qwen2.5:7b` is not persisted or treated as a default.
- Saving trims leading and trailing whitespace. Non-empty trimmed text is stored as an opaque Ollama model identifier; empty or whitespace-only input clears the saved default to `null`. Saving performs no model discovery, model pull, health check, or availability request.
- A new Workspace Side Panel session loads Settings once and initializes its transient model field from the saved value. Missing Settings or `null` initializes blank. A load failure also initializes blank and provides safe non-blocking feedback while keeping Workspace usable.
- Workspace model edits remain transient, do not update Settings, and are used by the next Generate action. Closing and reopening the Side Panel reloads the latest saved default. An already-mounted panel does not live-sync Settings changes.
- Settings are local and extension-wide within the current Chrome profile. M11 persists them through a typed project-owned boundary backed by one Dexie singleton record and a version 2 schema migration that preserves all Knowledge and Snippet data.
- M11 includes no provider selector, configurable endpoint, remote or LAN Ollama, OpenAI, credentials, model discovery, generation tuning, writing preferences, editable grounding instructions, theme, shortcut setting, Workspace persistence, history, reset, import, or export.
- The existing provider boundary, fixed `http://localhost:11434` endpoint, Chrome-native shortcut management, popup behavior, M9 Workspace behavior, M10 capture behavior, and manifest permissions remain unchanged.

## M14 — Multimodal Context Attachments

Multimodal Context Attachments are assigned to M14. This roadmap assignment does not define detailed architecture, reopen M9, or change the current text-only M9 implementation.

- Merchant Context should eventually accept ordinary text plus one or more pasted screenshots or other visual context assets. Text and images may appear together in the current Context workflow, including text before and after an image, with separate Guidance supplied for the task.
- A user should be able to paste screenshot or image clipboard content directly into Context without first saving every image to disk or uploading it to a cloud service. Exact browser clipboard mechanics remain future architecture work.
- The product direction is not limited to one image. Count, file-size, and format limits are deliberately unresolved.
- Attached images require a visible attachment indication, an appropriate preview, and removal before generation. Each image remains associated with the current Context workflow. Reordering is not yet approved or defined.
- Context images are transient and local-first by default. They belong to the current Workspace or generation session unless later persistence is explicitly approved.
- Multimodal Context remains provider-independent. Images should become generation context when the selected provider and model support image understanding, and unsupported images must never be silently discarded. The provider-capability contract and unsupported-image UX remain unresolved.

The intended workflow can interleave current-task text and visual context before separate Guidance:

```text
Merchant Context
Text
Screenshot
Following text
Guidance
```

Context images are generation inputs, not reusable response assets. They must remain conceptually distinct from future Snippet images even if later implementations can share low-level utilities.

## M15 — Rich Snippet Templates & Trigger Expansion

Rich Snippet Templates & Trigger Expansion is assigned to M15 as a separate approved future product direction. This roadmap assignment does not define detailed architecture.

- Snippets should eventually expose a Shortcut or Trigger field for text-expansion triggers such as `;hello`, `;refund`, `;shipping`, or `;shopify-limit`.
- Typing a configured trigger in a supported support editor should replace the trigger range with the associated saved Snippet content.
- Snippet triggers are not Milestone 10 keyboard shortcuts. M10 concerns application-level key combinations that invoke extension behavior; a Snippet trigger is typed text such as `;hello` that expands inside an editor.
- Trigger uniqueness, case sensitivity, permitted characters, maximum length, and exact validation remain unresolved.
- Future Snippets should support an ordered sequence of structured blocks, including paragraphs, links, emphasis, images or image references, and later supported block types. A sequence such as text → image/reference → following text must retain that exact semantic order.
- Image representation may later use a local reusable asset, structured reference, or appropriate URL. The final storage representation and asset ownership are unresolved, and arbitrary executable HTML is not an approved content model.
- Expansion must be target-aware. A focused expansion boundary should adapt structured content to plain text inputs, `contenteditable` surfaces, or genuinely necessary destination-specific rich editors without spreading DOM behavior through business logic.
- Rich editors should receive rich text and inline images where supported. Plain-text editors require a deterministic safe fallback that preserves every image/reference's semantic position and uses a usable link or reference when available. Behavior for local assets without public URLs remains unresolved; images must not silently disappear.
- Expansion must preserve surrounding editor content, replace only the intended trigger range, place the caret predictably after expansion, and handle unsupported editors safely.
- Existing plain-text Snippets remain valid product data. Future architecture must define backward compatibility and any required migration before changing persistence.

Representative behavior-only example:

```text
Title: Shopify ecosystem limitation
Shortcut: ;shopify-limit

Text: Thank you for reaching out.
Text: This is a limitation of the Shopify ecosystem.
Image: [reference to explanatory screenshot]
Text: Here is what I recommend doing instead...
```

In a supported rich editor, `;shopify-limit` expands to the ordered text, inline screenshot, and following text. A conceptual plain-text fallback retains the same position:

```text
Thank you for reaching out.

This is a limitation of the Shopify ecosystem.

[Screenshot/reference: usable future link or reference]

Here is what I recommend doing instead...
```

The exact fallback syntax is not frozen, and local assets without a usable public URL require an explicit future decision. The wording above is illustrative rather than shipped product content.

## Deferred Future Architecture

This documentation approves product direction only. Future architecture reviews must still define multimodal image representation, provider capability interfaces, unsupported-provider UX, limits, persistence, and provider serialization; and rich-Snippet schema, trigger validation, database migration, content model, reusable asset ownership, expansion engine, editor adapters, insertion mechanics, caret behavior, destination compatibility, and local-asset fallback.

## Quality Requirements

- Fast startup and responsive interactions are required.
- The product must work without a backend service.
- The architecture should remain simple enough to maintain over time.
- Local persistence must be reliable and understandable.

## Constraints

- The first implementation path should prioritize local-first execution.
- The extension should be usable in a browser context without a hosted service.
- Any AI integration should be introduced gradually and behind a provider abstraction.

## Approved Platform Constraints

- The Chrome extension platform is WXT targeting Manifest V3, using TypeScript.
- The presentation layer uses React, Tailwind CSS, and React Context with Hooks.
- Local persistence uses Dexie behind project-owned storage contracts.
- Infrastructure choices must not couple product requirements or business logic to a specific AI provider.

## Scope for Milestone 0

Milestone 0 established the repository documentation, engineering workflow, and project guardrails. It did not implement any of the features above.
