# UI Workflow

## 1. Purpose

This document describes the planned user workflows for the application from the user’s perspective. It is not a UI mockup and it is not a design specification. Its purpose is to define how a person moves through the product so that future implementation work can follow a consistent and documented experience.

This document is intentionally implementation-independent and should be read alongside the product vision, requirements, architecture, and engineering principles.

## 2. Primary Navigation

The current implemented product is organized around a small set of top-level areas:

- Support
- Knowledge Library
- Snippets
- Settings
- Import / Export

These areas represent the current primary navigation. Decision 46 approves a future active-product navigation that removes Knowledge Library from the normal AI workflow/UI and uses Text Snippets as the sole user-managed AI reference Library. Until that implementation and a separately approved compatibility cleanup, the current Knowledge surface and data remain available.

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

Guidance / Gist (optional)

↓

Retrieve Relevant Text Snippets

↓

Generate

↓

Editable Output

↓

Copy Reply
```

### Workflow Notes

- The user begins in a support-oriented workspace that is designed for speed and clarity.
- Merchant context is the central input for the support task.
- Images and guidance may be added when useful, but they remain optional.
- The approved future Multimodal Context direction allows one or more screenshots or images to be pasted directly from the clipboard into the current Context alongside text. Attachments should be visible, previewable where appropriate, and removable before generation; reordering remains unresolved.
- Future Context images are transient by default and flow to AI generation only through a provider-independent capability boundary. Unsupported images must not be silently discarded.
- The future active AI workflow retrieves relevant Text Snippets as reference material; it does not require the user to maintain separate Knowledge records.
- The generated response should be editable before it is used or shared.
- Reusable reference/delivery material is managed in the Snippet Library. No direct “Save as Snippet” action from Generated Output is approved by Decision 47. Knowledge remains current compatibility data until separate removal/migration work is approved.
- Milestone 9 completed the first extension-owned global Chrome Side Panel Workspace with manual Merchant Context, manual Guidance, a transient model input, Generate, editable plain-text output, and Copy. Milestone 11 now initializes that model input from one optional saved default when a new Side Panel session starts; later Workspace edits remain transient. The panel remains visible beside the active support website so the user does not switch to a standalone Workspace tab. Images, explicit reset, save-draft actions, and reply insertion remain outside the current workflow.
- Current implementation: the popup remains a launcher. Open Workspace opens the global Side Panel for the current browser window from the direct user action; Open Libraries opens the options page in a normal browser tab, where Knowledge and Snippet CRUD remain.
- Approved future target: clicking the extension toolbar action opens/toggles the existing global Workspace Side Panel directly, with no intermediate popup. A compact Settings gear in the panel header opens the full Options / Libraries page; Snippets, Settings, Import / Export, automatic backup, paste behavior, model/provider configuration, and future management stay in Options. Current Knowledge remains there only until its separately implemented future UI retirement.
- The Side Panel is global rather than site-specific or tab-configured. It does not read the active page, and normal Chrome Side Panel lifecycle behavior may discard its transient state when the panel page is closed, destroyed, or reloaded.

### Approved Future Compact Side Panel

```text
Merchant Context
[compact auto-growing multiline input]
[removable request-scoped Context Image attachments]

Guidance / Gist
[compact auto-growing text input]

[ Model dropdown ]   [ Generate ]

Generated Output                         [Copy]
[ editable generated response                 ]
```

- Context and Guidance / Gist start approximately one visual line high, grow to a sensible maximum, and then scroll internally. “One line” describes initial height, not a content restriction.
- Generate is enabled for Context-only, Gist-only, or both and disabled only when both are empty. Context-only implies a sensible grounded reply; minimal Gist may refer to the pending/latest Context subject; Gist-only may directly specify the message.
- Context Images are compact, removable, request-scoped multimodal AI input. They are not Image Snippets, Knowledge records, or permanent Library assets. Any mounted-workspace continuity remains separate from reusable Snippet ownership.
- The Model control is a provider-independent dropdown supplied through application/provider boundaries, not Ollama-specific discovery inside the Workspace.
- Generated Output stays editable while Context/Gist change and generation repeats. Generation clears neither input. Copy remains on the output header; no direct Insert/Paste action is approved.
- Redundant product headings, intro prose, “Local support drafting,” and persistent Ollama installation/helper copy do not occupy the future primary drafting surface.
- This is approved future behavior. The current M9/M11 Side Panel, free-text model input, text-only Context, and current Prompt Builder remain implemented until future M15 work changes them.

## 4. Current Knowledge Compatibility Workflow

The Knowledge Library remains implemented today for existing records, Backup compatibility, and current workflow reconstruction. Decision 46 retires it from the future active AI workflow/UI; it does not delete or migrate the current data or implementation.

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
- Future users should not be required to maintain Knowledge separately from Text Snippets. Permanent removal/migration is a separate future task.

## 5. Snippet Workflow

The Snippet workflow is focused on reusable short-form content such as canned replies, message fragments, or other response building blocks.

Today this workflow remains distinct from the implemented Knowledge compatibility workflow. In the future active product, Text Snippets become the sole user-managed AI reference library as well as reusable delivery content; Image Snippets remain delivery-only assets.

```text
Open Snippets

↓

Create Snippet

↓

Choose Text Snippet or Image Snippet, then Add Content, Organization Details, and Optional Trigger

↓

Save Snippet Atomically

↓

Edit or Reuse Snippet

↓

Expand Snippet into Response
```

### Workflow Notes

- Snippets are intended for reusable short content.
- Current implementation preserves separate Knowledge and Snippet domains. Future active AI reference uses Text Snippets only; no destructive migration is implied.
- Users should be able to create, edit, organize, and reuse snippets.
- M13 defines one optional canonical trigger per Snippet. Existing Snippets without triggers remain valid and editable.
- Trigger guidance shows that values begin with `;`, are 2–32 characters including that semicolon, and use letters, numbers, and single hyphens. Uppercase is stored lowercase; whitespace and unsupported punctuation are rejected.
- Create and edit show inline invalid-format and duplicate-trigger feedback. The list displays a configured trigger and omits trigger decoration for `null`.
- The Library exposes All/Text/Images filters, search, and one New Snippet chooser with Text Snippet and Image Snippet. Plain/Rich is not a normal user-facing choice.
- Every new Text Snippet is Rich and opens in the constrained Tiptap composer with Bold, Italic, Link, Bullet List, Numbered List, Undo, and Redo. Users type and manage normal paragraphs/list items directly; internal blocks and inline segments are not exposed. Tiptap HTML and runtime state are never persisted.
- Historical Plain appears as Text. Opening creates an equivalent Rich draft with line breaks preserved; Cancel leaves storage unchanged, and the first successful Save updates the same identity/metadata through normal repository semantics. No startup or bulk migration occurs.
- Supported Rich paragraphs, marks, links, and lists reopen normally. Existing legacy URL/local-image Rich records that cannot safely round-trip show a small read-only compatibility state; content and assets remain preserved and IDs remain hidden.
- The Image editor's primary workflow is: take a screenshot, keep it on the clipboard, choose New Image Snippet, focus the paste target, press `Ctrl+V`, review the local preview, set metadata, and Save. No prior file save is required; labelled PNG/JPEG/WebP selection is secondary.
- Pasting one PNG/JPEG/WebP into the extension-owned editor uses user-initiated paste event data and requires no `clipboardRead`; selecting from disk uses a labelled file input. Validation errors are accessible and focused.
- A new Image Snippet cannot Save without exactly one valid image. Removing a new draft clears its preview and disables Save; replacing a persisted image occurs only through successful atomic Save. Cancel preserves stored data. Object URLs are revoked on replacement, removal, cancel, and unmount.
- Users never see asset IDs, Blob/base64, binary storage terms, or a URL requirement. There is no global Image Library, image collection, shared asset picker, or "Use as Context" action.
- Legacy Rich content is never converted automatically. A future explicit conversion may appear only for a Rich record containing exactly one valid local-image block and no other block/asset; mixed Rich records remain preserved and fail-closed.
- Variables and dynamic customer fields remain unavailable.

## 6. Snippet Trigger Expansion Workflow

```text
Focus a Supported Web Editor

↓

Type a Complete Trigger such as ;hello

↓

Press Space

↓

Prepare the Authoritative Text/Image Snippet on the Clipboard

↓

After Confirmed Copy, Remove Only the Unchanged Trigger + Space

↓

Clipboard-only mode: show Copied — press Ctrl+V

or, in automatic mode:

Revalidate focus and request exactly one Windows paste
```

### Workflow Notes

- Trigger activation runs only in an actively focused supported `textarea`, free-form absent/text/search input, or generic `contenteditable` editor on a normal HTTP or HTTPS website. Chrome-protected, extension, file, and other non-HTTP(S) pages remain unavailable. M14-I prepares deterministic plain plus safe rich Text representations or a portable Image representation, and the user performs native paste.
- The caret must be collapsed. The trigger must end immediately before it and begin at the editor start or after whitespace. Selected text, partial triggers, missing triggers, composition, paste, programmatic changes, and matches elsewhere do not expand.
- A fully validated deliverable match synchronously prevents the activation Space, then starts asynchronous clipboard preparation. Only confirmed clipboard success permits exact compare-and-swap removal of the unchanged trigger; the caret then collapses at the removed range start.
- `textarea`, supported text/search input, and generic contenteditable share destination-independent clipboard preparation. Their native paste behavior chooses the plain or rich representation; the extension does not reconstruct saved formatting through destination DOM mutation.
- Text and Image delivery use the same typed planner and native-paste workflow. Stored HTML is never parsed and reference URLs are never fetched.
- A miss, unsupported editor, unavailable cache, or runtime failure does not cancel or synthesize the key: normal Space behavior continues without user-facing interruption.
- Each matched content-script frame maintains one long-lived typed `chrome.runtime.Port`. Its transient cache is enabled only while the port is connected and holds a complete validated current-epoch snapshot; ordered invalidation and complete-snapshot messages use that port. Disconnection immediately clears and disables the cache, so no former snapshot can expand. Reconnection requests a complete snapshot, worker restart establishes a new epoch, and stale epochs are rejected.
- Before Snippet create, edit, delete, import, or restore persistence, the coordinator invalidates every currently connected frame and each clears immediately. Success publishes one rebuilt complete snapshot; persistence failure republishes the unchanged snapshot; publication failure leaves affected frames disabled until reconnect or successful refresh. Content scripts never open Dexie, and no persistent browser-storage catalog, durable queue, polling loop, or per-keystroke worker lookup is created.
- Intercom, Crisp, generic textarea, and generic contenteditable are required real-world validation targets for the revised delivery architecture. Destination-specific adaptation may be added only behind capability resolution when concrete browser evidence justifies it.
- The generic content-script boundary is structurally validated across isolated worlds and iframe realms; it does not require page-world and extension-world browser-event or DOM constructor identity.
- Trigger recognition reads only bounded text immediately before the caret, logs no editor content, sends nothing to an AI provider, and never interprets Snippet content as HTML. Clipboard delivery is explicitly enabled in Settings.
- For Rich text, the universal plain projection preserves block order, separates blocks with exactly `\n\n`, keeps readable emphasis text without markers, renders a labelled link as `label (url)` unless label equals URL, renders unordered/ordered items with `- ` or one-based numeric prefixes, and preserves legacy image-reference projection. Image Snippets are excluded from text consumers rather than represented by a placeholder.
- Decision 45 provides the user-selectable `Copy to clipboard` / `Paste automatically` behavior. Clipboard-only is the default and permanent supported workflow. Automatic mode remains additive: it uses the same clipboard preparation and exact cleanup, then attempts one focus-guarded Windows paste. Any declined, failed, unavailable, or indeterminate attempt leaves the clipboard available and returns to `Copied — press Ctrl+V`.

### Unified Clipboard Delivery Workflow

```text
Text Trigger + Space
→ authoritative typed Delivery Planner
→ write safe text/html + deterministic text/plain successfully
→ safely remove only unchanged trigger/activation space
→ show “Snippet copied — press Ctrl+V”
→ user presses Ctrl+V for native destination paste
```

```text
Image Trigger + Space
-> request and validate the one owned image on demand
-> prepare and successfully write PNG to the clipboard
-> safely remove only the unchanged trigger/activation space
-> show "Image copied — press Ctrl+V"
-> user performs real Ctrl+V
-> destination chooses inline, attachment, or message behavior
```

- Clipboard-only assistance is real copy plus user native paste. Decision 45 automatic mode may issue one guarded Windows Ctrl+V input sequence, never a synthetic DOM paste event; neither mode claims insertion merely from clipboard or input success.
- The product owner accepts the one-extra-keystroke manual `Ctrl+V` workflow as a permanent supported mode and fallback. M14-K.2 implements the optional Windows automatic mode after the same clipboard-success boundary.
- Existing browser Text clipboard capability is enabled through an explanatory Settings/options action that requests optional `clipboardWrite` and `offscreen`. The independent Windows Image Snippets section requests optional `nativeMessaging` only from its own Enable button. It reports Not enabled, Companion not found, Companion incompatible, Ready, or unsupported platform without exposing host internals. Permission denial, revocation, helper absence/mismatch, conversion failure, or write failure preserves normal typing and the trigger. Trigger input never silently requests permission, and `clipboardRead` is never requested.
- Decision 42 screens PNG IHDR, JPEG SOF, and WebP VP8X/VP8/VP8L dimensions before decoding. Width/height are capped at 8,192, pixels at 16,777,216, decoded RGBA at 64 MiB, and the planned two-surface raster working set at 128 MiB. Animated WebP and oversized images are rejected, not resized.
- The accepted activation Space is consumed synchronously before the asynchronous write begins. Cleanup occurs only after confirmed copy and exact editor/range/catalog/request revalidation. Image cleanup removes only the trigger from that no-Space state, leaves no placeholder or trailing space, and collapses the caret at the removed range start. Changed state leaves user text untouched while reporting copy accurately.
- Text `text/plain` uses deterministic projection. Safe Rich `text/html` contains only validated paragraphs, text, bold/italic, links, and lists. Image delivery is a separate image-only PNG clipboard item; it never attempts ordered text-plus-image placement.
- Blob/base64/asset IDs are not placed in frame catalog snapshots. The service worker retrieves the requested Image Snippet asset from Dexie only after activation, revalidates ownership, applies Decision 42 PNG preparation, rechecks catalog freshness, and then invokes the Windows native transport.
- Current Crisp evidence is limited but actionable: ordinary direct Plain insertion fails in the tested Crisp editor, the same Snippet succeeds in another Rich editor, the speculative generic patch was removed, and manual native paste works. No Crisp-specific runtime is implemented or promised by M14-D.
- Real Chrome validates the Text workflow end to end through clipboard preparation, trigger cleanup, copied notice, and native paste with bold, italic, links, bullet lists, and numbered lists. Text normally uses one temporary offscreen `copy` handler plus `document.execCommand('copy')`, not `navigator.clipboard.write()`.
- The previous Image Async Clipboard path failed at the offscreen write; M14-I.1.4 pasted a `snippet.png` File; and focused-content A1 pasted `TEXT`. Focused extension-page B pasted the visible deterministic PNG as an image, proving focused-extension clipboard capability but not an acceptable workflow. M14-I.5 removes these mechanisms and their probes from active runtime. The product never opens/focuses an extension page for Image delivery.
- M14-I.4.1 aligns the shared native call with Chrome's callback response and keeps the Settings runtime channel open through `sendResponse` plus literal `true`. `Check companion again` always performs a fresh check and replaces a prior failure with `Ready` after compatible success. Real Chrome validates `Ready` and the first complete Image workflow: trigger activation, native clipboard preparation, trigger cleanup, `Image copied — press Ctrl+V`, and visible genuine image after native paste.

Current Windows Image flow:

```text
Image trigger + Space
-> authoritative service-worker planning and Decision 42 PNG
-> second catalog freshness check
-> one strict Windows Native Messaging request
-> companion writes registered PNG + CF_DIBV5
-> exact correlated native success
-> content compare-and-swap cleanup
-> "Image copied — press Ctrl+V"
-> user performs native Ctrl+V
```

Missing permission/helper, incompatible version, busy clipboard, native failure, disconnect, or stale response leaves the trigger and page content unchanged and shows no false copied notice. If native preparation succeeded but the response is lost or page state became stale, the clipboard may remain prepared while cleanup is safely skipped. Text clipboard preparation remains independent and browser-only; automatic mode launches the helper only after Text clipboard success.

Implemented M14-K automatic-mode flow for both Text and Image:

```text
clipboard preparation succeeds
→ browser sender/tab/window and native foreground context captured
→ exact trigger cleanup succeeds
→ same editor/caret revalidated
→ one authorization consumed
→ exact foreground/clipboard/modifier checks pass
→ one native Ctrl+V sequence requested
→ show "Paste sent"
```

`Paste sent` means Windows accepted the full input sequence; it does not prove that the destination inserted content. After clipboard success, unsafe or changed editor focus, tab switch, browser-window switch, application switch, changed clipboard, held modifier, native paste busy, paste-capability loss, input failure, or uncertain result shows `Snippet copied — press Ctrl+V` / `Image copied — press Ctrl+V`. An automatic-only precheck failure does not suppress the normal exact cleanup attempt after clipboard success; if cleanup itself was not authorized, the existing `(trigger unchanged)` suffix remains. A second fully validated activation consumes its command Space, retains its trigger if rejected before its own clipboard preparation, and shows retry-later delivery busy without claiming copied. If the whole companion is missing before Image preparation, the existing Image delivery failure remains because no clipboard-success prerequisite exists; Text preparation remains browser-only. No automatic retry occurs after input may have begun, and the extension never clears the clipboard. A user who presses `Ctrl+V` after `Paste sent` will naturally paste the clipboard again.

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
- This application-level keyboard shortcut is distinct from Snippet trigger delivery. M10 opens or invokes extension behavior through a key combination; typed text such as `;hello` prepares the authoritative saved Snippet for native paste after safe trigger cleanup.
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

Settings is the third top-level section inside the existing options-page shell beside Knowledge and Snippets. In the current implementation, the popup's Open Workspace action opens the global Side Panel and Open Libraries opens the existing options page, where local navigation can reach Settings. The approved future toolbar action opens/toggles the Side Panel directly; its compact header gear opens the existing Options / Libraries surface rather than moving Settings into the panel.

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
- M14-K.2 extends the same Settings aggregate and explicit Save workflow with `Paste behavior`: `Copy to clipboard` (default, manual Ctrl+V) or `Paste automatically`. The automatic choice explains that one paste is sent after copying, manual Ctrl+V remains available, and safe fallback applies when automatic paste cannot run. Trigger typing never silently requests native permission.
- The M14-K.2 preference is `snippetPasteMode: 'clipboard-only' | 'automatic'`. It used the existing singleton Settings record without adding a store/index or Dexie version at that checkpoint. Backup v5 remains frozen; M14-K.2 introduced strict Backup v6 and valid v1-v5 imports map to `clipboard-only`. M14-M.1 subsequently adds only the coordinated Dexie v6/Backup v7 data foundation.
- M14-K.2.3 preserves this UI exactly. The first real Intercom automatic Text attempt reached the automatic branch but fell back after `post-cleanup-check`; later corrections and M14-K.3 Principal evidence validate the complete automatic path in Intercom and Crisp. `Paste sent` remains limited to full native input acceptance and does not claim destination insertion. `Snippet copied — press Ctrl+V` / `Image copied — press Ctrl+V` remains the truthful populated-clipboard fallback, and manual `Ctrl+V` remains permanently supported.

### Approved Future M14-N Automatic Backup Settings

```text
Automatic Backup
[ Weekly ▼ ]

Backup Location
[ Choose folder... ]
[folder name or Backup location needs attention]

[last successful backup/status when available]
```

- Cadence values are exactly Off, Daily, and Weekly; Weekly is recommended/default. Daily retains the latest seven and Weekly the latest four successful managed backups. Off clears scheduling but retains the selected location for later reuse until the user explicitly forgets it.
- Choose folder is the only picker/permission gesture. It opens `showDirectoryPicker({ mode: 'readwrite' })`; the UI displays only safe folder/status information, not an invented arbitrary path field.
- Scheduled backup never opens a Save dialog or permission prompt. Revoked, moved, deleted, unsupported, or unavailable locations show `Backup location needs attention`; Snippet use continues and manual Export remains available.
- Daily keeps the latest seven and Weekly the latest four successfully written and verified managed backups. The UI does not imply ownership of unrelated files; a retention-proof warning may leave safe extras.
- Restored cadence is a preference, not filesystem authority. Profile restore preserves any independently held local selected-folder authorization. Restored Daily/Weekly with no usable local folder fabricates none, remains inactive, and shows `Backup location needs attention`; it never opens a background prompt or rapid failure loop. Manual Export stays available, and explicit Choose folder/reauthorization activates the restored cadence. Restored Off remains inactive without requiring that warning and retains an existing selected folder for later reuse.
- M14-N does not add a silent Downloads fallback. Configuration/help stays in Settings/Import & Export rather than the primary drafting Workspace.

### Approved Future M14-M/M14-O Library Metadata

- A Text or Image Snippet may show exactly `<count> uses`; absent statistics render as zero. No charts, dashboard, usage history, or telemetry are added.
- Authored tags remain the existing editable field. Generated Text retrieval tags are separate non-authoritative metadata and must not silently appear as authored values or become editable through the authored-tag control.
- Snippet Save completes before tag generation. Missing model/provider or generation failure may show safe non-blocking status without changing the saved Snippet.

## 10. Import / Export Workflow

Import / Export is the fourth top-level section in the existing options-page shell. It adds no popup action, Side Panel control, separate extension page, or router.

```text
Open Options Page
↓
Import / Export
↓
Export backup
↓
Browser downloads current version 7 JSON file
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
Atomically replace Knowledge, Snippets, SnippetAssets, Settings, usage, and generated metadata; clear local backup authority
```

### Workflow Notes

- Export explains the local backup purpose, shows `Backup files may contain merchant knowledge, internal notes, and reusable support replies. Store them securely.`, and provides one `Export backup` control with busy and accessible status states.
- New exports use strict Backup Format v7 and include Knowledge, Plain/Rich/Image Snippets, SnippetAssets, authored Settings, portable automatic-backup cadence, usage statistics, and separate generated Text metadata through explicit version-owned DTOs. Versions 1–6 remain frozen/importable with empty sidecars and `weekly` cadence defaults; v1 restores Snippets without triggers, and v4 legacy Rich local-image records remain Rich without automatic conversion. Local directory handles/authority never appear in the file. A valid v1 preview states `This version 1 backup does not contain Snippet triggers. Restored Snippets will have no triggers.`
- The backup is unencrypted JSON. M12 provides no password protection, compression, ZIP, cryptographic signing, cloud upload, or automatic or scheduled backup.
- Successful export reports `Backup exported.` Failure reports `Couldn't export your data. Try again.` Backup v4/v5 use the documented 96 MiB serialized UTF-8 guard; v1-v3 retain their historical 25 MiB guard.
- Import uses one visibly labelled file input accepting `.json,application/json`; MIME and extension are hints while content validation is authoritative. There is no drag-and-drop zone or pasted-JSON editor.
- Selecting a file clears any earlier preview and acknowledgement. A file above the current 96 MiB maximum is rejected before reading, and the parsed version-specific guard is then enforced. Read failure reports `Couldn't read this backup file. Choose another file.`
- Strict validation occurs before preview or persistence. Invalid content reports `This isn't a valid AI Support Workspace backup file.` An unknown format version reports `This backup version isn't supported by this version of AI Support Workspace.`
- A valid preview shows filename, backup format version, exported timestamp, Knowledge count, Snippet count, local image asset count, and saved default model; `null` appears as `No saved default model`. Knowledge bodies, Snippet content, asset identifiers/bytes, and record diffs are never previewed.
- The destructive warning states that restore replaces current Knowledge, Snippets, local image assets, and saved Settings. The initially unchecked acknowledgement reads `I understand that my current local data will be replaced.` Restore uses native disabled behavior until acknowledgement and while busy.
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

- **M14 — Snippet Authoring and Delivery:** COMPLETE at `e34cd76`. M14-J and M14-K are complete and real-browser validated. M14-K.3 Principal-approved optional additive Windows automatic Text/Image paste in Intercom and Crisp, clipboard-only/manual workflows, unknown-trigger safety, and live Settings propagation. Manual `Ctrl+V` remains permanently supported. Decisions 46–49 remain future product direction, not current workflow implementation.
- **M14-L/M14-L.1 — Snippet Hardening Architecture:** checkpointed documentation architecture. Decisions 50–53 are Principal-approved in substance and Decision 54 remains intact.
- **M14-M.0 — Selected-Folder Backup Feasibility Gate:** **PASS / REAL-CHROME VALIDATED** through the native-dev Options diagnostic. Picker, persistence, reload/restart, service-worker reuse, exact owned-file lifecycle, same-folder identity, and unavailable-location safety passed. Different-folder distinction remains an M14-N verification before retention reliance. M14-M.1 implements only the Dexie v6/Backup v7 persistence boundary; ordinary production Options still has no automatic-backup product UI or scheduled output.

The lifecycle availability flow is:

```text
Install / update / unpacked reload / browser startup
↓
Query eligible loaded HTTP/HTTPS tabs
↓
Inject the current packaged static content script in all matching frames
↓
Per-frame idempotent bootstrap or safe one-for-one replacement
↓
Connect and accept a complete current-epoch trigger catalog snapshot
```

Normal navigation continues to use static content-script injection. The user should not need to refresh an already-open supported page after extension lifecycle changes. Chrome site-access controls remain authoritative; denied, restricted, protected, discarded, non-HTTP(S), and `file://` pages are not forced into availability. Recovery never pastes automatically and never inspects page text.
- **M15 — Multimodal Screenshot Context:** combine text with one or more transient clipboard screenshots for capable generation providers, with attachment indication, preview, removal, and explicit unsupported-provider handling. Detailed architecture remains deferred.
- **M16 — OpenAI Provider Expansion:** add OpenAI and provider selection behind the existing provider-independent boundary after credentials, permissions, models, errors, and privacy are defined.

### Approved Future M15 Workspace Entry and Settings Navigation

```text
Click extension toolbar action
↓
Chrome opens/toggles global AI Support Workspace Side Panel directly
↓
AI Support Workspace                         [Settings gear]
↓
Gear opens existing Options / Libraries page
```

The gear is an icon-only native button in the title row with accessible name `Open Settings and Libraries`, visible keyboard focus, native Enter/Space activation, and a sufficient pointer target. It invokes `chrome.runtime.openOptionsPage()` and provides safe non-blocking failure announcement. It does not consume a content row, display a large **Open Libraries** button, or open a dropdown/menu.

This future M15 workflow removes only the intermediate popup step. It preserves the current global Side Panel, options-page management boundary, selected-text keyboard shortcut behavior, and least-privilege permission set. Its implementation must inspect WXT's generated action manifest, retire the popup/default popup without competing toolbar behaviors, and preserve a popup-free action plus `side_panel.default_path` and `options_ui`.

M14-I.2 defines the Windows Native Messaging companion that writes genuine image clipboard data without a focused extension page. Decision 43 selects one-shot PNG-only messages, registered PNG plus CF_DIBV5, WIC, exact extension-origin restrictions, and per-user installation. M14-I.4 makes the development helper reachable through the stable `native-dev` build and exact `.dev` HKCU registration; readiness and native Image delivery passed in real Chrome. Production installation remains absent. M14-K.2 implements Decision 45's separate optional automatic-paste protocol through the same companion; stale focus declines, no result is retried, and manual `Ctrl+V` remains the fallback.

Context images provide transient visual information to generation. Image Snippets are durable, reusable, one-image output shortcuts copied for destination-native paste. Their domain ownership, lifecycle, and privacy rules remain separate; no "Use as Context" bridge is approved.

The following potential workflows are not part of the current core user experience definition and require their own approved scope before implementation:

- Provider Selection, deferred to Milestone 16 OpenAI Provider Expansion when more than one provider exists
- Provider endpoint configuration after a dedicated security and permissions architecture review
- Persistent Prompt Profiles or writing preferences after a separate product and precedence decision
- Prompt Management
- Advanced Search

History is not an assumed workflow or feature. Whether it should be introduced remains an intentionally undecided future product decision.

Any future workflow should be documented separately when it becomes part of the approved product scope.
