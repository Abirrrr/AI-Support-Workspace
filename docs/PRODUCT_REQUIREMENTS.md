# Product Requirements

## Product Scope

The product will eventually provide an integrated support workspace for Intercom users, combining local knowledge retrieval, reusable snippets, and AI-assisted drafting.

## Functional Requirements (Planned)

- Capture support context from the browser and local workspace.
- Store reusable knowledge entries locally as a Knowledge Library.
- Store reusable snippets locally as a Snippet Library.
- Expand an optional unique Snippet trigger into saved plain-text content in a supported focused web editor.
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

## Import / Export v1

- M12 provides manual local backup, recovery after reinstall or browser-data loss, and user-mediated transfer to another Chrome profile or computer. It does not provide cloud sync, collaboration, sharing, bulk editing, automatic backup, or scheduled backup.
- Export produces one JSON file with exact format identifier `ai-support-workspace-backup`, independently versioned `formatVersion: 1`, UTC `exportedAt`, and required Knowledge, Snippet, and Settings data. Database and application versions, physical table names, and the Settings record ID are not public backup data.
- Knowledge includes exactly `id`, `title`, `body`, `tags`, `createdAt`, `updatedAt`, and `source`; Snippets include exactly `id`, `title`, `content`, `tags`, `createdAt`, and `updatedAt`; Settings always includes exactly `defaultModel`, including `null` when no default is saved.
- Transient Merchant Context, Guidance, Output, Workspace model overrides, capture state, webpage or browser state, Ollama models or availability, secrets, credentials, M15 screenshots, M13 triggers, and M14 rich-Snippet content are excluded from frozen Backup Format v1.
- Export preserves all logical values, tag order, IDs, timestamps, and metadata, and orders each Library by `createdAt` then `id`, both ascending. The UTC download name is `ai-support-workspace-backup-YYYY-MM-DDTHH-mm-ssZ.json`.
- Import treats the file as untrusted and accepts it only after the complete strict version 1 contract, every domain value, dangerous-key exclusion, and duplicate-ID requirements pass. It never repairs a partially invalid backup and never writes before validation succeeds.
- Files above 25 MiB are rejected before import reading; export applies the same limit to serialized UTF-8 bytes. M12 adds no record-count, per-store, or field-length limit.
- Restore is replace-only and all-or-nothing across Knowledge, Snippets, and Settings. It preserves imported IDs and timestamps rather than applying normal create/update semantics. An imported `defaultModel: null` clears Settings; a valid backup with empty Libraries clears both current Libraries.
- Import / Export is the fourth section in the existing options page. Export uses one explicit button. Import uses one labelled JSON file input, preview, warning, acknowledgement checkbox, Restore button, Cancel, busy state, and accessible status; it provides no drag-and-drop, pasted JSON, merge control, per-Library restore, or raw JSON editor.
- The preview shows only filename, exported timestamp, Knowledge count, Snippet count, and saved model or `No saved default model`. It never displays Knowledge bodies, Snippet content, or a record diff.
- Restore warns `Restoring this backup will replace your current Knowledge, Snippets, and saved Settings.` and requires `I understand that my current local data will be replaced.` before the native Restore control becomes enabled.
- Success and failure feedback is safe and specific without raw parser or persistence details. A successful restore refreshes options-page-local Knowledge, Snippets, and Settings, but an already-mounted Side Panel does not live-sync; a recreated panel loads the restored default.
- The UI warns `Backup files may contain merchant knowledge, internal notes, and reusable support replies. Store them securely.` Backup files are unencrypted JSON; encryption, passwords, compression, ZIP, signing, cloud storage, scheduling, merge, selective restore, and future-domain support are deferred.
- M12 requires no manifest, permission, host, database schema, dependency, or configuration change. Database schema remains version 2.

## M13 — Snippet Trigger Expansion v1

- Every Snippet has `trigger: string | null`; existing Snippets remain valid with `null`.
- A blank Trigger field maps to `null`. A non-null trigger is 2–32 ASCII characters including the leading semicolon and, after lowercase canonicalization, must match `^;[a-z0-9]+(?:-[a-z0-9]+)*$`. Uppercase input is accepted and stored lowercase. Non-empty input is not trimmed; whitespace, underscores, consecutive or trailing hyphens, and other punctuation are rejected rather than repaired.
- Canonical triggers are unique. Create and edit provide inline format and duplicate feedback; editing or deleting a Snippet changes trigger availability immediately.
- Expansion occurs only for an actively focused supported editor with a collapsed caret. When the user types a complete trigger immediately after the start of the editor or whitespace and presses Space, the extension replaces exactly that trigger with the saved plain-text Snippet plus one ordinary space and places the caret after the inserted space.
- Partial triggers, missing triggers, selected text, composition input, pasted or programmatic text, triggers away from the caret, and trigger-shaped text without the required left boundary do not expand. Missing and unsupported cases preserve the host editor's normal Space behavior.
- V1 supports native `textarea`, free-form `input` elements whose type is absent, `text`, or `search`, and generic `contenteditable` editors on all normal HTTP and HTTPS websites. The content script matches exactly `http://*/*` and `https://*/*`; Chrome-protected, extension, file, and other non-HTTP(S) pages remain unsupported. Textarea and contenteditable support complete single-line and multiline Snippet content; contenteditable inserts only safe text nodes and `<br>` boundaries. Supported inputs may expand only Snippets containing no `\r` or `\n`. A multiline match in a single-line input must decline before preventing Space, leave the host value unchanged, and preserve normal Space behavior; content must never be flattened, truncated, normalized, or partially inserted to fit.
- Expansion preserves surrounding content and line breaks and inserts Snippet content only as text, never executable HTML. It produces the host's expected bubbling composed input notification, prevents recursion from inserted text, uses no clipboard, and never reads or logs unrelated editor content.
- Content-script event and editor integration must be safe across Chrome isolated worlds and iframe realms. It structurally validates the event-like boundary and detects supported DOM editors without requiring current-global constructor identity. Candidate inspection remains bounded to 32 trigger characters plus the left boundary; no full-editor scan, password or specialized input support, logging, telemetry, persistent catalog, network transmission, or provider transmission is allowed.
- A transient extension-owned trigger catalog supplies synchronous content-script lookup. Dexie remains the only persistent Snippet source of truth; content scripts never access it, and neither `chrome.storage` nor another persistent cache duplicates Snippet ownership. Each matched content-script frame maintains one long-lived typed `chrome.runtime.Port` and enables its cache only while that port is connected and a complete validated snapshot for the current worker epoch is installed. Invalidation and complete-snapshot messages travel in order through the port.
- Port disconnection immediately clears and disables the frame cache, and a disconnected frame cannot expand from its former snapshot. Reconnection requires a complete snapshot before expansion resumes. Worker restart creates a new epoch and older-epoch snapshots are rejected. Before Snippet create, edit, delete, import, or restore persistence, the coordinator invalidates every currently connected frame; success publishes one rebuilt complete snapshot, persistence failure republishes the unchanged snapshot, and publication failure leaves affected frames disabled until reconnect or successful refresh. Ordinary typing remains unchanged, with no durable queue, browser-storage catalog, polling loop, or per-keystroke service-worker lookup.
- M13 advances Dexie from version 2 to version 3 by adding optional physical `trigger` data and a unique `&trigger` index to `snippetEntries`. Triggerless records omit the indexed property physically and map to domain `null`; the forward-only migration preserves every existing record without data loss.
- New exports use strict Backup Format v2. Version 2 adds required `trigger: string | null` to every exact Snippet DTO. Version 1 remains frozen and importable; its Snippets restore with `trigger: null`, and preview warns that restored v1 Snippets will have no triggers. Both versions retain strict validation, explicit mapping, the 25 MiB guard, and atomic replacement of Knowledge, Snippets, and Settings.
- M13 adds no rich content, images, variables, AI-generated Snippets, provider behavior, Prompt Builder behavior, OpenAI, provider selection, cloud behavior, analytics, autocomplete, mobile support, or generalized browser automation.

## M14 — Rich Snippet Templates

M14 builds on the existing M13 Snippet aggregate, Library, trigger catalog, and editor adapters. Decision 39 cancels M14-F Unified Rich Editor Inline Image Authoring before implementation and establishes three separate product concepts: Plain/Rich Snippets for reusable text, Image Snippets for one reusable local image, and future M15 Context Images for generation input.

- Every Snippet retains its existing ID, title, tags, optional trigger, timestamps, CRUD behavior, and trigger uniqueness. There is one `SnippetEntry` aggregate, Library, repository, and trigger system.
- A Plain Snippet stores exact plain text. A Rich Snippet stores only portable formatted text: paragraphs, bold, italic, validated links, unordered lists, and ordered lists. New Rich authoring cannot add embedded local images.
- Rich lists are first-class project-owned blocks with `listType: 'unordered' | 'ordered'` and ordered items containing the existing text/link/bold/italic inline model. Nested lists, tasks, tables, HTML, CSS, and embeds are excluded.
- Deterministic list projection uses `- Item` for unordered items and one-based `1. Item` for ordered items, one newline between items, and the existing two-newline boundary between Rich blocks.
- An Image Snippet is a distinct `SnippetContent` variant with exactly one referenced, same-owner local `SnippetAsset`. It contains no text blocks, multiple images, gallery, caption/body combination, shared asset, or separate trigger syntax.
- The Library exposes only Text Snippet and Image Snippet authoring. New Text records are Rich by default and use a normal constrained WYSIWYG for paragraphs, line breaks, bold, italic, safe links, bullets, and numbering. Plain/Rich and internal blocks/segments are not user choices.
- Historical Plain remains readable as Text and is converted only on a successful Save through the Text editor. Untouched records are never bulk migrated. Legacy Rich image/reference records that cannot round-trip remain preserved read-only.
- Image Snippet authoring provides normal Snippet metadata, one paste/select target, local preview, replace, remove-before-Save, Save, Cancel, reopen, and Delete. Save requires exactly one validated image. Asset IDs, Blob, base64, and storage details are not user-facing.
- Direct user-initiated screenshot paste through `ClipboardEvent.clipboardData` is the primary authoring path and adds no clipboard permission. File selection is secondary. External clipboard delivery belongs to M14-I and is not part of authoring.
- Image ingestion accepts validated PNG, JPEG, or WebP up to 5 MiB and preserves the existing 20 MiB per-Snippet and 40 MiB project/profile aggregate limits. It reuses M14-E ownership, atomic persistence, rollback, and cascade-delete behavior.
- No general Image Library, image collection, cross-Snippet sharing, "Use as Context," cloud hosting, automatic upload, or remote URL fetching is introduced.
- Existing URL Image References remain valid legacy Rich content and are never fetched or automatically converted. Existing M14-E Rich local-image blocks remain preserved legacy compatibility data, importable through Backup v4 and fail-closed under Decision 38. No new block can be authored.
- There is no automatic legacy conversion. A later explicit conversion may be offered only when Rich content is exactly one valid local-image block with its one same-owner asset and no other block or asset. Mixed text/image records remain legacy Rich data without semantic loss.
- M14-E remains implemented at `1828f09`: `SnippetAsset`, PNG/JPEG/WebP validation, Dexie v5 `snippetAssets`, one-Snippet ownership, atomic transactions, Backup v4, canonical base64, and graph validation are retained and repurposed.
- Backup v4 remains frozen and importable. M14-G implements first-class list blocks, the minimal `ImageSnippetContent` discriminant, and one strict Backup Format v5 together to avoid consecutive list-only and image-only public formats. V1-v4 remain importable; restore remains atomic.
- Dexie remains physical version 5 because `SnippetContent` JSON is not indexed by discriminant or block type and no store/index shape changes. No version 6 migration is required.
- Image Snippets reuse existing trigger syntax and uniqueness. The future typed catalog carries text delivery data for text entries and only trigger/Snippet identity plus an image discriminator for image entries. Blob, base64, asset ID, and filename never enter frame snapshots.
- Until typed image delivery exists in M14-I, Image Snippets are omitted from the current plain catalog under Decision 39. Decision 38 separately continues to exclude legacy Rich local-image records. Unknown-trigger behavior preserves normal typing.
- Image delivery v1 retrieves and revalidates the one owned asset from Dexie only after activation, prepares a PNG image on the clipboard, removes the unchanged trigger only after copy success, reports `Image copied — press Ctrl+V`, and relies on the user's real native paste. Destination inline/attachment/message behavior is not promised.
- Image copy is opt-in through future optional `clipboardWrite` and `offscreen` permissions requested from an explanatory extension UI. `clipboardRead`, synthetic paste, fake keyboard events, upload-control reverse engineering, and silent permission prompts are prohibited.
- Permission denial, stale state, asset failure, PNG conversion failure, offscreen failure, or clipboard write failure preserves the trigger and surrounding content. Successful compare-and-swap cleanup removes the trigger plus activation space, leaves no placeholder or trailing U+0020, and collapses the caret at the removed range start.
- Rich browser delivery now targets paragraphs, bold, italic, links, and lists only. Safe direct insertion or minimal text/HTML clipboard assistance remains capability/evidence-driven. The unresolved Crisp direct Plain insertion behavior does not authorize a site-specific adapter by itself.
- Variables, merge fields, conditions, loops, scripting, arbitrary HTML/CSS, AI-generated content, page scraping, analytics, alternate triggers, collaboration, sync, provider changes, Context Images, and M15 implementation remain excluded.

Representative Image Snippet:

```text
Title: Limitation screenshot
Trigger: ;image-limitation
Image: one locally stored PNG/JPEG/WebP
```

Text plus an image intentionally uses two independent shortcuts, such as `;limitation-text` and `;image-limitation`.

## Future Workspace Shell Action UX

The current extension toolbar action opens the implemented popup. From there, Open Workspace opens the global AI Support Workspace Side Panel, while Open Libraries opens the existing full options page in a normal browser tab.

The approved future target is one step shorter: clicking the toolbar action opens or shows the existing global Workspace Side Panel directly, with no intermediate popup. The panel must expose a Library action that opens the existing options/Library page in a normal browser tab. Knowledge, Snippets, Settings, Import / Export, and future management workflows remain in the options page and must not be duplicated or moved wholesale into the panel.

Implementation must use Chrome's supported toolbar-action Side Panel behavior, preserve the existing `sidePanel` permission and global panel/keyboard-shortcut semantics, inspect WXT's generated manifest/action wiring, and retire the default popup cleanly so the action has no competing behaviors. No new permission is expected solely for this requirement. The work is an unassigned future Workspace Shell/extension-action UX item, not M14-G through M14-J, and it must not interrupt the approved Snippet roadmap.

## M15 — Multimodal Screenshot Context

Multimodal Screenshot Context is assigned to M15. This roadmap assignment does not define detailed architecture, reopen M9, or change the current text-only M9 implementation.

- Merchant Context should eventually accept ordinary text plus one or more pasted screenshots or other visual context assets. Text and images may appear together in the current Context workflow, including text before and after an image, with separate Guidance supplied for the task.
- A user should be able to paste screenshot or image clipboard content directly into Context without first saving every image to disk or uploading it to a cloud service. Exact browser clipboard mechanics remain future architecture work.
- A user should also be able to select a local screenshot/image for Context. The Context UI requires visible preview and removal before generation; one or multiple images may be approved by the detailed M15 architecture.
- The product direction is not limited to one image. Count, file-size, and format limits are deliberately unresolved.
- Attached images require a visible attachment indication, an appropriate preview, and removal before generation. Each image remains associated with the current Context workflow. Reordering is not yet approved or defined.
- Context images are transient and local-first by default. They belong to the current Workspace or generation session unless later persistence is explicitly approved.
- Multimodal Context remains provider-independent. Images should become generation context when the selected provider and model support image understanding, and unsupported images must never be silently discarded. The provider-capability contract and unsupported-image UX remain unresolved.
- Future `GenerationRequest` must carry project-owned image references/attachments rather than Image Snippet IDs or persistent asset ownership. Provider adapters must declare vision capability and return explicit unsupported behavior before a request can omit an image.

The intended workflow can interleave current-task text and visual context before separate Guidance:

```text
Merchant Context
Text
Screenshot
Following text
Guidance
```

Context images are generation inputs, not reusable response assets. They must remain conceptually distinct from future Snippet images even if later implementations can share low-level utilities.

## M16 — OpenAI Provider Expansion

OpenAI Provider Expansion is assigned to M16. It will add OpenAI behind the existing project-owned provider boundary and define provider selection when more than one provider exists. Credentials, endpoint and permission policy, model behavior, privacy, errors, and Settings changes remain unresolved until M16 architecture work.

## Deferred Future Architecture

M13 trigger architecture and M14 structured-text architecture are defined above. Decision 39 preserves Decision 37's implemented binary foundation while moving reusable-image authoring and delivery to one-image Image Snippets. Future reviews must still define rich-to-plain conversion or variables; M15 multimodal screenshot/provider capability details; and M16 OpenAI credentials, provider selection, permissions, models, errors, and privacy.

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
