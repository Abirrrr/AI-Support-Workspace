# UI Workflow

## 1. Purpose

This document describes the planned user workflows for the application from the user’s perspective. It is not a UI mockup and it is not a design specification. Its purpose is to define how a person moves through the product so that future implementation work can follow a consistent and documented experience.

This document is intentionally implementation-independent and should be read alongside the product vision, requirements, architecture, and engineering principles.

## 2. Primary Navigation

The product is organized around a small set of top-level areas:

- Support
- Knowledge Library
- Snippets
- Settings
- Import / Export

These areas represent the primary navigation for the application.

Future functionality may be introduced later, but any additional navigation areas should be treated as future workflows rather than part of the current documented experience.

## 3. Support Workspace Workflow

The Support experience is the primary workflow for day-to-day assistance work.

```text
Open Extension

↓

Support Workspace

↓

Merchant Context

↓

Paste Images (optional)

↓

Gist / Guidance (optional)

↓

Retrieve Local Knowledge

↓

Generate

↓

Editable Output

↓

Copy Reply

↓

Save as Knowledge (optional)

↓

Save as Snippet (optional)
```

### Workflow Notes

- The user begins in a support-oriented workspace that is designed for speed and clarity.
- Merchant context is the central input for the support task.
- Images and guidance may be added when useful, but they remain optional.
- The approved future Multimodal Context direction allows one or more screenshots or images to be pasted directly from the clipboard into the current Context alongside text. Attachments should be visible, previewable where appropriate, and removable before generation; reordering remains unresolved.
- Future Context images are transient by default and flow to AI generation only through a provider-independent capability boundary. Unsupported images must not be silently discarded.
- The system should help the user retrieve local knowledge before generating a reply.
- The generated response should be editable before it is used or shared.
- The user may save valuable content as knowledge or as a snippet for future reuse.
- Milestone 9 completed the first extension-owned global Chrome Side Panel Workspace with manual Merchant Context, manual Guidance, a transient model input, Generate, editable plain-text output, and Copy. Milestone 11 now initializes that model input from one optional saved default when a new Side Panel session starts; later Workspace edits remain transient. The panel remains visible beside the active support website so the user does not switch to a standalone Workspace tab. Images, explicit reset, save-draft actions, and reply insertion remain outside the current workflow.
- The popup remains a launcher. Open Workspace opens the global Side Panel for the current browser window from the direct user action; Open Libraries continues to open the options page, where Knowledge and Snippet CRUD remain.
- The Side Panel is global rather than site-specific or tab-configured. It does not read the active page, and normal Chrome Side Panel lifecycle behavior may discard its transient state when the panel page is closed, destroyed, or reloaded.

## 4. Knowledge Library Workflow

The Knowledge Library is the place where reusable support knowledge is created, maintained, and reused.

```text
Open Knowledge Library

↓

Create or Edit Knowledge

↓

Add Title, Content, and Tags

↓

Save Locally

↓

Search or Browse Knowledge

↓

Reuse in Support Workflow
```

### Workflow Notes

- Knowledge is created when the user wants to preserve a useful answer, reference, or explanation.
- Knowledge should be editable so the user can refine it over time.
- Knowledge should be searchable so the user can quickly find relevant material during support work.
- Knowledge is stored locally and remains available without a backend.
- Knowledge is intended to support the support experience rather than replace it.

## 5. Snippet Workflow

The Snippet workflow is focused on reusable short-form content such as canned replies, message fragments, or other response building blocks.

This workflow remains distinct from the Knowledge Library workflow. Snippets are compact, reusable response building blocks, while knowledge is broader contextual material intended to support troubleshooting and retrieval over time.

```text
Open Snippets

↓

Create Snippet

↓

Add Content, Organization Details, and Optional Trigger

↓

Save Snippet

↓

Edit or Reuse Snippet

↓

Expand Snippet into Response
```

### Workflow Notes

- Snippets are intended for reusable short content.
- Knowledge and snippets are related but distinct: knowledge is broader and more contextual, while snippets are compact and reusable.
- Users should be able to create, edit, organize, and reuse snippets.
- M13 defines one optional canonical trigger per Snippet. Existing Snippets without triggers remain valid and editable.
- Trigger guidance shows that values begin with `;`, are 2–32 characters including that semicolon, and use letters, numbers, and single hyphens. Uppercase is stored lowercase; whitespace and unsupported punctuation are rejected.
- Create and edit show inline invalid-format and duplicate-trigger feedback. The list displays a configured trigger and omits trigger decoration for `null`.
- M13 keeps Snippet content plain text. Variables, rich text, images, and template blocks remain future M14 work.

## 6. Snippet Trigger Expansion Workflow

```text
Focus a Supported Web Editor

↓

Type a Complete Trigger such as ;hello

↓

Press Space

↓

Replace Only the Trigger with Saved Plain-Text Snippet + Space

↓

Caret Rests after the Inserted Space
```

### Workflow Notes

- Expansion runs only in an actively focused supported `textarea`, free-form absent/text/search input, or generic `contenteditable` editor on a normal HTTP or HTTPS website. Chrome-protected, extension, file, and other non-HTTP(S) pages remain unavailable. Textarea supports complete single-line and multiline Snippets. Contenteditable supports complete single-line and multiline Snippets through safe text-node and `<br>` insertion.
- The caret must be collapsed. The trigger must end immediately before it and begin at the editor start or after whitespace. Selected text, partial triggers, missing triggers, composition, paste, programmatic changes, and matches elsewhere do not expand.
- A match replaces exactly the trigger range, inserts the saved content as plain text plus the intended single space, preserves surrounding content and line breaks, emits the normal bubbling composed host `input` notification without synthesizing `change`, and places the caret after the inserted space.
- A supported single-line input expands only Snippets containing no `\r` or `\n`. For multiline content its adapter declines before preventing Space, does not mutate the host value, and lets normal Space behavior continue unchanged. It never flattens, truncates, normalizes, or partially inserts content merely to fit the input.
- A miss, unsupported editor, unavailable cache, or runtime failure does not cancel or synthesize the key: normal Space behavior continues without user-facing interruption.
- Each matched content-script frame maintains one long-lived typed `chrome.runtime.Port`. Its transient cache is enabled only while the port is connected and holds a complete validated current-epoch snapshot; ordered invalidation and complete-snapshot messages use that port. Disconnection immediately clears and disables the cache, so no former snapshot can expand. Reconnection requests a complete snapshot, worker restart establishes a new epoch, and stale epochs are rejected.
- Before Snippet create, edit, delete, import, or restore persistence, the coordinator invalidates every currently connected frame and each clears immediately. Success publishes one rebuilt complete snapshot; persistence failure republishes the unchanged snapshot; publication failure leaves affected frames disabled until reconnect or successful refresh. Content scripts never open Dexie, and no persistent browser-storage catalog, durable queue, polling loop, or per-keystroke worker lookup is created.
- Intercom is a required real-world validation target, but editor detection and replacement remain behind generic adapters. Destination-specific adaptation may be added only behind that interface when real evidence shows the generic adapter is insufficient.
- The generic content-script boundary is structurally validated across isolated worlds and iframe realms; it does not require page-world and extension-world browser-event or DOM constructor identity.
- Trigger expansion reads only the bounded text immediately before the caret, logs no editor content, uses no clipboard, sends nothing to an AI provider, and never interprets Snippet text as HTML.

## 7. Keyboard Shortcut Workflow

The keyboard shortcut workflow is designed to make the extension feel fast and responsive during support work.

```text
Highlight Merchant Text

↓

Keyboard Shortcut

↓

Start Main-Frame Selection Capture

↓

Immediately Start Global Side Panel Open / Activate

(No Await Between These Invocations)

↓

Observe Capture and Open Outcomes Independently

↓

Deliver Typed Result by ID through Ready / Acknowledgement

↓

Replace Merchant Context on Success

↓

Request Guidance DOM Focus at End

↓

Ready to Generate
```

### Workflow Notes

- M10 implements exactly one browser-scoped Chrome command, `capture-selection-to-workspace`, suggested as `Ctrl+Shift+Space` by default and `Command+Shift+Space` on macOS. `Ctrl+Shift+Space` conflicted locally with Text Blaze, so the user remapped it to `Ctrl+Shift+Y` through `chrome://extensions/shortcuts`; Chrome's native extension shortcut manager owns that customization, and the manifest default remains unchanged.
- The command invokes explicit main-frame selection capture first, then invokes Side Panel opening immediately in the same keyboard-command turn without awaiting capture completion. Capture invocation must precede open invocation; capture completion need not precede open invocation. A focused textarea or text-capable input selection takes precedence over the ordinary main-frame document selection.
- After both operations have started, capture and panel-open outcomes are handled independently. A successfully opened panel receives typed success, empty, or failure through a transient delivery ID. A newly mounted panel sends readiness, pending delivery is retried, the panel acknowledges only after applying the result or feedback, and only the matching acknowledged item is removed.
- Non-whitespace selected text replaces Merchant Context exactly, including line breaks, Unicode, and surrounding whitespace; Guidance, model, generated or edited Output, and any active generation request remain unchanged.
- The global Side Panel opens when closed and remains open when already open. Repeated invocation never toggles it closed.
- After every successful delivery, Workspace requests Guidance DOM focus and places a collapsed caret at the end of its preserved value. Empty Guidance is ready for immediate typing when the command opens a closed Side Panel; existing Guidance is not selected, replaced, or otherwise modified. Merchant Context does not receive requested final DOM focus. Generate remains manual and is never invoked by the shortcut.
- When the Side Panel is already visible and the webpage owns keyboard focus, Chrome may keep physical keyboard input routed to the webpage even though Guidance is the active element inside the panel document with the correct caret. The user may need to click Guidance. The shortcut does not retry, delay, poll, close and reopen, toggle, or use another browser surface to force activation.
- Empty selection preserves Context and shows `Select text on the page, then use the shortcut again.` Restricted or failed page capture preserves Context and shows `Couldn't capture selected text from this page. Copy and paste it into Merchant Context.` These paths also preserve Output, do not force Guidance focus or Generate, and expose no raw Chrome error.
- The shortcut workflow is intended to reduce friction and accelerate the support task.
- Selection capture is text-only, main-frame-only, transient, and user-invoked. It does not scrape surrounding page content, read cross-origin frames, expand persistent content-script matches, or capture screenshots.
- This application-level keyboard shortcut is distinct from future Snippet Trigger Expansion. M10 opens or invokes extension behavior through a key combination; typed text such as `;hello` expands saved Snippet content inside a supported editor.
- M10 real Chrome validation passed normal document, textarea, and contenteditable selection; first and repeated capture; empty and restricted-page feedback; state preservation; manual Generate using the new Context and existing Guidance; exact edited-output Copy with line breaks; popup Workspace and Library navigation; and both Knowledge and Snippet Library regressions. The already-visible-panel keyboard-routing limitation remains the only documented focus caveat and is not an implementation failure.

## 8. AI Generation Workflow

The AI generation workflow describes the logical flow from context to draft output.

```text
Merchant Context

+

Optional Guidance

+

Transient Ollama Model

↓

OutputWorkflow

↓

Retrieval Engine

↓

Prompt Builder

↓

GenerationProvider

↓

OllamaProvider

↓

Editable Draft Reply

↓

Copy
```

### Workflow Notes

- The workflow begins with Merchant Context, Guidance, or both; retrieved Library material cannot independently define the current task.
- M9 `OutputWorkflow` constructs the deterministic Context-then-Guidance retrieval query, invokes Retrieval Engine, and supplies already-ranked Knowledge and Snippet results to Prompt Builder.
- Prompt Builder creates a structured provider-independent assembly; the implemented `OllamaProvider` owns Ollama-specific serialization and execution behind the project-owned generation boundary.
- Guidance has the highest dynamic authority, followed by Merchant Context, Knowledge, and Snippets.
- The final result is a draft reply that the user can review and edit.
- This workflow remains provider-independent and should not depend on a specific implementation path.
- M9 runs this workflow directly from the foreground Side Panel page with no background generation messaging. Inputs, model, output, and feedback remain transient while that panel instance is mounted and may be lost when Chrome closes, destroys, or reloads it.
- The Side Panel layout uses fluid available width, remains usable at normal narrow panel sizes without horizontal scrolling, permits vertical scrolling, and does not attempt to control Chrome's panel width.
- Generate is available only with non-whitespace Context or Guidance, a non-whitespace model, and no active request. Repeated Generate reruns the complete workflow; M9 has no separate Regenerate, Cancel, Clear, Save, history, or prompt-preview action.
- Prompt Builder's permanent provider-independent Instructions remain active whether Guidance is present or empty; Guidance is transient case-specific steering and does not replace those Instructions.
- Successful repeated generation replaces the previous draft, while a failed generation preserves the current editable draft. Copy writes the current edited output with line breaks intact from the direct user action and needs no clipboard permission.
- Manual Chrome validation passed for the complete Side Panel workflow, real local `qwen2.5:7b` generation, Guidance influence, edited-output Copy, repeated generation, safe provider and missing-model errors with draft preservation, and both Library regressions.
- Images shown in the broader planned Support workflow remain deferred from Prompt Builder v1 and require a later architecture decision.
- Multimodal Context Attachments are now an approved future product direction, while their Prompt Builder, provider-capability, serialization, limit, unsupported-provider, and persistence architecture remains deferred.

## 9. Settings Workflow

Settings is the third top-level section inside the existing options-page shell beside Knowledge and Snippets. The popup remains unchanged: Open Workspace opens the global Side Panel, and Open Libraries opens the existing options page, where local navigation can reach Settings.

```text
Open Options Page

↓

Settings

↓

Default Ollama model

↓

Save settings

↓

Open a New Workspace Side Panel Session

↓

Transient Model Field Starts with Saved Default
```

### Workflow Notes

- The Settings section contains one visibly labelled text input, concise help text, one explicit `Save settings` button, and an accessible live status region. It uses the existing lightweight options-page navigation and requires no separate extension page, router, category system, or generic settings framework.
- The initial value is blank when no Settings record exists. `qwen2.5:7b` may be shown only as example text and is not an automatic default.
- Save trims outer whitespace. Non-empty trimmed text is saved as the opaque model identifier; empty or whitespace-only text saves `null` and clears the default. Save never contacts Ollama or verifies that the model exists.
- Save is disabled during load and save and while the normalized form value matches the loaded value. Navigation may discard unsaved edits without confirmation. The last successful save wins.
- The page reports `Settings saved.`, `Couldn't load settings. Reload and try again.`, or `Couldn't save settings. Try again.` without exposing raw persistence errors.
- A new Side Panel session loads Settings once before establishing editable model state. The saved model initializes that field; missing, null, or failed Settings load initializes blank. Failure shows `Couldn't load the saved model. Enter a model manually.` without blocking the rest of Workspace.
- Workspace model edits remain transient and never save Settings. Generate uses the current Workspace value. Closing and reopening reloads the latest saved default, while an already-mounted panel does not live-sync changes.
- Provider selection, endpoint configuration, behavior tuning, writing preferences, theme, shortcut settings, Workspace persistence, reset, import, and export are outside M11.
- The implemented controls retain a visible associated label, descriptive help, native keyboard operation, natural focus order, accessible loading state, live success/error announcements, and narrow-width-safe navigation and form layout.
- Real Chrome validation passed the blank first-run state, save and reload using `qwen2.5:7b`, new-session initialization, temporary Workspace override and reopen restoration, real local generation, clear-to-null, Knowledge and Snippet preservation, M10 capture with state preservation and no automatic Generate, popup navigation, and unchanged permissions. Persistence load/save fault feedback was validated through automation; manual database fault injection was not performed.
- Milestone 11 is complete. Import and export remain owned by Milestone 12 and are not introduced or defined by this workflow closeout.

## 10. Import / Export Workflow

Import / Export is the fourth top-level section in the existing options-page shell. It adds no popup action, Side Panel control, separate extension page, or router.

```text
Open Options Page
↓
Import / Export
↓
Export backup
↓
Browser downloads current version 2 JSON file
```

```text
Choose one JSON backup
↓
Size, parse, and strict full-file validation
↓
Review filename, timestamp, counts, and saved model
↓
Read replacement warning and check acknowledgement
↓
Restore backup
↓
Atomically replace Knowledge, Snippets, and Settings
```

### Workflow Notes

- Export explains the local backup purpose, shows `Backup files may contain merchant knowledge, internal notes, and reusable support replies. Store them securely.`, and provides one `Export backup` control with busy and accessible status states.
- After M13 ships, new exports use Backup Format v2 and include each Snippet's required `trigger: string | null`. Version 1 files remain importable and restore their Snippets without triggers. A valid v1 preview states `This version 1 backup does not contain Snippet triggers. Restored Snippets will have no triggers.`
- The backup is unencrypted JSON. M12 provides no password protection, compression, ZIP, cryptographic signing, cloud upload, or automatic or scheduled backup.
- Successful export reports `Backup exported.` Failure reports `Couldn't export your data. Try again.` Export over the 25 MiB serialized UTF-8 limit uses `This backup file is too large. Choose a file smaller than 25 MB.`
- Import uses one visibly labelled file input accepting `.json,application/json`; MIME and extension are hints while content validation is authoritative. There is no drag-and-drop zone or pasted-JSON editor.
- Selecting a file clears any earlier preview and acknowledgement. A file above 25 MiB is rejected before reading. Read failure reports `Couldn't read this backup file. Choose another file.`
- Strict validation occurs before preview or persistence. Invalid content reports `This isn't a valid AI Support Workspace backup file.` An unknown format version reports `This backup version isn't supported by this version of AI Support Workspace.`
- A valid preview shows filename, exported timestamp, Knowledge count, Snippet count, and saved default model; `null` appears as `No saved default model`. Knowledge bodies, Snippet content, and record diffs are never previewed.
- The destructive warning reads `Restoring this backup will replace your current Knowledge, Snippets, and saved Settings.` The initially unchecked acknowledgement reads `I understand that my current local data will be replaced.` Restore uses native disabled behavior until acknowledgement and while busy.
- `Cancel` clears selection-specific preview, confirmation, and status. Selecting a replacement file performs the same reset. A valid empty backup remains restorable and clears both Libraries under normal acknowledgement.
- Successful replacement reports `Backup restored.` plus the restored Knowledge count, Snippet count, and `Settings restored`. It then clears the selected file, preview, and acknowledgement. A failed atomic replacement reports `Couldn't restore the backup. Your existing data was not changed.` and retains the current data. Validation failure clears the acknowledgement and invalid selection state.
- After success, the options page locally refreshes or remounts its Knowledge, Snippets, and Settings sections so navigation shows restored data without a browser restart. This introduces no event bus, runtime broadcast, or subscription system.
- An already-mounted Side Panel does not live-sync restored Settings and does not change transient Merchant Context, Guidance, Output, or model state. A recreated Side Panel loads the restored default through the existing M11 workflow.
- Controls have visible labels and explanations, keyboard operation, natural focus order, accessible busy states and live announcements, native disabled semantics, focus on the preview after validation, and focus or equivalent announcement for validation errors. The layout remains usable at narrow options-page widths.

## 11. Local Data Workflow

The application is local-first. User data should remain under local control and be available without a backend.

```text
Knowledge

↓

Local persistence

Snippets

↓

Local persistence

Settings

↓

Local persistence
```

### Workflow Notes

- Knowledge, snippets, and settings are treated as local user data.
- The product should remain usable even when the user is offline.
- Local data access should be fast, predictable, and reliable.

## 12. Future Workflows

### Assigned Future Capability Workflows

- **M14 — Rich Snippet Templates:** add ordered structured Snippet content through the M13 destination-aware editor boundary, with safe positional fallback for editors that cannot insert rich content. Detailed architecture remains deferred.
- **M15 — Multimodal Screenshot Context:** combine text with one or more transient clipboard screenshots for capable generation providers, with attachment indication, preview, removal, and explicit unsupported-provider handling. Detailed architecture remains deferred.
- **M16 — OpenAI Provider Expansion:** add OpenAI and provider selection behind the existing provider-independent boundary after credentials, permissions, models, errors, and privacy are defined.

Context images provide transient visual information to generation. Snippet images are reusable Library-owned response content intended for editor expansion. Their domain ownership must remain separate.

The following potential workflows are not part of the current core user experience definition and require their own approved scope before implementation:

- Provider Selection, deferred to Milestone 16 OpenAI Provider Expansion when more than one provider exists
- Provider endpoint configuration after a dedicated security and permissions architecture review
- Persistent Prompt Profiles or writing preferences after a separate product and precedence decision
- Prompt Management
- Advanced Search

History is not an assumed workflow or feature. Whether it should be introduced remains an intentionally undecided future product decision.

Any future workflow should be documented separately when it becomes part of the approved product scope.
