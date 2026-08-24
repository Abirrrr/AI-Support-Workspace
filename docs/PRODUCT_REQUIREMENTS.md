# Product Requirements

## Product Scope

The product provides a local-first support workspace with reusable Snippet delivery and AI-assisted drafting. The current implementation still includes Knowledge and Snippet Libraries. The approved future drafting experience makes Text Snippets the sole active user-managed AI reference library while retaining the underlying Knowledge implementation for compatibility until a separate cleanup/migration is approved.

## Functional Requirements (Planned)

- Capture support context from the browser and local workspace.
- Preserve currently implemented Knowledge records locally for compatibility; retire the Knowledge Library from the future active AI workflow/UI only after a separately approved implementation task.
- Store reusable snippets locally as a Snippet Library.
- Prepare a triggered Text or Image Snippet on the clipboard, remove only the unchanged trigger after confirmed copy, and let the user insert it with native Ctrl+V in a supported focused web editor.
- Retrieve relevant content quickly during support work.
- Build prompts for AI assistance without coupling business logic to a specific provider.
- Allow users to review and edit AI-generated drafts before use.

## Current Knowledge Compatibility vs. Future Active Text Snippet Library

- Current implementation: Knowledge and Snippet remain separate persisted domains, repositories, Backup data, options-page surfaces, retrieval collections, and Prompt Builder sections.
- Approved future active product: Text Snippets are the sole user-managed AI reference library and may provide relevant support information, phrasing, response patterns, prior examples, and workflow/reference wording.
- The Knowledge Library retires from the future active AI workflow/UI, but its domain, Dexie data/store, repository interfaces, Backup compatibility, and tests are not deleted or migrated by M14-K.4. Permanent removal requires a separate approved cleanup/migration task.
- Image Snippets remain reusable delivery assets and are excluded from AI retrieval/reference content.

## Future AI Drafting Semantics

- The user-facing field is **Guidance / Gist**. It is optional request-specific direction, not a complete-prompt requirement. Minimal Gist such as `follow up`, `keep it short`, or `ask for the URL` is valid.
- Merchant Context is optional. With Context and no Gist, Generate infers that a sensible response is required. With Gist and no Context, Generate drafts directly from the Gist. When both are present, Gist controls the current requested action/presentation and Context supplies current-case facts.
- Generate is enabled for Context-only, Gist-only, or Context-plus-Gist. It is disabled only when both are empty.
- Application-owned default drafting instructions always apply; users need not repeat them.
- Product authority is `Safety/application rules → current Guidance / Gist → Merchant Context factual grounding → relevant Text Snippet reference material → default drafting behavior`.
- Guidance / Gist controls intent, action, length, structure, tone modification, and drafting direction, but does not authorize invented facts contradicted or unsupported by Merchant Context.
- Retrieved Text Snippets are reference/evidence, not current instructions. They never override Gist, Context facts, or safety rules, and must not introduce unsupported case-specific facts.
- Current Prompt Builder v1 remains implemented with separate Knowledge/Snippet inputs until a future versioned application-contract change implements this product direction.

## Future Compact AI Workspace

- Order: Merchant Context, compact Context Image attachments when present, Guidance / Gist, one horizontal `[Model dropdown] [Generate]` row, then Generated Output with Copy on the same output-header row.
- Merchant Context and Guidance / Gist begin approximately one visual line high, auto-grow to a sensible maximum, then scroll internally. Context remains multiline-capable and accepts pasted text.
- Merchant Context accepts removable request-scoped Context Images. They are transient multimodal AI input, not Image Snippets, Knowledge records, or permanent Library records. Provider translation and any workspace-continuity lifetime belong to future M15 architecture.
- Guidance / Gist v1 accepts text only.
- Model is a compact provider-independent dropdown. Discovery and selection belong behind project-owned provider/application boundaries, not Ollama-specific Workspace logic.
- Generated Output remains editable and persists while the user changes Context/Gist and regenerates. Generation does not clear inputs. Copy remains; no direct Insert/Paste action is approved.
- Permanent intro/helper copy, redundant headings, and Ollama installation guidance leave the primary drafting surface; configuration/troubleshooting stays elsewhere.

## Future Snippet Hardening

- M14-L/L.1 assigns implementation-ready architecture to M14-M.0 through M14-P; it implements nothing. Decisions 50–53 are Principal-approved in substance and Decision 54 remains intact. Current Dexie v5, Backup v6, permissions, Settings, tags, delivery, and retrieval remain unchanged.
- Lightweight `usageCount` / `lastUsedAt` applies to Text and Image Snippets. One use means authoritative clipboard preparation plus successful exact trigger cleanup, regardless of later automatic-paste outcome or whether manual `Ctrl+V` occurs. Retrieval, viewing/editing, backup, failed activation/copy/cleanup, and unknown triggers do not count. A one-use receipt and separate sidecar write make persistence best-effort and non-blocking.
- Automatic Backup exposes `Off | Daily | Weekly`, with Weekly recommended/default, and `Backup Location: Choose folder...`. Folder authorization is an explicit user gesture. Scheduled backup reuses that authorized directory only while read/write permission remains granted; otherwise it stays operationally inactive, fails safely, reports `Backup location needs attention`, and preserves manual Export.
- Automatic output uses the same canonical Backup v7 construction as manual export. It never silently falls back to Downloads or prompts from a service worker. `alarms` is the only new Chrome permission approved for future M14-N; File System Access uses user-granted directory authority and `downloads` is not approved.
- Weekly retention keeps exactly the latest four successful verified managed backups, ordered by `createdAt` then `backupId`. A new backup must be closed and reverified before any deletion. Only manifest-originated files whose directory identity, exact Backup v7 ownership metadata, byte length, and SHA-256 digest all match may be deleted. Unrelated, manual, moved, replaced, or unverifiable files remain untouched; a proof/removal failure leaves safe extras and a warning rather than risking another file.
- Daily retention keeps exactly the latest seven successful verified managed backups under the same success-first and deterministic ownership-proof rules as Weekly's latest four. Proof/deletion uncertainty may leave safe extras and must never delete an unrelated file.
- M14-M.0 is PASS / REAL-CHROME VALIDATED: scratch persistence proved picker, handle, permission, restart, background reuse, exact-file lifecycle/removal, and unavailable-location safety without `alarms`/`downloads`. M14-M.1 is unblocked for separate Principal authorization but remains unimplemented. M14-N must revalidate the final production adapter and prove different-folder identity before retention relies on it.
- Backup v7 carries preferred cadence but never directory authority. Restored Daily/Weekly with no locally authorized folder remains inactive, never prompts or rapidly retries from background, reports location attention, and keeps manual Export available. Explicit folder authorization activates scheduling with that restored cadence; restored Off remains inactive without requiring location attention.
- Generated tags apply only to Text Snippets, remain separate from authored ordered tags, and are non-authoritative. Tag generation runs after authored Save through the provider-independent `GenerationProvider` boundary and configured-model resolver; it never blocks or rolls back Save and never guesses or installs a model.
- Generated input is limited to title/rendered Text/authored tags and capped at 64 KiB UTF-8; oversized input skips generation without affecting Save. Output is an exact bounded JSON array: at most eight unique normalized plain-string tags, each 1–40 Unicode code points, with a 4 KiB raw response limit and fail-closed validation. No raw response, prompt, or Snippet content is logged or persisted.
- Future deterministic retrieval preserves title/authored-tag/content weights and adds fingerprint-valid generated tags only at the lowest weight. Usage and recency remain outside retrieval in this package, so popularity cannot dominate relevance. Knowledge and Prompt Builder v1 remain unchanged until M15.

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

- M12 provides the current manual local backup, recovery after reinstall or browser-data loss, and user-mediated transfer to another Chrome profile or computer. M12 itself does not provide cloud sync, collaboration, sharing, bulk editing, automatic backup, or scheduled backup. Decision 48 separately approves future periodic local backup through the same canonical format.
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
- Direct user-initiated screenshot paste through `ClipboardEvent.clipboardData` is the primary authoring path and adds no clipboard permission. File selection is secondary. M14-I external clipboard delivery is a separate explicitly enabled capability.
- Image ingestion accepts validated PNG, JPEG, or WebP up to 5 MiB and preserves the existing 20 MiB per-Snippet and 40 MiB project/profile aggregate limits. It reuses M14-E ownership, atomic persistence, rollback, and cascade-delete behavior.
- No general Image Library, image collection, cross-Snippet sharing, "Use as Context," cloud hosting, automatic upload, or remote URL fetching is introduced.
- Existing URL Image References remain valid legacy Rich content and are never fetched or automatically converted. Existing M14-E Rich local-image blocks remain preserved legacy compatibility data, importable through Backup v4 and fail-closed under Decision 38. No new block can be authored.
- There is no automatic legacy conversion. A later explicit conversion may be offered only when Rich content is exactly one valid local-image block with its one same-owner asset and no other block or asset. Mixed text/image records remain legacy Rich data without semantic loss.
- M14-E remains implemented at `1828f09`: `SnippetAsset`, PNG/JPEG/WebP validation, Dexie v5 `snippetAssets`, one-Snippet ownership, atomic transactions, Backup v4, canonical base64, and graph validation are retained and repurposed.
- Backup v4 remains frozen and importable. M14-G implements first-class list blocks, the minimal `ImageSnippetContent` discriminant, and one strict Backup Format v5 together to avoid consecutive list-only and image-only public formats. V1-v4 remain importable; restore remains atomic.
- Dexie remains physical version 5 because `SnippetContent` JSON is not indexed by discriminant or block type and no store/index shape changes. No version 6 migration is required.
- Image Snippets reuse existing trigger syntax and uniqueness. The implemented typed catalog carries only delivery kind, trigger, and Snippet ID for both Text and Image entries. Snippet content, generated HTML, Blob, base64, asset ID, filename, MIME type, and image bytes never enter frame snapshots.
- M14-I publishes Image Snippets through metadata-only typed catalog entries. Decision 38 separately continues to exclude legacy Rich local-image records. Unknown-trigger behavior preserves normal typing.
- Image delivery v1 retrieves and revalidates the one owned asset from Dexie only after activation, prepares a PNG image on the clipboard, removes the unchanged trigger only after copy success, reports `Image copied — press Ctrl+V`, and relies on the user's real native paste. Destination inline/attachment/message behavior is not promised.
- Existing browser Text clipboard delivery is opt-in through optional `clipboardWrite` and `offscreen`. Windows native Image delivery additionally uses optional `nativeMessaging`, requested only from its explanatory Settings user gesture. Text remains independent and does not require or launch the companion. `clipboardRead`, synthetic paste, fake keyboard events, upload-control reverse engineering, and silent permission prompts are prohibited.
- A fully accepted trigger consumes its Space synchronously before asynchronous delivery. Permission denial, stale state, asset failure, PNG conversion failure, Text offscreen failure, or native Image clipboard failure preserves the trigger and surrounding content and produces no copied-success notice; the consumed activation command is not replayed. Successful compare-and-swap cleanup removes only the trigger from the no-inserted-Space state, leaves no placeholder or trailing U+0020, and collapses the caret at the removed range start.
- Rich browser delivery prepares safe project-owned `text/html` plus deterministic `text/plain` for paragraphs, bold, italic, links, and lists. Native paste is the implemented base path; destination-specific compatibility corrections require evidence. The unresolved Crisp direct Plain insertion behavior does not authorize a site-specific adapter by itself.
- Variables, merge fields, conditions, loops, scripting, arbitrary HTML/CSS, AI-generated content, page scraping, analytics, alternate triggers, collaboration, sync, provider changes, Context Images, and M15 implementation remain excluded.
- Deliverable Text and Image Snippets use one typed trigger-to-clipboard planner. Catalog snapshots expose only delivery kind, trigger, and Snippet ID; content, HTML, Blob, base64, asset IDs, filenames, MIME types, and binary bytes remain out of page frames.
- Text clipboard delivery includes deterministic `text/plain` and safe project-owned `text/html` for paragraphs, line breaks, bold, italic, validated links, bullets, and numbering. It never serializes stored HTML or Tiptap runtime state.
- Image clipboard delivery loads the authoritative same-owner asset after activation and prepares validated PNG bytes. JPEG/WebP require genuine decode and PNG re-encode after Decision 42 metadata and allocation guards; animated WebP and oversized images fail closed.
- Browser Text clipboard delivery is explicitly enabled in Settings through optional `clipboardWrite` and `offscreen`; Windows native Image delivery independently requires optional `nativeMessaging`. Trigger typing never requests permission. Exact correlated clipboard success must precede compare-and-swap cleanup; failure preserves page content. The user performs the real Ctrl+V.
- Manual native `Ctrl+V` after successful clipboard preparation and trigger cleanup is accepted for the current product version. Automatic paste is not a current M14 requirement.
- Real Chrome validates Text clipboard preparation, cleanup, copied notice, and native-paste fidelity for bold, italic, links, bullet lists, and numbered lists. Text normally uses the offscreen `copy` event plus `document.execCommand('copy')` with exact `text/plain` and safe `text/html`, not `navigator.clipboard.write()`.
- Historical browser Image evidence remains: offscreen Async Clipboard failed with `clipboard-write-failed`; M14-I.1.4 pasted `snippet.png`; focused-content A1 pasted `TEXT`; and focused extension-page B pasted `VISIBLE IMAGE` but required unacceptable focus-stealing UX. M14-I.5 removes all of those mechanisms and probes from active runtime.
- M14-I.2 / Decision 43 defines the optional Windows Native Clipboard Companion architecture. The service worker may send only one strict, bounded, request-scoped Decision 42-safe PNG to a separately installed exact-origin host. Native success requires registered `PNG` plus `CF_DIBV5` to be prepared through the complete Win32 clipboard sequence before cleanup. The host accepts no arbitrary commands, paths, URLs, files, HTML, Snippet/page metadata, network operation, or temporary image staging. M14-K.2 preserves this protocol-v1 Image behavior.
- M14-K.2 implements Decision 45's additive Windows automatic-paste mode. `clipboard-only` is the default and permanent manual `Ctrl+V` workflow; `automatic` is explicit opt-in. Both Text and Image require authoritative clipboard success, exact cleanup, one-use editor/sender/tab/window authorization, unchanged native foreground/PID/clipboard context, and safe modifier state before at most one Ctrl+V input attempt. The clipboard is never cleared, uncertain results are never retried, and every safe decline after clipboard success retains manual paste fallback. No destination-specific behavior, arbitrary send-keys, focus stealing, keyboard hook, AutoHotkey, elevation, telemetry, or non-Windows host is permitted.
- M14-I.3/M14-I.3.1 implement the standalone C#/.NET 10 Windows native-host foundation, strict v1, WIC, and registered PNG + CF_DIBV5 clipboard machinery. M14-I.4/M14-I.4.1 implement the development Chrome integration and corrected capability status: stable dev identity, optional `nativeMessaging`, Settings readiness, validated one-shot service-worker requests, exact `.dev` manifest, and reversible HKCU registration. Real Chrome validates Settings `Ready`, complete Image preparation/manual paste, and M14-K automatic Text/Image paste in Intercom and Crisp. M14-I.5 leaves the Windows native companion as the only normal Windows Image path with no browser fallback. No production installer, production identity/registration, signing, updater, version-migration workflow, or AutoHotkey dependency exists; those distribution items are separate future work and do not block local/development closeout.

Representative Image Snippet:

```text
Title: Limitation screenshot
Trigger: ;image-limitation
Image: one locally stored PNG/JPEG/WebP
```

Text plus an image intentionally uses two independent shortcuts, such as `;limitation-text` and `;image-limitation`.

## Future Workspace Shell Action UX

The current extension toolbar action opens the implemented popup. From there, Open Workspace opens the global AI Support Workspace Side Panel, while Open Libraries opens the existing full options page in a normal browser tab.

The approved future target is one step shorter: clicking the toolbar action opens/toggles the existing global Workspace Side Panel directly, with no intermediate popup. A compact Settings gear in the Side Panel title row opens the existing Options / Libraries page. Knowledge compatibility, Text/Image Snippets, Settings, Import / Export, automatic-backup configuration, paste behavior, model/provider settings, and future management workflows remain in Options and must not be duplicated or moved wholesale into the panel. V1 has no large **Open Libraries** panel row and no Settings dropdown/menu.

M15 implementation must use `chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true})`, preserve the existing `sidePanel` permission and global panel/keyboard-shortcut semantics, inspect WXT's generated manifest/action wiring, and retire `action.default_popup` plus the popup entry point cleanly while preserving a popup-free toolbar action. The Settings gear uses `chrome.runtime.openOptionsPage()`, is keyboard-operable with the accessible name `Open Settings and Libraries`, and needs no new permission. M14-L implements none of this.

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
