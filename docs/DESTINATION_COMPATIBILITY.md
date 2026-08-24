# Destination Compatibility

## Current Validation State

- Task: M14-J.7 — M14-J Milestone Closeout & Git Checkpoint Preparation
- Date: 2026-08-15
- Status: M14-J COMPLETE / REAL-BROWSER VALIDATED / CRISP AND INTERCOM NO-REFRESH RECOVERY PASS / REPEATED-RELOAD IDEMPOTENCY PASS
- Clipboard architecture: unchanged from M14-I
- Current insertion UX: manual native `Ctrl+V`

M14-J distinguishes deterministic extension behavior from operating-system clipboard and destination paste behavior. Automated fixtures prove trigger activation, exact success-gated cleanup, focus, caret/selection, surrounding-content preservation, and failure preservation. They do not prove native clipboard fidelity or a destination's interpretation of clipboard representations. Real Chrome with native `Ctrl+V` remains authoritative for that evidence.

## Classification

- **PASS:** the current architecture works as intended for the validated scope.
- **DESTINATION LIMITATION:** clipboard preparation succeeds, but the destination intentionally or technically does not accept the offered representation.
- **COMPATIBILITY DEFECT:** the extension loses focus, corrupts content, removes the wrong content, duplicates content, leaves a stray Space, or otherwise breaks the destination workflow.
- **ARCHITECTURE CONFLICT:** a correction would require changing Decision 42, Decision 43, or an established clipboard-ownership boundary. Stop for architecture review.

## Controlled Compatibility Matrix

| Editor fixture | Text support | Image support | Focus after successful cleanup | Caret/selection | Validation type | Classification | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Standard single-line text input | Activation and exact cleanup PASS | Native paste interpretation not tested; visible images are not required from a plain-text control | Preserved: YES; active element remains the input | Preserved: YES; collapsed at removed-range start | Automated fixture | PASS for controlled activation/cleanup | Surrounding content remains intact; no trigger fragment or activation Space remains after correlated success. Plain-text paste fidelity remains a real-browser concern. |
| Standard textarea | Activation and exact cleanup PASS | Native paste interpretation not tested | Preserved: YES; active element remains the textarea | Preserved: YES; collapsed at removed-range start | Automated fixture | PASS for controlled activation/cleanup | Multiline surrounding content remains intact. Destination paste formatting is intentionally plain-text. |
| Generic contenteditable | Activation and exact cleanup PASS | Native failure preservation PASS; native paste interpretation pending | Preserved: YES; active element remains the editing root | Preserved: YES; collapsed at removed-range start | Automated fixture | PASS for controlled activation/cleanup | Accepted Space is synchronously consumed; success removes only the trigger. Native Image failure leaves the trigger and page content unchanged. |
| Structured nested rich-editor approximation | Activation across nested inline nodes and exact cleanup PASS | Native failure preservation PASS; native paste interpretation pending | Preserved: YES; active element remains the editing root | Preserved: YES; collapsed at removed-range start | Automated fixture | PASS for controlled activation/cleanup | Nested inline markup and a separate paragraph remain intact. No third-party editor dependency or destination-name branch was added. |
| Contenteditable after `<br>` | Structural trigger activation and exact cleanup PASS | Not tested | Preserved: YES | Preserved: YES | Automated fixture | PASS for controlled correction | The accepted Space is consumed, the `<br>` remains, and only the trigger is removed. |
| Contenteditable at new sibling `<div>` | Structural trigger activation and exact cleanup PASS | Native failure preservation PASS | Preserved: YES | Preserved: YES | Automated fixture | PASS for controlled correction | The preceding block, both block containers, and surrounding content remain intact. |
| Contenteditable at new sibling `<p>` | Structural trigger activation and exact cleanup PASS | Not tested | Preserved: YES | Preserved: YES | Automated fixture | PASS for controlled correction | The preceding paragraph and both paragraph containers remain intact. |
| Nested inline content at new block | Structural trigger activation and exact cleanup PASS | Not tested | Preserved: YES | Preserved: YES | Automated fixture | PASS for controlled correction | Existing `<strong>`, `<em>`, and block wrappers remain intact. |
| Inline non-whitespace continuation | Activation correctly rejected | Not applicable | Preserved: YES | Preserved: YES | Automated fixture | PASS for safety boundary | `hello<em>;trigger</em>` is not treated as a line boundary. |
| Crisp message composer | Inline, Enter, and Shift+Enter Text delivery PASS with FULL formatting | Visible Image paste PASS | Preserved: YES | Preserved: YES | Principal real-destination validation | PASS | Activation, cleanup, copied notice, focus, manual paste, formatting, and duplicate safety pass for Text; the equivalent Image workflow also passes. |
| Generic retargeted Shadow DOM editor | Internal editor-start and block-start activation/cleanup PASS | Not tested | Shadow focus chain preserved: YES | Internal caret preserved: YES | Automated fixture using event-shaped composed path/target ranges | PASS for controlled correction | Open and closed ShadowRoot fixtures use the same event-resolution path; the non-editable outer host is never mutated as editor content. |
| Intercom message composer | Trigger, cleanup, notice, focus, manual paste, ordinary rich Text, and normal three-item bullet-list paste PASS | Visible Image paste PASS | Preserved: YES | Preserved: YES | Principal real-destination validation plus automated serializer/diagnostic coverage | PASS for normal Text, normal bullet list, and Image; known low-priority limitation after Shift+Enter | M14-J.5 proved the first list failure used an incorrectly authored two-item fixture. A corrected three-item record passes persistence, serialization, delivery equality, and normal paste. Triggering that bullet Snippet immediately after Shift+Enter can still lose the first bullet. |

## M14-J.2 Real-Destination Evidence and Correction

Crisp baseline Text delivery from a compatible inline trigger position is authoritative:

```text
Trigger activation: PASS
Trigger disappeared: YES
Copied notice: YES
Focus remained in composer: YES
Ctrl+V inserted content: YES
Formatting retained: FULL
Duplicate/stray content: NO
```

Crisp then exposed a trigger-recognition defect at logical line starts:

```text
text → Enter → ;trigger: FAIL
text → Shift+Enter → ;trigger: FAIL
classification before correction: COMPATIBILITY DEFECT
```

The generic reproduction showed that editor-start and Unicode-whitespace boundaries already passed, while `<br>`, sibling `<div>`, sibling `<p>`, and nested-inline-at-new-block boundaries all failed before clipboard planning. M14-J.2 implements a vendor-neutral structural boundary model and passes all controlled reproductions and real Crisp retests. Current status:

```text
CONTROLLED CORRECTION IMPLEMENTED
CRISP INLINE TEXT: PASS
CRISP ENTER TEXT: PASS
CRISP SHIFT+ENTER TEXT: PASS
FORMATTING: FULL
FOCUS: PASS
```

## M14-J.3 Intercom Shadow DOM Diagnostic Evidence

Real Chrome proves that Intercom receives the trigger characters normally:

```text
Trusted key/beforeinput/input events: PASS
Semicolon arrives normally: PASS
Trigger characters arrive normally: PASS
Space arrives normally: PASS
Trigger-prefix collision: NOT SUPPORTED BY EVIDENCE
Space interception: NOT SUPPORTED BY EVIDENCE
Content-script absence: NOT SUPPORTED BY EVIDENCE
```

The top-document event and Selection are retargeted:

```text
event.target: DIV#teammate-app-react
event.target contenteditable: null
document.activeElement: DIV#teammate-app-react
ordinary Selection: outer/retargeted
```

The same trusted `beforeinput` event exposes the actual editor and edit position:

```text
event.composedPath()[0]: DIV role="textbox" contenteditable="true"
composed path includes: #document-fragment
getTargetRanges(): one collapsed range
target range: #text inside internal <p>, offset 3
```

Classification and implementation state:

```text
COMPATIBILITY DEFECT
GENERIC SHADOW DOM EDITOR RESOLUTION REQUIRED
CONTROLLED SHADOW-DOM CORRECTION IMPLEMENTED
REAL INTERCOM RETEST PASS
```

The correction resolves a supported editor from the trusted event's composed path, validates and converts exactly one collapsed target range inside that editor, and uses the current composed selection for asynchronous cleanup revalidation. It never queries `host.shadowRoot`, so production behavior does not depend on an open ShadowRoot. No Crisp or Intercom production branch, selector, domain check, or destination adapter was added.

Real Intercom validation after M14-J.3 now proves:

```text
Trigger activation: PASS
Trigger cleanup: PASS
Copied notice: PASS
Focus retention: PASS
Manual Ctrl+V: PASS
Ordinary rich Text: PASS
Duplicate/stray trigger content: NO
```

## M14-J.4 List Clipboard Serialization Audit

Intercom list formatting entered M14-J.4 as PARTIAL because the then-current saved fixture appeared to fail. Subsequent M14-J.5 evidence proved that fixture contained only two persisted list items, so it was not valid evidence of a generic simple-list or destination-normalization defect.

The exact pre-M14-J.4 representation for three simple unordered items was already canonical and remains unchanged:

```html
<ul><li>1st line</li><li>2nd line</li><li>3rd line</li></ul>
```

The ordered representation was likewise canonical:

```html
<ol><li>1st line</li><li>2nd line</li><li>3rd line</li></ol>
```

Mixed blocks serialize as direct siblings:

```html
<p>Intro paragraph</p><ul><li>first</li><li>second</li></ul><p>Closing paragraph</p>
```

List items contain direct safe inline content without redundant paragraph wrappers, proprietary markers, styles, comments, or destination metadata. Bold, italic, and safe anchors stay inside their owning `li`. DOM normalization tests confirm three independent `ul > li` and `ol > li` siblings and the expected paragraph/list/paragraph topology. No malformed list nesting or missing item boundary was demonstrated, so no speculative alternative list wrapper or Intercom-specific serializer branch was introduced.

One generic defect was demonstrated for the supported authoring model: an explicit hard break persisted as `\n` inside a rich inline was emitted as a raw HTML newline, which HTML collapses as whitespace. The clipboard-only serializer now normalizes CRLF/CR to LF and emits `<br>` at each supported inline hard break. For example:

```html
<ul><li>first line<br>second line</li></ul>
```

This correction preserves visible content, inline marks, safe links, item ownership, deterministic output, and the persisted `SnippetContent`. It does not turn a hard break into another `li`. Plain-text projection remains unchanged and readable:

```text
- 1st line
- 2nd line
- 3rd line

1. 1st line
2. 2nd line
3. 3rd line
```

M14-J.4 controlled classification:

```text
CANONICAL SIMPLE-LIST SERIALIZATION: PASS / UNCHANGED
GENERIC INLINE HARD-BREAK CORRECTION: PASS
PERSISTENCE AND TEXT/PLAIN: UNCHANGED
```

No generic simple-list defect was found, and no destination-specific branch was added. M14-J.5 subsequently confirmed that the apparent failure matched the malformed persisted fixture exactly; the corrected three-item fixture and normal Intercom paste pass.

## M14-J.5 Real Snippet Diagnostic

The one-shot diagnostic remains available only in the existing `native-dev` options/Library build. It is an explicit local tool for inspecting an exact persisted trigger through the real repository, production serializer, and production delivery planner.

The diagnostic is registered as:

```text
globalThis.aiSupportWorkspaceDiagnostics.diagnoseSnippetListSerialization()
```

It prompts for one exact Snippet trigger and then:

1. reads the matching real record through `DexieSnippetEntryRepository.findByTrigger()`;
2. returns the exact persisted `SnippetContent` plus ordered top-level block/list structure, item counts, item children, inline marks, and hard-break offsets;
3. calls the production `serializeSnippetClipboardText()` implementation;
4. calls the production `SnippetDeliveryPlanner` with the same repository and record identity;
5. returns exact `text/html`, exact `text/plain`, the Text delivery plan immediately before transport, and equality flags comparing that plan with the direct serializer result.

The helper is explicitly invoked, makes no repository mutation, writes no clipboard data, performs no network request, adds no permission, persists no diagnostic data, and logs nothing automatically. Generated-output validation proves the API is absent from the ordinary production build and present only in `native-dev`.

### First capture — invalid test fixture

The first live `;bullet` capture contained two persisted list items, not three. Item 1 contained `1st line`; item 2 contained both `2nd line` and `3 rd line`. Production serialization faithfully returned:

```html
<ul><li>1st line</li><li>2nd line3 rd line</li></ul>
```

```text
- 1st line
- 2nd line3 rd line
```

The delivery planner's HTML and plain-text values both equaled the direct serializer result. The Principal confirmed that the Snippet was authored incorrectly. This capture is classified as `INVALID / INCORRECT TEST FIXTURE`, not an authoring, persistence, serializer, planner, transport, or Intercom defect.

### Corrected capture — three-item list

After correcting `;bullet`, the persisted record contained three independent items: `1st line`, `2nd line`, and `3 rd line`. The exact production serializer output was:

```html
<ul><li>1st line</li><li>2nd line</li><li>3 rd line</li></ul>
```

```text
- 1st line
- 2nd line
- 3 rd line
```

The delivery-plan equality flags were `html: true` and `plainText: true`. The corrected normal Intercom paste rendered all three bullets.

Current layer classification:

```text
Layer A — corrected real persisted structure: PASS
Layer B — exact real serializer output: PASS
Layer C — exact real delivery payload comparison: PASS
Layer D — normal Intercom destination paste: PASS

FIRST CAPTURE: INVALID / INCORRECT TEST FIXTURE
CORRECTED CAPTURE: THREE INDEPENDENT LIST ITEMS
NO AUTHORING/PERSISTENCE PRODUCT DEFECT
NO GENERIC SIMPLE-LIST SERIALIZER DEFECT
NO NORMAL INTERCOM LIST-NORMALIZATION DEFECT
```

The retained explicit command is:

```js
await globalThis.aiSupportWorkspaceDiagnostics.diagnoseSnippetListSerialization()
```

This seam remains production-excluded and does not alter clipboard or destination behavior.

## Text Representation Coverage

The M14-I serializer and transport tests continue to cover deterministic `text/plain`, safe `text/html`, paragraphs, multiline text, bold, italic, safe links, bullet lists, and numbered lists. M14-J.4 adds exact and DOM-normalized coverage for three-item `ul`/`ol` output, paragraph/list siblings, inline marks, explicit hard breaks, and empty supported list structures. M14-J.5 confirms the corrected real record, exact serializer output, delivery payload equality, and normal Intercom list paste.

Plain-text controls are not required to retain rich formatting. Their expected compatibility outcome is deterministic plain text. Actual native paste behavior, including how a single-line input handles multiline clipboard text, remains a controlled-browser/manual observation rather than a synthetic-paste assertion.

## Image Representation Coverage

The Windows Image architecture remains the M14-I route: authoritative planning and Decision 42 preparation, second freshness check, `WindowsNativeImageClipboardTransport`, Native Messaging, registered PNG plus CF_DIBV5, exact correlated success, compare-and-swap cleanup, copied notice, and manual native `Ctrl+V`.

M14-J.1 automated fixtures prove that a native Image delivery failure does not mutate either generic or structured contenteditable destinations and does not move focus. Real Crisp and Intercom validation now also proves successful Image activation, exact cleanup, copied notice, focus retention, manual native `Ctrl+V`, visible Image insertion, and no duplicate content. Intercom uses the same generic M14-J.3 Shadow-DOM editor-resolution path; no destination-specific Image path exists.

## Trigger Safety and Focus Findings

Controlled successful-delivery results for all four fixture classes:

```text
trigger activation: PASS
activation Space prevented: YES (only after full synchronous acceptance)
browser activation input observed: NO
exact trigger-only cleanup: PASS
surrounding content preserved: YES
focus preserved: YES
active element after delivery: original editor
selection/caret preserved: YES
caret after cleanup: collapsed at removed-range start
duplicate/stray content: NO
```

Controlled native-failure results for generic and structured contenteditable fixtures:

```text
trigger remains: YES
accepted activation Space remains: NO (consumed as the command)
page content otherwise unchanged: YES
copied-success notice: NO
focus preserved: YES
```

Existing regressions continue to cover textarea failure preservation, stale content, moved caret, changed catalog epoch/revision, rapid request isolation, native routing, and the absence of browser Image fallback.

## Principal Real-Destination Validation Matrix

| Destination and workflow | Result |
| --- | --- |
| Crisp Text — inline | PASS |
| Crisp Text — after Enter | PASS |
| Crisp Text — after Shift+Enter | PASS |
| Crisp bullet/list Text — normal use | PASS |
| Crisp Image | PASS |
| Crisp no-refresh lifecycle recovery | PASS |
| Crisp repeated-reload duplicate safety | PASS |
| Intercom normal Text | PASS |
| Intercom Shadow-DOM trigger resolution | PASS |
| Intercom normal bullet list | PASS |
| Intercom Image | PASS |
| Intercom no-refresh lifecycle recovery | PASS |
| Intercom repeated-reload duplicate safety | PASS |
| Intercom bullet list immediately after Shift+Enter | KNOWN LOW-PRIORITY COMPATIBILITY LIMITATION |

All PASS rows include activation, exact cleanup, copied notice, focus retention, manual native `Ctrl+V`, expected visible content/formatting, and no duplicate or stray trigger content. The limited Intercom sequence can omit the first bullet; it does not invalidate normal list, serializer, planner, Image, or Shadow-DOM results.

## M14-J.6 Lifecycle Recovery Evidence

The Principal validated both supported real destinations without refreshing their already-open pages:

```text
already-open destination
→ reload AI Support Workspace extension
→ do not refresh destination page
→ activate Snippet
→ trigger removed
→ copied notice shown
→ focus retained
→ manual Ctrl+V inserts expected content
```

Intercom no-refresh recovery: PASS. Crisp no-refresh recovery: PASS. Repeated extension reloads against the same open destination also remained idempotent: one activation, one cleanup, one notice, and one clipboard preparation, with no duplicate behavior.

Normal navigation continues to use the static HTTP/HTTPS all-frame content script. Install/update/unpacked-reload and startup recovery use bounded, best-effort programmatic reinjection of the current packaged content script, followed by one idempotent frame runtime and the authoritative current trigger catalog. Decision 44 fixes persistent access at exactly `http://*/*` and `https://*/*`; there is no `tabs`, `file://`, `<all_urls>`, or `clipboardRead` permission.

Final classification:

```text
INTERCOM NO-REFRESH RECOVERY: PASS
CRISP NO-REFRESH RECOVERY: PASS
REPEATED-RELOAD / IDEMPOTENCY: PASS
M14-J: COMPLETE / REAL-BROWSER VALIDATED
```

## M14-K.3 Principal-Approved Automatic-Paste Compatibility Result

The controlled fixtures and real-destination results provide positive evidence across ordinary, structural, and retargeted Shadow DOM contenteditable boundaries. Crisp confirms the non-Shadow structural path; Intercom confirms the M14-J.3 Shadow-DOM path plus ordinary rich Text, normal bullet lists, and Image paste. Both destinations also validate no-refresh lifecycle recovery and repeated-reload duplicate safety. M14-K.2 implements Decision 45's focus-guarded Windows paste through the existing C# companion, with generic Shadow-DOM authorization, strict protocol v2, and no destination branches.

Principal M14-K.3 evidence passes automatic Text and automatic Image in both Intercom and Crisp. For Text, the trigger disappeared, exactly one insertion occurred, `Paste sent` appeared, no manual fallback notice appeared, and composer focus remained. Images automatically pasted successfully in both destinations. Clipboard-only Text and Image pass the permanent manual workflow: trigger cleanup, no automatic insertion, truthful copied/manual notice, one deliberate successful `Ctrl+V`, and preserved focus. Unknown trigger behavior passes with ordinary Space, no Snippet or notice, and preserved focus. Saving clipboard-only → automatic without reloading an already-open Intercom tab takes effect on the next activation and inserts exactly once.

M14-K is Principal-approved, complete, and closed at implementation checkpoint `e34cd76` (`feat: add automatic snippet paste delivery`).

The authoritative successful Intercom Text trace records automatic mode in persisted/worker/frame/branch state; accepted-Space prevention with no activation input; no post-cleanup failure; valid authorization and all focus/caret/selection/structure/lifecycle predicates; no invalidation cause; extension-owned cleanup input; and final `paste-issued`. The native diagnostic records every validation true, same integrity/session, 4 requested and inserted events, last error 0, and struct size 40. These are manual destination results; deterministic automation remains authoritative for the broader stale editor/tab/window/application, modifier, clipboard-sequence, concurrency, unavailable-companion, and no-retry matrix.

## Completed M14-J.6 Reliability Item

M14-J.6 — Content Script Lifecycle Recovery & Always-On Availability is implemented, automated-validated, and real-browser validated. Already-open eligible HTTP/HTTPS pages recover after install/update/unpacked reload and startup without requiring a webpage refresh. A current runtime reconnects or no-ops, while a missing, stale, or obsolete runtime is safely replaced without duplicate listeners, subscriptions, activations, notices, cleanup, or clipboard payloads. Decision 44 is final.

## Preserved Boundaries and Known Limitations

- Text and Windows Image clipboard architecture are unchanged.
- Decisions 42 and 43 are unchanged.
- No browser Image fallback or direct-DOM Snippet insertion was reintroduced.
- The frame catalog remains metadata-only: kind, trigger, and Snippet ID.
- Decision 44 changes host access to exact persistent `http://*/*` and `https://*/*`; ordinary and optional permission sets otherwise remain unchanged, with no `tabs` or `clipboardRead`.
- Protocol-v1 Image behavior and clipboard semantics remain unchanged; strict protocol v2 adds only Decision 45 context capture and one guarded native paste attempt.
- Direct Win32 `SendInput` is implemented only for the fixed guarded Ctrl+V sequence. No AutoHotkey dependency, arbitrary keyboard simulation, synthetic DOM paste, focus stealing, retry, or destination-specific API/adapter exists.
- Production native installer/registration, signing, updater, and version-migration workflow remain unimplemented future distribution work; this does not block current local/development closeout.
- Crisp Text (inline, Enter, and Shift+Enter) and Crisp Image are real-destination PASS. Intercom normal Text, normal bullet list, and Image are real-destination PASS. Intercom bullet-list triggering immediately after Shift+Enter is a known low-priority compatibility limitation and is not a blocker for the normal list, serializer, delivery planner, Image, or Shadow-DOM results.
- Image performance is classified **C — ARCHITECTURAL PERFORMANCE OPPORTUNITY**. Direct PNG preparation measured approximately 0.2 ms for 64×64 and 2.0 ms for 1440×900, while controlled 1440×900 JPEG/WebP-to-PNG conversion measured approximately 1.04–1.06 s and content-free one-shot host startup measured 67.0 ms median / 76.1 ms p95. This is a non-blocking future architecture item and does not reopen M14-J or justify a speculative M14-K closeout change.
