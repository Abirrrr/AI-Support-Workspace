# Testing Strategy

## Testing Philosophy

Testing should be automated wherever practical. The repository should favor a lightweight but reliable quality bar that keeps future milestones safe to evolve.

Vitest is the approved platform for unit, React UI, and integration tests. Playwright is the approved platform for browser-level end-to-end tests. Manual validation remains required when extension behavior cannot be validated reliably through automation.

## Required Checks

- TypeScript type checking
- ESLint
- Prettier formatting checks
- Vitest unit, UI, and integration tests
- Playwright end-to-end tests where practical
- Risk-based manual validation

## Risk-Based Manual Validation

Manual validation must target destructive operations, data-loss or corruption risks, persistence, security-sensitive behavior, external integrations, and core browser-only workflows. Automated tests may carry low-risk, reversible, and readily detectable edge cases when they provide reliable coverage.

Every milestone closeout must state what was manually tested, what was not tested manually, and why each omitted check is non-blocking. Avoid exhaustive manual repetition that does not materially reduce project risk.

## Testing Priorities

- Validate business logic using Vitest unit tests.
- Validate React behavior using Vitest UI tests.
- Validate Dexie storage and retrieval flows through Vitest integration tests.
- Validate browser workflows using Playwright and manual verification where automation is not practical.

### Persistence Integration Tests

Milestone 3 Dexie integration tests use `fake-indexeddb` as an approved development/test-only IndexedDB adapter. Tests must use isolated databases, close and clean them deterministically, and never access extension or user data. Persistence-across-reopen behavior is tested by closing one database instance and reopening the same isolated test database through a new instance.

Milestone 3 completed this integration coverage with 13 passing persistence tests. The full project Vitest suite passed with 4 files and 15 tests, including UUID, timestamp, deterministic ordering, missing-record, error-wrapping, update, and database close-and-reopen behavior.

### Knowledge Library Tests

Milestone 4 added focused application tests for repository delegation, persistence-error propagation, and deterministic ordering; React UI tests for loading, existing and empty states, create, edit, delete confirmation, immediate list updates, and safe user-visible errors; and an integration test proving that the application workflow persists through the real Knowledge repository and Dexie boundary. The full project Vitest suite passed with 7 files and 25 tests.

### Snippet Library Tests

Milestone 5 added focused application, React UI, and application-to-Dexie integration coverage for the Snippet Library. The focused Milestone 5 suite passed with 3 files and 11 tests, and the full project Vitest suite passed with 10 files and 36 tests. Validation covered the empty state, immediate create and edit behavior, confirmation-protected deletion, persistence through the real Snippet repository and Dexie boundary, and regression coverage for the existing Knowledge Library.

### Retrieval Engine Tests

Milestone 6 added focused deterministic unit coverage for the Retrieval Engine v1 algorithm defined in `DECISIONS.md`. Query normalization coverage includes case, punctuation, Unicode letters and numbers, whitespace, repeated query terms, NFKC behavior, exact-token behavior, and empty or punctuation-only queries.

Field and scoring coverage includes title, tags, Knowledge `body`, Snippet `content`, multiple-field matches, exclusion of Knowledge `source`, exact 5/3/1 field weights, and proof that repeated query or field terms do not inflate scores.

Ranking and result coverage includes score-descending order, `createdAt` tie-breaking, `id` tie-breaking, zero-score exclusion, separate Knowledge and Snippet collections, explicit result domain kinds, empty inputs, return of every positive-score result without a fixed limit, and deterministic repeated executions over identical inputs.

Read-only tests verify that retrieval does not modify supplied or persisted records. Focused integration coverage persists Knowledge and Snippet records through the real repositories in an isolated IndexedDB environment, retrieves them through the existing repository boundaries, and verifies deterministic ranking without duplicating the Milestone 3 persistence contract suite.

Focused Milestone 6 validation passed with 2 files and 14 tests. The full project Vitest suite passed with 12 files and 50 tests. Dependency installation, linting, the final formatting check, type-checking, Playwright discovery of 1 test, the production WXT build, generated Manifest V3 validation, and `git diff --check` also passed.

### Prompt Builder v1 Tests

Milestone 7 added deterministic unit coverage at the headless application boundary. Input validation proves that Context only, Guidance only, Context plus Guidance, Context plus retrieval, Guidance plus retrieval, and Context plus Guidance plus retrieval are valid; retrieval-only and completely empty input are invalid; whitespace-only Context or Guidance is empty; and minimal Guidance such as `follow up` is valid.

Assembly coverage verifies the exact canonical order of instructions, optional Guidance, optional Merchant Context, Knowledge, and Snippets; correct omission of empty optional sections; explicit and separate section kinds; and identical output for identical input.

Retrieval handling coverage proves that M6 order is preserved, the first five Knowledge and first three Snippet results are selected, fewer available results are included without padding, no reranking occurs, and supplied retrieval results and records are not mutated.

Semantic coverage verifies that the static default instructions encode `Guidance > Merchant Context > Knowledge > Snippets`; Knowledge and Snippets remain distinct section kinds; provider-facing Knowledge uses approved human-readable record material without automatically injecting source, tags, scores, or IDs; and provider-facing Snippets do not automatically inject tags, scores, or IDs.

Boundary coverage verifies that Prompt Builder invokes no retrieval operation, emits no provider-specific structure, persists nothing, changes no database schema, and depends on no UI or browser behavior.

Focused Milestone 7 validation passed with 1 file and 22 tests. The full project Vitest suite passed with 13 files and 72 tests. Dependency installation, linting, the final formatting check, type-checking, Playwright discovery of 1 test, the production WXT build, generated Manifest V3 validation, and `git diff --check` also passed.

### Ollama Provider v1 Tests

Milestone 8 added deterministic Vitest coverage for the project-owned `GenerationProvider` contract and `OllamaProvider` adapter. Tests inject a fetch-compatible transport and make no real network request during the normal automated suite.

Contract coverage verifies provider identity, model validation and preservation, the minimal `GenerationResult`, and confinement of raw Ollama types to the adapter. Translation and transport coverage verifies exactly one Instructions system message, one deterministic JSON user message in Guidance, Merchant Context, Knowledge, and Snippets key order, metadata exclusion, input immutability, the exact fixed local POST request with `stream: false`, use of the injected transport, and `AbortSignal` forwarding.

Success and failure coverage verifies generated-text mapping and the focused `ProviderUnavailableError`, `ModelUnavailableError`, `ProviderRequestError`, `ProviderResponseError`, and `GenerationCancelledError` boundary. Boundary coverage verifies no React, persistence, Chrome API, provider SDK, real-network, provider registry, Prompt Builder mutation, or Chrome UI dependency.

Focused Milestone 8 provider validation passed with 1 unit test file and 30 tests. The normal full Vitest suite passed with 102 tests and skipped 1 opt-in live Ollama integration test when `OLLAMA_LIVE_MODEL` was absent. `pnpm install`, `pnpm lint`, `pnpm format --check`, `pnpm typecheck`, `pnpm test`, `pnpm exec playwright test --list`, `pnpm build`, generated Manifest V3 validation, and `git diff --check` also passed. The generated manifest retained no `permissions`, `host_permissions`, or `side_panel`.

Real local interoperability validation used the real `OllamaProvider`, fixed localhost `/api/chat` endpoint, and `OLLAMA_LIVE_MODEL=qwen2.5:7b`. The request succeeded and produced a non-empty `GenerationResult` in approximately 25 seconds. This smoke test proves provider/API interoperability only and makes no model-quality claim.

The live integration test remains explicitly opt-in and has an individual 120-second test-only timeout because local model loading and generation can legitimately exceed Vitest's normal 5-second timeout. This does not change production behavior: `OllamaProvider` has no internal timeout, and the normal automated suite requires neither Ollama installation nor a running Ollama service.

### Output Workspace v1 Tests

Milestone 9 added deterministic unit coverage for `OutputWorkflow`. Query cases include Context only, Guidance only, Context plus Guidance joined by exactly `\n\n`, and omission of whitespace-only inputs. Tests verify one Retrieval Engine call per workflow, valid empty results, original Context and Guidance plus prepared results passed to Prompt Builder, the resulting `PromptAssembly` passed through `GenerationRequest`, the trimmed UI model reaching that request, one `GenerationProvider` invocation, returned `GenerationResult`, and no Ollama-specific response dependency.

Workspace component coverage includes the initial empty state; manual Context, Guidance, and model inputs; disabled Generate behavior; every valid primary-input combination; invalid blank model behavior; generating state and duplicate prevention; successful editable output; repeated Generate; preservation of prior output after a later failure; safe validation, retrieval, and provider error mappings; Copy from edited output; Copy success and failure; and narrow Side Panel layout behavior. Tests use a fake or stub workflow/provider boundary and never require real Ollama.

Side Panel and generated-manifest validation proves that the WXT Side Panel entry point exists, builds as `sidepanel.html`, and is referenced by `side_panel.default_path`; `permissions` contains exactly `sidePanel`; `host_permissions` contains exactly `http://localhost/*`; and no `tabs`, `activeTab`, storage, clipboard, scripting, `127.0.0.1`, broad host, or unrelated permission is introduced. No standalone Workspace tab exists as the M9 surface.

Popup tests must verify that direct Open Workspace user interaction opens the Side Panel for the current browser window, Open Libraries preserves options-page behavior, and no background message is introduced solely to open Workspace. Existing `OutputWorkflow` and Workspace component tests remain applicable to the Side Panel-hosted view without changing application behavior. Regression coverage must preserve popup and Library navigation, Knowledge and Snippet workflows, persistence, Retrieval Engine, Prompt Builder, Ollama Provider, and the production extension build.

Decisions 40 and 54 assign the future Workspace Shell correction to M15; they do not change the current M9 test baseline. When implemented, automated generated-manifest and shell coverage must prove that a popup-free toolbar `action` exists, has no `default_popup` or competing popup behavior, retains `side_panel.default_path` and `options_ui`, idempotently sets `openPanelOnActionClick`, and adds no permission beyond the existing `sidePanel` requirement. Retire/replace popup component, popup-open, and build assertions that require `popup.html`. Component/navigation coverage must prove an icon-only Settings button is in the Side Panel title row, has exact accessible name `Open Settings and Libraries`, visible focus and native keyboard behavior, invokes `chrome.runtime.openOptionsPage()` exactly once, maps rejection to safe non-blocking announcement, and creates no full-width Library button or menu. Existing Options navigation, narrow Workspace layout, and selected-text keyboard shortcut remain unchanged. Real Chrome must prove toolbar action-click open/toggle behavior with no popup, gear-to-Options navigation, keyboard accessibility, and unchanged permissions.

M9 required real Chrome validation because it introduced the Side Panel surface and the first extension-origin request to Ollama. That validation passed for extension and popup loading; Open Workspace opening the global Side Panel beside the active webpage; narrow-width usability; Open Libraries opening options; Context, Guidance, transient model, Generate eligibility and status; real `qwen2.5:7b` generation; editable output; exact edited-output Copy with line breaks; repeated generation; Guidance influence; output preservation after failures; safe unavailable-provider and missing-model behavior; exact permissions; and Knowledge and Snippet Library regressions. The installed `chrome-extension://<extension-id>` origin was allowed through external Ollama `OLLAMA_ORIGINS` configuration; the extension does not automate that setup.

Manual diagnosis uncovered a browser-runtime fetch-binding defect: storing native `globalThis.fetch` unbound and invoking it through the provider instance caused `TypeError: Illegal invocation`, which the transport catch surfaced as `ProviderUnavailableError`. The production transport now binds fetch to `globalThis`, request construction occurs outside the transport catch, and regression tests verify both browser-compatible default construction and correct availability-error classification.

Final M9 validation passed with 136 tests and 1 opt-in live Ollama test skipped in the normal suite. A focused provider, workflow, and Workspace UI regression run passed 60 of 60 tests. `pnpm install`, linting, formatting, type-checking, the normal Vitest suite, Playwright discovery of 1 test, production build, generated-output and manifest validation, and `git diff --check` passed. The normal suite remains independent of Ollama.

### Selected-Text Keyboard Command v1 Tests

Milestone 10 generated-manifest coverage proves exactly one normal command named `capture-selection-to-workspace`, description `Capture selected text in AI Support Workspace`, suggested default `Ctrl+Shift+Space`, macOS suggestion `Command+Shift+Space`, and no global scope. The generated permission set contains exactly `sidePanel`, `activeTab`, and `scripting`; host permissions remain exactly `http://localhost/*`; the existing `https://example.com/*` persistent content-script match remains unchanged; and `tabs`, storage, `clipboardRead`, `clipboardWrite`, broad site access, `<all_urls>`, permanent support-site hosts, `127.0.0.1`, and unrelated permissions remain absent.

Background command coverage verifies listener registration, recognition of only the approved command, safe ignoring of unknown commands, and safe use of the command-provided tab and window. Structural sequencing tests prove that selection capture is invoked first, Side Panel opening is invoked immediately afterward, no awaited asynchronous boundary occurs between those invocations, and capture/open outcomes are handled independently. Coverage distinguishes capture success, empty, and failure from panel-open success and failure, defers delivery until capture settles to a typed result, and avoids delivery when panel opening fails. It also covers global current-command-window opening, repeated open/activate behavior without toggling or closing, and safe missing-tab, missing-window, scripting, and Side Panel failures without raw Chrome errors.

Selection-extraction coverage includes exact normal document and contenteditable selection, selected substrings from textarea and supported text-capable input ranges, Unicode and line-break preservation, leading and trailing whitespace preservation when the result contains non-whitespace, whitespace-only empty behavior, exclusion of surrounding page content, and active-tab main-frame-only targeting. Tests prove no arbitrary conversation-DOM scraping, cross-frame capture, screenshot capture, or persistent content-script expansion.

Typed delivery coverage proves that already-mounted and newly opened Side Panels receive each result with a delivery ID; the mount race is handled through readiness-triggered retry; the Side Panel acknowledges only after applying the result or feedback; only a matching acknowledgement removes the queue head; failed or mismatched acknowledgement retains the transient delivery; and no Dexie, `localStorage`, `chrome.storage`, generic event bus, durable queue, or other persistent capture mechanism is used.

Workspace coverage proves that successful capture replaces Merchant Context exactly; preserves Guidance, model, generated or edited Output, and any active generation request; never invokes Generate; calls the Guidance focus path; and places a collapsed caret at the end of existing Guidance without selecting, replacing, or modifying its content. In JSDOM, `document.activeElement` and the selection range prove only the requested focus and caret state inside the Side Panel document. Tests prove Merchant Context does not receive requested final DOM focus. Empty selection and restricted or failed capture preserve existing Context and Output, show the approved safe feedback, avoid forcing Guidance focus or unrelated focus movement, and hide raw Chrome errors. Regression coverage preserves the M9 Workspace, popup, Libraries, Retrieval Engine, Prompt Builder, Ollama Provider, generation, Copy, and production build.

Normal M10 tests use controlled Chrome and provider boundaries. They require neither a live Ollama service nor a real model.

Controlled Chrome API fakes cannot faithfully prove preservation of Chrome's transient keyboard-command user activation. Automated tests enforce invocation ordering and settlement behavior, while real Chrome validation owns proof that `chrome.sidePanel.open({ windowId })` is initiated synchronously enough to remain eligible; final M10 validation passed that browser contract. The validated runtime sequence starts `chrome.scripting.executeScript(...)`, immediately starts `chrome.sidePanel.open(...)` without awaiting capture, and only then observes both outcomes. Tests reject orchestration that awaits capture before invoking Side Panel opening, but mock success does not prove the real browser gesture contract.

Automated focus assertions also cannot prove Chrome WebContents activation or which surface receives physical keyboard input. Final real Chrome validation verified immediately usable Guidance focus when a closed panel opened. Repeated invocation with the panel already visible passed capture, delivery, exact Context replacement, state preservation, and the internal Guidance DOM focus/caret assertions while the webpage retained browser-level keyboard routing; that outcome is the approved platform limitation, and the user may need to click Guidance.

Production build output reported a cross-world extension-resource mismatch and a generated preload reported unused shortly after load. These are non-blocking WXT/Vite/Chrome generated module-preload warnings: application source does not explicitly create the preload links, no functional failure or duplicate module execution was identified, and M10 authorized no WXT/Vite build configuration change. Any future build optimization remains separate from M10 and requires functional or performance evidence.

Final M10 validation passed the focused M10 and Workspace tests. The full Vitest suite passed 171 tests with the one opt-in live Ollama test skipped in the normal suite. Lint, `pnpm format --check`, type-checking, Playwright discovery of 1 Chromium infrastructure test, the production WXT Chrome MV3 build, generated-output and manifest validation, and `git diff --check` passed. Only expected Windows LF-to-CRLF notices occurred. No live Ollama test was required or run for M10.

### Saved Default Model Settings v1 Tests

Milestone 11 added deterministic domain/application coverage proving that a missing Settings record resolves to `{ defaultModel: null }`; save normalization trims outer whitespace; empty or whitespace-only input saves `null`; non-empty opaque model identifiers are otherwise preserved; and persistence load/save failures map through focused safe application behavior without exposing raw Dexie errors.

Dexie integration coverage starts with an isolated version 1 database containing representative Knowledge and Snippet records, opens it through the version 2 declaration, and proves that both Library domains remain unchanged. It proves that the version 2 `settings` table exists with only the `id` primary key, no unrelated table or index changes occur, no Settings record is created automatically, the `global` singleton saves and reloads, `null` persists as the clear state, and database close/reopen retains the saved aggregate. Test databases remain isolated and deterministic through `fake-indexeddb`.

Settings UI coverage proves the focused loading state; blank first-run input; population from a saved model; disabled Save during loading and saving; normalized unchanged/dirty behavior; explicit successful save; clear-to-null; safe load and save errors; the exact success and failure messages; associated label/help semantics; keyboard-operable Save; natural focus order; live status feedback; and narrow options-page usability. Navigation may discard unsaved changes, no confirmation is required, and last successful save wins.

Workspace coverage proves that the composition boundary resolves Settings before establishing editable model state; a saved value initializes the model; missing or null Settings initializes blank; load failure initializes blank with `Couldn't load the saved model. Enter a model manually.`; no asynchronous load overwrites typed text; a transient Workspace override is not persisted; Generate receives the current Workspace field through the unchanged `GenerationRequest`; reopening a new instance reloads the saved default; and an already-mounted panel requires no live synchronization, runtime message, or database subscription.

Regression coverage preserves M9 Workspace generation and state, M10 selected-text capture and focus behavior, popup navigation, Knowledge and Snippet Libraries, Retrieval Engine, Prompt Builder, `OllamaProvider`, the exact generated manifest, and the production build. Delayed-bootstrap coverage proves no capture readiness or acknowledgement occurs before Workspace subscription and that pending delivery completes after readiness. Normal M11 tests require no live Ollama service or installed model.

Final focused M11 validation passed 69 tests in 9 files. The full normal Vitest suite passed 200 tests in 25 files with 1 opt-in live Ollama test skipped in 1 file, for 201 total tests across 26 files. Lint passed with zero warnings, formatting and type-checking passed, Playwright discovered 1 Chromium test in 1 file, the production Chrome MV3 build and generated-output/manifest validation passed, and `git diff --check` passed with only expected Windows LF-to-CRLF notices. The skipped automated live-provider test was not run.

Real Chrome validation confirmed options-page and Settings navigation; blank first-run state and initially disabled Save; save and reload persistence using `qwen2.5:7b`; new Side Panel initialization; transient Workspace override and generation using the current field; close/reopen restoration of the saved default; clear-to-null behavior; Knowledge and Snippet preservation after migration; M10 selected-text capture with preserved manual model and no automatic Generate; popup navigation; unchanged permissions; and real Ollama generation with the installed model. Persistence load/save failure UI remained covered by automated tests; manual database fault injection was not required or performed.

### Import / Export v1 Test Contract

Milestone 12 automated tests cover the following without requiring a live Ollama service:

- exact strict version 1 envelope, identifier, required keys, forbidden extra or dangerous keys, independent format versioning, valid UTC `exportedAt`, and safe unsupported-version handling;
- empty persisted state; exact Knowledge, Snippet, and Settings fields and types; UUID and timestamp validation; missing physical Settings resolved to `null`; populated and null Settings; no physical Settings ID; duplicate IDs; empty arrays; and complete-file rejection when any nested value is invalid;
- exclusion of transient Workspace, browser/page, provider, secret, and fields outside frozen Backup Format v1;
- deterministic Knowledge and Snippet ordering by `createdAt` then `id`, exact text and tag-order preservation including Unicode, line breaks, and special characters, exact UTC metadata and filename formatting, UTF-8 serialization, object-URL creation/revocation, and export success/failure mapping;
- aligned 25 MiB import `File.size` and serialized-export UTF-8 limits, rejection before import reading, and the absence of extra record or field limits;
- file read and JSON parse failures, no persistence before complete validation, safe errors without raw details, no evaluation or executable rendering, and HTML-like values retained as plain strings;
- fourth options-page-section navigation; Export and file-selection actions; preview filename, timestamp, counts, saved-model/null rendering; no bodies/content/diff; replacement-file, validation-failure, success, and Cancel resets; warning; acknowledgement; native disabled state; busy states; success summary counts; failure behavior; focus and label behavior; privacy warning; live announcements; and every exact M12 message;
- one replace-only application operation, bypass of ordinary create/update semantics, preservation of all IDs/timestamps/tags/source metadata, Settings string and null restore, valid empty restore, no partial writes, existing-state preservation after failure, and ordering-independent export/restore round-trip equivalence;
- one isolated Dexie read/write transaction across all three existing stores, exact physical mapping including Settings `global`, complete rollback after forced clear or write failures at each store boundary, and no schema version or index change;
- options-page-local post-restore refresh without restart or application-wide broadcast, no already-mounted Side Panel live sync, and correct restored-default behavior after Side Panel recreation;
- regressions for Knowledge, Snippets, Settings, Workspace, M10 capture, popup navigation, Retrieval, Prompt Builder, Ollama provider, generated manifest, permissions, and production build.

The tests also prove that the implementation introduces no merge, selective restore, per-Library import, drag-and-drop, pasted JSON, JSON editor, router, extension page, event bus, subscription framework, encryption, compression, ZIP, signing, cloud/scheduled behavior, schema migration, permission, dependency, or configuration change.

Final M12 automated validation passed: 48 focused tests; 251 full-suite tests with 1 existing opt-in test skipped; lint; formatting; type-checking; Playwright discovery; production build and output validation; and `git diff --check`. Source review and automated integration tests verified atomic transaction and rollback behavior.

## Manual Verification Requirements

Browser-specific interactions such as selection capture, extension permissions, and Intercom behavior require manual verification. These behaviors were not applicable to Milestone 0 and should not be treated as fully automatable when later milestones introduce them.

No Milestone 3-specific manual Chrome validation was required. Its persistence boundary is validated more appropriately through isolated IndexedDB integration tests, and adding temporary browser UI solely for manual persistence testing would violate the approved milestone boundary. Regression validation confirmed that the existing Manifest V3 extension shell remains operational.

Milestone 4 manual Chrome validation confirmed that popup navigation opens the Knowledge Library on the existing options-page surface, creation and editing appear immediately and persist across reload or reopen, deletion cancellation preserves the record, confirmed deletion remains effective after reload or reopen, and the tested Knowledge Library workflow reports no runtime problems.

Milestone 5 manual Chrome validation confirmed that popup navigation opens the existing Library surface, lightweight local tab navigation opens the Snippet Library, its empty state works, create and edit changes appear immediately and persist across reload or reopen, deletion cancellation preserves the record, confirmed deletion remains effective after reload or reopen, the Knowledge Library remains operational, and the tested workflow reports no runtime problems.

No Milestone 6-specific manual Chrome validation was required. Retrieval Engine v1 is a headless application boundary, its deterministic algorithm is covered by unit tests, and its real repository behavior is covered by isolated IndexedDB integration tests. Adding temporary browser UI solely to demonstrate retrieval would violate the approved milestone scope. Existing extension build and runtime regression validation passed.

No Milestone 7-specific manual Chrome validation was required. Prompt Builder v1 is a headless application boundary with no browser UI or runtime interaction, and deterministic unit tests comprehensively cover its behavior. Adding temporary browser UI solely to demonstrate prompt composition would violate the approved milestone scope. Existing production build and Manifest V3 regression validation passed.

Milestone 9 manual Chrome validation passed after the native-fetch binding correction. It covered the global Side Panel surface beside the active webpage, narrow-width operation, real local generation, output editing and Copy, repeated generation, Guidance influence, safe missing-model and provider-unavailable feedback with prior-output preservation, expected options-page Library navigation, both Library regressions, and absence of blocking Chrome runtime or network errors.

Milestone 10 real Chrome validation is complete. The command appeared in `chrome://extensions/shortcuts`; the suggested `Ctrl+Shift+Space` conflicted with Text Blaze; Chrome-native remapping to `Ctrl+Shift+Y` succeeded; and the remapped command dispatched correctly without changing the manifest default. Real Chrome proved capture-first invocation, immediate Side Panel open invocation without an intervening await, successful parallel settlement, and typed transient delivery.

First invocation passed panel opening, exact normal-page selection capture, exact Context replacement, immediately usable Guidance focus with a collapsed end caret, and no automatic Generate. Repeated invocation kept the panel open, captured and replaced Context again, preserved Guidance, model, and Output, and did not Generate. The internal focus/caret request passed while Chrome retained webpage keyboard routing and required a click in Guidance; this is the documented non-blocking host/WebContents limitation rather than an implementation failure.

Empty selection preserved Context and Output, showed `Select text on the page, then use the shortcut again.`, and did not Generate. A restricted Chrome page preserved Context and Output, showed `Couldn't capture selected text from this page. Copy and paste it into Merchant Context.`, exposed no raw Chrome error, and did not Generate. Textarea validation captured only the exact selected substring with line breaks; contenteditable validation captured only the selected text and safely reduced formatting to text. State-preservation validation confirmed exact Context replacement with Guidance, model, and Output unchanged.

Generate regression completed with the newly captured Context and preserved Guidance, and Output displayed normally. Copy regression succeeded with line breaks preserved. Popup Open Workspace and Open Libraries worked, and the Knowledge and Snippet Libraries loaded normally. These checks complete the required M10 manual validation.

Milestone 11 real Chrome validation is complete. Settings was visible as the third options-page section; first-run input was blank with Save disabled; existing Knowledge and Snippet records survived the version 2 migration; saving `qwen2.5:7b` showed `Settings saved.` and survived options-page reload; and a newly recreated Side Panel initialized the exact saved value without a warning. A temporary `temporary-test-model` Workspace override did not save and closing/reopening restored `qwen2.5:7b`. Real local generation with `qwen2.5:7b` completed and displayed output normally. Clearing the setting saved `null`; options reload and a new Side Panel both remained blank. `Ctrl+Shift+Y` capture still replaced Merchant Context, preserved a manually entered Workspace model, and did not generate automatically. Popup Open Workspace and Open Libraries worked, permissions remained unchanged, and no visible error occurred in these flows. Persistence failure UI was validated through automation rather than manual database fault injection.

Milestone 12 risk-based real Chrome validation is complete. The manual session covered the critical M12 risks:

- backup export and download;
- filename, envelope, version, and exact approved keys;
- preview and destructive acknowledgement;
- successful full restore;
- Knowledge, Snippets, and Settings restoration;
- round-trip data equality, including IDs, timestamps, tags, and source;
- invalid JSON rejection;
- unsupported-version rejection;
- failed validation preserving existing data;
- valid empty-backup replacement;
- normal backup restoration afterward; and
- restored default-model loading in a recreated Side Panel.

The already-mounted Side Panel live-refresh edge case was not repeated manually. Its approved behavior is no live refresh, and source review plus automated coverage verify that contract; manual recreation proved the restored default loads in a new Side Panel. The manual oversized-file exercise was also not repeated because the aligned size guard and rejection path are reliably covered by automated tests and failure is reversible and readily detectable. Both omissions are non-blocking.

The original M12 checklist remains represented by the completed automated and manual evidence above: critical destructive, atomicity, preservation, persistence, format-contract, and browser download/restore behaviors received real Chrome coverage, while low-risk and reversible edge cases were carried by reliable automation and existing regression evidence. No exhaustive manual repetition was required where it would not materially reduce project risk.

## Snippet Trigger Expansion v1 Validation Contract

M13-B automated validation must cover:

- canonical locale-independent lowercase normalization; accepted `;hello`, `;refund2`, and `;shopify-limit`; exact 2–32 total length; the pattern `^;[a-z0-9]+(?:-[a-z0-9]+)*$`; and rejection of missing semicolon, whitespace, underscores, non-ASCII characters, unsupported punctuation, consecutive/trailing hyphens, and overlength values;
- explicit `trigger: null`, existing Snippet compatibility, create/edit/delete behavior, duplicate precheck feedback, authoritative unique-index collision mapping, immediate trigger release after edit/delete, and no fuzzy or partial lookup;
- forward-only Dexie version 2-to-3 migration, preservation of all Knowledge/Snippet/Settings records, absent physical trigger mapping to domain `null`, canonical non-null persistence, omitted physical property for null, unique `&trigger` index, reopen behavior, and no unrelated schema/index change;
- frozen exact Backup Format v1 import with v1 Snippets mapped to null triggers and the exact trigger-loss preview warning; version 2 export with explicit required trigger; strict v2 exact-key, canonical trigger, type, length, and duplicate validation; deterministic ordering; v2 round trip; unsupported-future-version rejection; 25 MiB guards; explicit mappings; atomic three-store rollback; and failed-validation data preservation;
- service-worker catalog construction containing only delivery kind, canonical trigger, and Snippet ID; explicit absence of Snippet content, generated HTML, Blob, base64, asset ID, filename, MIME type, and image bytes from frame snapshots; one long-lived typed `chrome.runtime.Port` per matched frame; port connection and initial complete validated snapshot; ordered invalidation and refresh; immediate cache clearing and disabling on disconnect; reconnection snapshot requirement; worker-restart epoch replacement; stale snapshot and older-epoch rejection; normal typing while disconnected; no activation from a pre-mutation snapshot after disconnect or invalidation; pre-create/edit/delete/import/restore invalidation of every connected frame; complete refresh after success; unchanged republish after persistence failure; affected-frame disablement after publication failure; preservation of the M13-B.1 publication barrier; and absence of Dexie, `chrome.storage`, `localStorage`, a durable queue, polling, or per-keystroke service-worker lookup in content scripts;
- trusted cancelable Space `beforeinput` activation, composition exclusion, collapsed-selection requirement, editor-start/whitespace left boundary, exact candidate range immediately before the caret, maximum bounded look-behind, case-insensitive catalog match through canonicalization, and no scan or replacement elsewhere;
- single-line Snippet expansion in supported absent/text/search inputs; multiline Snippet safe fallback in those inputs before Space prevention; no host-value mutation when the input adapter declines; and no flattening, truncation, normalization, or partial insertion to fit a single-line input;
- complete single-line and multiline preservation in textarea and contenteditable; textarea replacement through exact selection ranges; contenteditable replacement across safe adjacent text nodes with block/`br`/embedded/root stops and safe text-node plus `<br>` insertion; exact Snippet and appended-space preservation; surrounding text and line-break preservation; bubbling composed host input notification; and caret collapse after the appended space;
- normal Space fallback for a multiline match in a single-line input, missing/partial trigger, selected text, unsupported or password/specialized editor, unsafe contenteditable range, noncancelable event, invalid/unavailable cache, disconnected port, messaging failure, paste, programmatic input, and composition;
- prevention of recursive expansion from inserted Snippet text and prevention of duplicate handling across nested editable targets or frames;
- Snippet Library Trigger input guidance, canonical value display, inline invalid and duplicate feedback, trigger list display, triggerless editing, accessibility, narrow layout, and unchanged plain-text content editing;
- isolated-world regression coverage proving a structurally valid Space `beforeinput` reaches the controller without current-global `InputEvent` identity; trusted/cancelable, input type, data, composition, and fail-open requirements remain enforced; foreign-document or iframe-realm textarea, absent/text/search input, contenteditable, text-node, and internally created Range handling does not depend on current-global constructor identity;
- framework-shaped nested contenteditable coverage proving exact candidate-only replacement, preceding-text preservation, caret placement, one bubbling composed input notification, no synthesized change event, and no HTML execution; and
- generated manifest/content-script validation for exact matches `http://*/*` and `https://*/*`, `allFrames: true`, frame-local operation, and absence of the old origin restrictions, `match_about_blank`, fallback-origin injection, `<all_urls>`, `file://`, clipboard/storage permissions, new provider hosts, or unrelated configuration; and
- regressions proving unchanged Knowledge, Settings, Import/Export integrity, popup, Side Panel, M10 capture, Retrieval Engine, Prompt Builder, `GenerationProvider`, `OllamaProvider`, generation, Copy, permissions outside the approved content-script match, and production build. Normal M13 tests require no Ollama or AI provider.

Risk-based M13 manual validation must cover a supported single-line input with both successful single-line expansion and multiline decline without host-value mutation; complete multiline preservation in a normal textarea and generic contenteditable editor; Intercom or the current primary support editor; exact Space activation and miss fallback; surrounding-content, line-break, host-input, and caret behavior; create/edit/delete cache refresh; disconnect and service-worker reload recovery; v2 export and restore preserving triggers; v1 import producing triggerless Snippets; and existing popup, Libraries, selected-text capture, Settings, Side Panel generation, and M12 backup workflows. Password or unsupported editors must preserve normal typing without content capture.

M13-B.2 automated validation did not substitute for real Chrome proof. After Principal Engineer source review, the product owner rebuilt and reloaded the extension and completed Chrome validation. A saved trigger expanded in the real Intercom editor; replacement preserved surrounding content and left the caret after the Snippet and trailing space; multiline content expanded correctly; editing and deleting Snippets updated or invalidated the live catalog without reloading Intercom; expansion passed on another normal website; and unknown or deleted triggers preserved normal typing.

The manual evidence covers those tested workflows only. It does not claim every website or editor framework was exercised. Chrome-protected, browser-internal, extension, `file://`, and unsupported-scheme pages remain unavailable; unsupported or unsafe editor structures fail closed. Automated tests carry the additional editor, input fallback, persistence, schema, catalog, backup, manifest, and regression combinations described above.

Low-risk pattern permutations, forced IndexedDB rollback branches, revision-order combinations, and every unsupported input type may remain automated when deterministic coverage is reliable. Closeout must state the exact manual editors and origin tested, any destination-specific adapter used, what was omitted, and why each omission is non-blocking.

## Rich Snippet Templates Validation Contract

M14-A, M14-D, and M14-F.1 are documentation-only. M14-B implements domain/projection and Backup v3; M14-E adds local assets/Dexie v5/Backup v4; M14-G adds lists, the Image contract, isolation, and strict Backup v5; and M14-G.2 adds constrained Tiptap/domain fidelity, unified Library UX, screenshot/file Image authoring, preview lifecycle, and atomic lifecycle coverage. M14-H is absorbed. Remaining acceptance belongs to M14-I unified clipboard delivery/trigger planning and M14-J destination validation.

### Domain and Plain Projection

- Validate exact plain content; plain/rich/image discriminants; exact allowed keys; ordered paragraph, list, and compatibility reference/image blocks; ordered text/link inline nodes; explicit bold and italic booleans; and rejection of recursive, nested-list, unknown, malformed, HTML, or unsupported structures.
- Validate ordinary-link protocols `https:`, `http:`, and `mailto:` and image-reference protocols `https:` and `http:`. Reject executable and unapproved schemes before persistence.
- Prove exact plain-text preservation for Plain content. For Rich content, prove block order, exactly `\n\n` between blocks, list-item `\n` boundaries, unordered `- ` and one-based ordered prefixes, inline order, readable emphasis without markers, link/reference behavior, and that no supported text block disappears. Prove Image Snippets are excluded from text-only Retrieval/Prompt Builder consumers and never emit `[Image]`, asset ID, or filename as delivery text.

### Dexie Version 3 to Version 4 Migration

- Open a representative isolated v3 database through v4 and prove every former content string becomes exactly `{ kind: 'plain', text: formerContent }`.
- Preserve ID, title, tags and tag order, trigger, `createdAt`, and `updatedAt` exactly; do not rewrite timestamps or generate rich content.
- Preserve Knowledge and Settings, the exact `id, createdAt, &trigger` Snippet indexes, physical omission of null triggers, unique-trigger behavior, forward-only reopen behavior, and absence of a new table or unrelated index.

### Backup Formats v1, v2, and v3

- Keep exact frozen v1 import behavior, including string-to-plain mapping, null triggers, and the existing warning. Keep exact frozen v2 import behavior with string-to-plain mapping and trigger preservation.
- Cover exact v3 export/import DTOs, explicit mapping, deterministic ordering, rich round trip, exact plain round trip, and exclusion of simulated future live-domain or physical-record fields.
- Reject unknown/missing/extra/dangerous keys; unknown discriminants, blocks, inlines, marks, references, and URL types; dangerous protocols; invalid IDs/timestamps/triggers; duplicate IDs/triggers; unsupported future versions; and any partially malformed file without repair or persistence.
- Preserve the 25 MiB guards, metadata-only preview and acknowledgement, replace-only atomic three-store restore, rollback after forced failure, failed-validation preservation, and options-page refresh behavior.

### Retrieval Engine and Prompt Builder

- Prove rich Snippets are tokenized, scored, and ranked using only deterministic plain projection while preserving M6 scoring and ordering.
- Prove Prompt Builder receives and emits only projected readable Snippet text, with no content discriminant, block structure, formatting marker, HTML, or DOM leakage and no provider behavior change.

### Transient Catalog

- Validate metadata-only typed catalog payloads containing exactly delivery kind, canonical trigger, and Snippet ID. Assert the absence of Plain/Rich content, generated HTML, Blob, base64, asset ID, filename, MIME type, and image bytes.
- Preserve M13-B.1 port connection, complete snapshot, epoch/revision, invalidation-before-create/edit/delete/import/restore, overlapping-mutation publication barrier, successful rebuild, failed-mutation unchanged rebuild, publication failure, disconnect clearing, stale rejection, and normal-typing fail-closed behavior.
- Prove content scripts remain Dexie-free and no browser-storage catalog, durable queue, polling, surrounding editor data, host data, logs, or provider state enters the payload.
- Preserve Decision 38's legacy Rich local-image exclusion: Plain publication, portable Rich text/list publication, and legacy URL Image Reference publication remain valid while legacy local-image Rich records stay fail-closed with no placeholder, partial insertion, Blob, base64, or asset ID.
- Preserve Decision 39's historical transitional Image-Snippet exclusion coverage, then prove the implemented M14-I typed Image descriptor contains only delivery kind, trigger, and Snippet ID. Binary bytes, base64, asset ID, filename, MIME type, and Snippet content never enter frame snapshots.
- Regress the complete M13-B.1 port, epoch/revision, invalidation, overlapping-mutation publication barrier, rebuild, disconnect, stale-snapshot, and fail-closed behavior across Decision 38 and the implemented typed catalog.

### Trigger Activation and Clipboard Cleanup

- Regress M13 trigger recognition and publication guarantees: trusted Space activation, bounded exact candidate recognition, surrounding-content preservation, no synthetic `change`, isolated-world/cross-realm structural behavior, and normal fallback.
- Prove recognized Text and Image activation synchronously consumes only a fully accepted Space before asynchronous planning, loads authoritative content only after activation, and performs no destination DOM insertion. Rejected activation—including multiline Text in a supported single-line input—must leave ordinary Space untouched.
- Prove catalog identity is checked before planning and rechecked after planning immediately before transport. Initially stale and became-stale-during-planning requests do not write; planner and transport failures remain fail-closed.
- Prove clipboard success precedes cleanup. Exact compare-and-swap cleanup removes only the unchanged trigger from the no-inserted-Space state in textarea, supported text/search input, generic contenteditable, and Shadow-DOM contenteditable, restores the caret at the removed range start, and emits one bubbling composed deletion `input` notification.
- Prove changed text, caret, root, selection, catalog epoch/revision, or request skips cleanup without overwriting user edits. No `innerHTML`, `insertAdjacentHTML`, `DOMParser`, `document.write`, automatic external fetch, generic `<img>` creation, or synthetic paste occurs.

### Snippet Library UI

- Cover Text/Image creation choices, Rich-by-default Text creation, historical Plain draft conversion only on Save, supported Rich reopen, legacy-image read-only preservation, search, All/Text/Images filters, labels, accessible status/errors, and narrow layout.
- Prove the Tiptap adapter round-trips paragraphs, line breaks, bold, italic, safe links, bullet/numbered lists, and marks within list items. Reject unsafe links, unsupported nodes/marks, nested lists, arbitrary HTML persistence, and image ingestion into Text.
- Preserve M14-C as historical regression coverage while M14-G.2 supersedes its block/segment and explicit conversion UI. Cancel leaves stored content unchanged and failed Save retains the current draft.

### M14-E Local Asset Foundation and Dexie v5

- Prove PNG/JPEG/WebP Blob round trip, exact MIME/signature/byte validation, and rejection of SVG, HTML, unsupported MIME, malformed bytes, spoofed MIME, unsafe sizes, and non-integer size metadata.
- Enforce 5 MiB per asset, 20 MiB per Snippet, and 40 MiB project/profile aggregate limits before persistence; test exact boundary values and rollback.
- Prove each asset has one Snippet owner; reject missing/foreign references and orphan assets; create a distinct asset for repeated insertion; and cascade Snippet deletion atomically.
- Prove new draft assets persist only with successful Save, Cancel creates no record, existing-asset removal remains draft-only until Save, failed Save preserves prior content/assets, and multi-store transactions leave no partial record.
- Cover fresh Dexie v5 creation, v4-to-v5 migration without Snippet rewrite or URL fetch, v5 reopen, preserved v1-v4 declarations/indexes, exact new indexes, and all existing Plain/Rich/trigger/Settings/Knowledge regressions.

### M14-E Backup Format v4

- Prove one-file JSON export/import round-trips exact binary bytes, MIME, size, filename, timestamps, asset/Snippet identity, local block order, legacy references, and deterministic `createdAt`/ID asset ordering.
- Preserve frozen v1/v2/v3 import behavior and exact DTO isolation. Do not allow local asset fields into old versions or remote URL fetching in any version.
- Enforce the 96 MiB serialized guard, canonical base64, decoded-length equality, MIME signatures, per-asset/per-Snippet/project limits, and safe allocation order.
- Reject malformed or unsupported assets, missing assets, foreign ownership, unreferenced assets, duplicate asset/Snippet/Knowledge IDs, duplicate triggers, unknown/extra/dangerous keys, and unsupported future versions before persistence.
- Prove preview/acknowledgement, atomic four-store replace, forced rollback at each asset-aware restore stage, failed-validation preservation, export failure without partial download, and reopen after restore.

### M14-G Rich Lists and Backup v5

- Cover unordered/ordered list creation, item addition/removal/order, marks and validated links inside items, keyboard accessibility, exact structured persistence, and deterministic plain projection.
- Reject nested lists, task/checklist state, tables, arbitrary HTML/CSS, unsupported blocks, and malformed item shapes at domain and backup boundaries.
- Add the minimal Image Snippet discriminant with exact keys and graph rules needed for one Backup v5 contract, but prove no Image Snippet authoring/delivery UI exists in M14-G.
- Prove strict Backup v5 round trips Plain, Rich lists, preserved legacy Rich local images, Image content, and exact assets while v1-v4 remain frozen/importable. Preserve the guard, ordering, preview, acknowledgement, four-store atomic restore, and rollback guarantees.
- Prove Dexie remains version 5 with unchanged declarations, stores, and indexes.

### M14-G.2 Unified Text and Image Authoring (M14-H Absorbed)

- Prove an Image Snippet contains exactly one same-owner asset; reject zero, multiple, missing, foreign, orphan, unsupported, malformed, oversized, and aggregate-limit states.
- Paste representative PNG/JPEG/WebP through the extension editor's user paste event and select them through a labelled file input; reject unsupported data with accessible focused feedback and no `clipboardRead`.
- Prove local preview, object-URL revocation, draft Save/reopen, Replace, Remove-before-Save, Cancel, failed Save rollback, atomic ownership, trigger uniqueness, and Delete cascade.
- Prove no Rich editor involvement, no Image Library, no shared asset, no "Use as Context," no URL requirement, and no user-facing asset ID/Blob/base64/storage terminology.
- Preserve legacy Rich local-image records without mutation. Allow explicit conversion only for exactly one valid local-image block plus one owned asset; reject mixed/empty/additional-asset conversion and never migrate automatically.
- Prove M14-I publishes Image Snippet typed descriptors with metadata only while Decision 38 legacy Rich local-image exclusion remains valid.

### M14-I Unified Snippet Clipboard Delivery and Trigger Planner

Real Chrome validates the corrected Text path for preparation, cleanup, notice, bold, italic, links, bullets, and numbering. It also validates Settings companion readiness and the complete Windows native Image trigger/preparation/cleanup/notice/visible-paste flow. Image offscreen Async Clipboard, M14-I.1.4 `snippet.png`, and focused-content A1 `TEXT` remain historical failures; focused extension-page B `VISIBLE IMAGE` remains a capability-only pass; A2/F9 was not run. M14-I.5 removes all feasibility runtime probes and failed browser Image delivery code/tests.

- Cover safe project-owned Text `text/html` plus deterministic `text/plain`, Decision 42 PNG preparation, explanatory opt-in and optional `clipboardWrite`/`offscreen`/`nativeMessaging` states; verify no `clipboardRead`, no permission request from trigger typing, and Text independence from the native companion.
- Prove WXT manifest generation, `chrome.permissions` request/contains behavior, Text offscreen creation/message/write/close sequencing, one-document concurrency, service-worker restart, native one-shot transport, and truthful typed outcomes.
- Prove activation retrieves only the requested Image Snippet/asset from Dexie, revalidates same-owner exactly-one graph state, and sends no Blob/base64/asset ID/filename through frame catalog snapshots.
- Prove PNG input and genuine JPEG/WebP-to-PNG conversion, PNG signature revalidation, transparency/orientation expectations, decoded-pixel/memory guards, malformed decode failure, and handoff of only validated PNG bytes to the native Image transport.
- Prove trigger and normal editor content are preserved on denial/failure. Cleanup occurs only after write success and exact compare-and-swap revalidation; changed editor/range/selection/epoch/revision/request leaves input untouched.
- Prove planner, permission, Text offscreen creation/runtime messaging/copy event, native availability/version/response/busy/write failures, image validation/decode, and Decision 42 failures retain exact safe codes. One service-worker diagnostic contains only stage, code, Text/Image kind, and lifecycle phase; no trigger, content, HTML, Blob/base64, asset ID, filename, image bytes, page content, or stack trace is logged.
- Prove Text registers exactly one temporary copy listener, sets exact planned `text/plain` and `text/html`, calls `preventDefault()`, invokes `execCommand('copy')` once, and removes the listener on success, false return, thrown command, missing event/clipboardData, and `setData` failure. Copy succeeds only when the command and expected handler both succeed. Text does not call Async Clipboard, parse/execute HTML, mutate representations, insert DOM, or depend on selection. Its runtime-validated normal path remains unchanged.
- Prove normal Windows Image delivery invokes only `WindowsNativeImageClipboardTransport` after PNG preparation. Native failure must never invoke offscreen Async Clipboard, a File copy event, focused content/extension clipboard write, data URL, HTML image, hidden DOM, or other browser fallback.
- Prove successful image cleanup removes the exact trigger from the no-inserted-Space state, leaves no placeholder/filename/asset ID/trailing space, collapses the caret at the removed range start, and shows `Image copied — press Ctrl+V` without claiming destination insertion.
- Use real native Ctrl+V in manual validation. Never synthesize paste or reverse-engineer destination upload controls; accept destination-specific inline/attachment/message behavior.

- M14-I.5 packaged-output validation proves no feasibility probe gate/string/UI, F8/F9 behavior, focused clipboard writer, `snippet.png` File transport, or Image `clipboardData.items.add(file)` branch remains. It simultaneously proves the Text `text/plain`/`text/html` copy-event runtime remains packaged.

### M14-I.2–M14-I.5 Windows Native Clipboard Companion

M14-I.2 defined the acceptance gates. M14-I.3/M14-I.3.1 implement and automated-validate the standalone native foundation. M14-I.4/M14-I.4.1 add development Chrome integration, registration, and corrected readiness coverage. Real-Chrome companion and Image proof passed; M14-I.5 removes superseded runtime while retaining these gates:

- Shared TypeScript/C# conformance fixtures must cover the exact protocol v1 valid shapes; unknown, duplicate, and dangerous keys; version/operation mismatch; 32-lowercase-hex request correlation; canonical base64; 5,242,880-byte decoded and 7,000,000-byte framed bounds; strict response parsing; and payload-free safe errors.
- Host tests must cover PNG signature/IHDR and Decision 42 limits before WIC; exact post-WIC dimensions; single-frame PNG; checked stride/allocation; premultiplied BGRA; bottom-up row order; sRGB DIBV5 masks/header; exact registered `PNG` bytes first and `CF_DIBV5` second; eager clipboard lifetime after host exit; and absence of `CF_HDROP`, filename, file, network, and temporary-image behavior.
- Fault-injection/integration tests must cover non-NULL companion HWND ownership; six-attempt 10/20/40/80/160 ms Open contention; no retry after mutation; HGLOBAL ownership transfer; allocation/Empty/first Set/second Set/Close failures; partial-write cleanup; concurrent host mutex; host crash/disconnect; success-response loss; and no automatic replay.
- Extension tests must cover Windows platform detection, optional `nativeMessaging` request only from Settings user gesture, permission denied/revoked, missing/forbidden/misregistered host, exact origin and stable prod/dev separation, capabilities/version mismatch, one in-flight Image write, stale response, both freshness checks, verified success before compare-and-swap cleanup, and complete Text independence.
- Development registration tests cover exact per-user HKCU Google Chrome registration, stable manifest plus absolute executable path, executable/origin/capability verification, and production/development isolation. Signed production installer, staged update, rollback, repair, uninstall, and production orphan cleanup remain future packaging tests.
- Real Chrome on Windows proved that a Decision 42-safe PNG prepared by the companion pastes as a visible genuine image. The post-cleanup smoke test also passed: Settings was Ready, the trigger disappeared, the copied notice appeared, and native `Ctrl+V` pasted a visible image.

The M14-I.3 standard native suite does not open, empty, or write the developer's clipboard. It covers strict framing/schema/base64/PNG cases, WIC PNG/PBGRA decode, binary DIBV5 header/row/alpha inspection, build-time caller-origin fail-closed behavior, companion HWND creation/destruction, exact retry timing, mutex rejection, mocked clipboard faults, response-only stdout, and ownership transfer including PNG Set success followed by DIBV5 failure. M14-I.3.1 adds a non-seekable sentinel stream whose prefix and complete declared body are immediately available but whose next read throws, proving request processing and response generation do not wait for EOF or attempt a post-body read. It also proves synchronously buffered bytes after the frame are not consumed and a failed stdout write is not followed by another response attempt. Partial-transfer coverage includes successful and failed best-effort clearing, no transaction retry, application/system HGLOBAL ownership, mandatory close attempts, and existing close-error precedence. The self-contained `win-x64` development publish is validated through a framed, non-mutating capability request. M14-I.4 TypeScript tests consume the same language-neutral fixtures and cover exact schemas, correlation, adversarial responses, request ID/base64 bounds, PNG/JPEG/WebP preparation, Windows/platform/permission states, one in-flight write, no retry, Text independence, and absence of browser Image fallback.

M14-I.4.1 adds the exact real-runtime discrepancy regression: Windows plus granted permission plus the selected `.dev` host plus a callback-delivered, correlated native success must traverse the service-worker Settings bridge and become `Ready`, never `host-unavailable`. Separate regressions prove callback transport failure remains unavailable, valid incompatible capabilities remain incompatible, malformed responses retain `invalid-host-response`, the message channel is held with `sendResponse`/literal `true`, and explicit refresh replaces a previous unavailable result with Ready. Generated-output validation proves native-dev `.dev` host selection and ordinary-build isolation. Principal real-Chrome Settings readiness and the subsequent Image trigger test passed.

### M14-J Rich Text Delivery and Destination Capability Validation

- Regress the unified native-paste path in supported textarea, text/search input, and generic contenteditable targets, including safe trigger cleanup, surrounding content, publication barrier, reload, disconnect, and normal-typing failure behavior.
- Validate the M14-I native-paste implementation for Rich paragraphs, bold, italic, links, unordered lists, and ordered lists. Any compatibility correction or direct-insertion optimization requires separate behavioral evidence and must not become the default modern delivery path.
- Run real Chrome validation in Crisp, Intercom, a generic textarea, a generic contenteditable, and another normal website. Record browser version, DOM/editor evidence, selected strategy, any evidence-backed adapter, and unsupported capability outcomes.
- Validate Image native-paste behavior and graceful fallback where a destination does not preserve an offered representation. Include no normal Rich local-image rendering or mixed text/image delivery; legacy Rich local-image records remain fail-closed.
- M14-J.1 controlled production-controller fixtures for a standard input, textarea, generic contenteditable, and structured nested rich-editor approximation now assert M14-K.2.3.4 synchronous accepted-Space suppression, trigger-only exact cleanup, original-editor focus, collapsed cleanup caret, surrounding-content preservation, one deletion notification, and no duplicate/stray content. Rejected activation retains ordinary Space. Native Image failure fixtures assert no cleanup or focus loss.
- These JSDOM fixtures are deterministic extension-behavior evidence only. They do not synthesize paste or claim operating-system clipboard, Chrome WebContents activation, destination formatting, visible-image, or attachment semantics. The exact compatibility record and concise Principal matrix live in `docs/DESTINATION_COMPATIBILITY.md`.
- M14-J.2 adds controlled structural-boundary coverage for editor start, Unicode whitespace, `<br>`, sibling `<div>`, sibling `<p>`, and nested inline formatting at a new block. It also proves inline non-whitespace continuation remains rejected, structural cleanup preserves the line break/block/formatting wrappers and exact caret, native failure performs no cleanup, and moved selection safely skips cleanup.
- M14-J.3 adds event-shaped open/closed Shadow DOM fixtures where the top-document target and active element are the non-editable host, while the composed path contains the internal contenteditable and one collapsed target range identifies the internal caret. Cover internal paragraph/block starts, invalid continuation, exact cleanup, outer-host safety, shadow focus chain, clipboard failure, stale content, current composed-selection revalidation, no/ambiguous/non-collapsed/outside/unrelated/invalid target ranges, no editor, and `contenteditable=false`.
- M14-J.4 adds exact and JSDOM-normalized safe-HTML coverage for three independent unordered and ordered list items, paragraph/list/paragraph sibling topology, bold/italic/safe-link ownership inside one `li`, supported explicit hard breaks that remain inside one item as `<br>`, empty supported structures, and unchanged deterministic plain text. Canonical direct `li` output remains the baseline; no destination-specific HTML variant is asserted without real-browser evidence.
- M14-J.5 adds diagnostic-path coverage proving one exact canonical trigger is read through `SnippetEntryRepository`, the same record is planned through `SnippetDeliveryPlanner`, production serializer and planned HTML/plain text match, list/mark/hard-break structure is returned, and no repository mutation, asset read, clipboard operation, network request, or automatic logging occurs. Generated-output validation requires the diagnostic identifiers to be absent from the ordinary production package and present only in `native-dev`. The completed live capture confirms the initial fixture contained two items and the corrected fixture contains three; the corrected serializer and delivery payload match exactly.
- M14-J.6 adds deterministic lifecycle coverage for first bootstrap, repeated current-script execution, obsolete-context replacement, failed-reconnect replacement, install/update/Chrome-update/startup signals, empty/query-failure/partial-injection outcomes, discarded tabs, exact all-frame packaged-file injection, four-tab concurrency, and coalesced overlapping recovery cycles. Catalog regression coverage proves disconnect followed by interaction creates exactly one new port and accepts the current epoch/revision snapshot without retaining stale entries.
- Generated-output validation requires the exact HTTP/HTTPS host-permission set, the unchanged exact HTTP/HTTPS all-frame static content script, lifecycle listeners and scripted injection in the worker, and the frame registry marker in the packaged content script. It continues to reject `tabs`, `<all_urls>`, `file://`, and `clipboardRead`.

### M14-K Optional Automatic Paste

M14-K.1 is the completed architecture checkpoint. M14-K.2 has deterministic extension and native coverage, and M14-K.3 incorporates the authoritative Principal real-browser matrix. Existing clipboard-only tests remain mandatory regressions and are not rewritten as automatic-mode-only tests.

M14-K.2 automated acceptance (implemented and passing):

- Prove `snippetPasteMode` defaults to `clipboard-only`, saves through the existing singleton Settings repository, requires no new store/index/Dexie version, and preserves explicit Settings save/error behavior. Backup v5 remains frozen; strict Backup v6 exports the preference, and valid v1-v5 imports produce `clipboard-only` without weakening their exact parsers.
- Prove Text and Image retain their existing preparation transports and converge only after correlated clipboard success at `AutomaticPasteTransport`. Clipboard failure never captures a native context, cleans the trigger, or requests paste. Clipboard-only mode preserves the exact current cleanup and copied-notice workflow and does not invoke the native paste path. In automatic mode, failure of an automatic-only browser/native precheck still performs the normal exact cleanup attempt after clipboard success and returns copied/manual-fallback UX.
- Prove the one-use content activation guard covers ordinary inputs/textarea/contenteditable and open/closed Shadow DOM. Focus departure/return, selection or caret movement, input/content mutation other than the exact authorized cleanup, editor removal, hidden/pagehide, navigation, document/frame mismatch, catalog epoch/revision change, and cleanup failure permanently invalidate automatic paste. Successful cleanup must atomically transition the guard to the expected collapsed cleanup caret before immediate revalidation.
- Prove the service worker binds authorization to exact `MessageSender` document/frame/tab/window identity, active tab, focused window, request/catalog identity, and one in-memory expiration/consumption. Worker restart and missing sender fields fail closed. A second activation is rejected by the global no-queue guard before clipboard overwrite; one activation can reach at most one native paste call.
- Preserve byte-for-byte protocol-v1 fixtures/behavior. Add shared strict TypeScript/C# v2 fixtures for capabilities, `capture-paste-context`, and `paste-clipboard`; exact 32-lowercase-hex request/authorization IDs; exact 16-lowercase-hex root HWND; unsigned PID/clipboard sequence; unknown, duplicate, extra, dangerous, wrong-version, wrong-operation, and oversized fields; response correlation; and safe result mapping. Arbitrary keys/codes/sequences, commands, paths, executables, content, HTML, and Image bytes must be absent.
- Mock/fault-test null and changed foreground windows, root normalization, PID mismatch, clipboard sequence change, modifier-down state for left/right Ctrl/Shift/Alt/Windows, no focus stealing, UIPI/zero input acceptance, partial acceptance, process crash/disconnect, timeout, and lost response. Exactly four accepted events map to `paste-issued`; partial/uncertain maps to `indeterminate`. No path retries `SendInput` or emits speculative follow-up input.
- Prove exact input ordering Ctrl down, V down, V up, Ctrl up in one `SendInput` call, one immediate-fail paste mutex, no stale queue, and preservation of the existing Image-write mutex. Standard native unit tests must mock input and must not type into the developer's live foreground application.
- Prove UI outcomes: `Paste sent` only for full input acceptance and never as proof of destination insertion; every automatic non-success after confirmed clipboard preparation retains `Snippet copied — press Ctrl+V` / `Image copied — press Ctrl+V`; cleanup rejection adds `(trigger unchanged)`. A second fully validated activation consumes its command Space, retains its trigger when rejected before its own clipboard write, and reports retry-later delivery busy without claiming copied. Clipboard is never cleared, including after automatic success. Low-level Windows errors and payload content do not reach UI/logs.
- A disabled-by-default bounded timing sink exposes only kind, phase, duration, and safe outcome for clipboard preparation, clipboard write, automatic safety, and native paste request. It logs no content. Image performance remains non-blocking; M14-K.2 does not optimize the Image pipeline.

M14-K.2.3 controlled correction acceptance:

- Preserve the authoritative first real-Intercom trace as a failed automatic activation: automatic mode propagated through the same worker, cleanup succeeded, and the flow stopped at `post-cleanup-check` with `unsafe-focus` before native dispatch.
- Prove the exact post-cleanup contenteditable caret by root-relative structural path and offset, including a structurally identical live-node replacement after the extension-owned cleanup. This must pass for ordinary contenteditable and the retargeted-host/internal-editor Shadow-DOM topology without destination-specific code.
- Prove the scoped cleanup transition tolerates only the extension's own DOM and selection changes. Unrelated mutation during the cleanup notification, caret movement, focus departure/return, editor removal/reinsertion, pre-cleanup mutation, pagehide/navigation, and stale cleanup remain permanent declines. Input/textarea retain exact value and selection validation.
- Preserve application orchestration: automatic Text reaches native context capture and exactly one fake paste request only after successful clipboard preparation, exact cleanup, and authorization consumption. Clipboard-only cleanup/notice, populated-clipboard manual fallback, cleanup-failure preservation, and no retry remain mandatory regressions.
- M14-K.2.3.4 proves the accepted/ignored activation result is unambiguous; only accepted trusted cancelable Space is prevented exactly once before delivery begins; textarea, supported input, generic contenteditable, and Shadow-DOM contenteditable receive no browser activation input; and cleanup CAS removes the exact trigger from the unchanged no-Space state in automatic and clipboard-only modes.
- Rejection coverage includes no/unknown trigger, invalid boundary, unsupported editor, non-collapsed selection, composition, untrusted or non-cancelable events, multiline Text in a single-line input, and disconnected runtime. Every rejected event retains `defaultPrevented: false`. Any new Space, Enter, paste, delete, composition, or other non-owned input after acceptance still permanently invalidates authorization; there is no broad suppression or grace period.
- Native-development diagnostics retain all privacy-safe event-origin fields and prove successful activation as `activationBeforeInputPrevented: true` with `activationInputObserved: false`. Production output excludes the diagnostic surface. Native protocol, capture/final checks, `SendInput`, mutex, modifier, retry, and manual `Ctrl+V` behavior are unchanged.
- M14-K.2.3.5 adds deterministic win-x64 ABI assertions for `KEYBDINPUT` 24 bytes, `MOUSEINPUT` 32 bytes, the complete `INPUT` union 32 bytes at offset 8, and `INPUT` 40 bytes. The production keyboard builder is inspected for `INPUT_KEYBOARD`, `VK_CONTROL`/`V`, zero scan code/time/extra info, and `KEYEVENTF_KEYUP` only on the two release events.
- Native tests substitute the final `SendInput` call only at the platform boundary, set a known last-error value, and prove the same production method reports requested count, inserted count, actual `cbSize`, and the immediately captured last error with exactly one attempt. Full/zero/partial mapping remains 4/0/1–3 with no retry.
- Native-development protocol tests require the exact privacy-safe diagnostic object and reject unknown/content-bearing members. Host tests prove the diagnostic is included only when explicitly enabled and absent from normal protocol-v2 responses. Extension tests prove only native-development/test parsing accepts it, one attempt diagnostic is consumed once, and the bounded automatic-paste trace retains it without changing delivery results.

Status: **COMPLETE AT `e34cd76` / AUTOMATED PASS / PRINCIPAL REAL-BROWSER PASS / PRINCIPAL APPROVED / M14-K CLOSED**. Real automatic behavior is supported by the separate authoritative Principal evidence below, not inferred from controlled automation.

M14-K.3 Principal real-Chrome matrix:

| Destination | Clipboard-only | Automatic | Required content result |
| --- | --- | --- | --- |
| Crisp Text | Required | Required | Full supported Text formatting; one insertion |
| Intercom Text | Required | Required | Full supported Text formatting through generic Shadow-DOM resolution; one insertion |
| Crisp Image | Required | Required | One visible genuine Image |
| Intercom Image | Required | Required | One visible genuine Image through the shared post-clipboard boundary |

For both destinations and both kinds, separately test: click another editor before authorization; move caret/type after activation; switch tab; switch Chrome window; switch application; close/remove editor; navigate; hold each modifier class; change clipboard; protocol-v2 paste unavailable/incompatible after clipboard preparation; rapid second activation; automatic mode disabled; and manual `Ctrl+V` after every safe fallback. Also test the whole companion missing before preparation: Text can still prepare through its browser transport and fall back manually, while Image retains the existing delivery failure/unchanged-trigger behavior because no authoritative Image clipboard success occurred. Test helper disappearance after a successful Image write separately; its prepared clipboard remains the manual fallback. Wrong/stale focus must produce no automatic paste. Successful automatic input must not be retried after a lost/uncertain response. Confirm the clipboard remains populated after `Paste sent`, including the expected duplicate if the user deliberately presses `Ctrl+V` afterward. No Crisp- or Intercom-specific automatic-paste branch is allowed.

Authoritative M14-K.3 Principal evidence passes automatic Text and automatic Image in both Intercom and Crisp with one insertion, trigger cleanup, `Paste sent`, no fallback notice, and preserved focus. Clipboard-only Text and Image pass with no automatic insertion, the manual notice, one deliberate successful `Ctrl+V`, and preserved focus. Unknown trigger behavior and live clipboard-only-to-automatic Settings propagation to an already-open Intercom tab pass. The final Intercom Text trace records accepted Space suppression, no activation input, no post-cleanup failure, valid authorization and every focus/caret/selection/structure/lifecycle predicate, extension-owned cleanup provenance, `paste-issued`, and the privacy-safe native diagnostic 4 requested / 4 inserted / last error 0 / struct size 40.

M14-K.3 performance evidence is development-only and content-free. A 20-run one-shot capability probe measured 67.0 ms median, 69.0 ms mean, and 76.1 ms p95. A controlled Chromium codec probe measured direct PNG preparation at approximately 0.2 ms for 64×64 and 2.0 ms for 1440×900; 1440×900 JPEG/WebP decode plus PNG re-encode measured approximately 1.04–1.06 s. The verdict is **C — ARCHITECTURAL PERFORMANCE OPPORTUNITY**. No production telemetry or closeout optimization is introduced.

Windows cannot atomically identify the browser's internal editor at the exact native input instant. The deterministic invalidation/focus matrix and the successful real-destination path are the closeout evidence; any future observed wrong-editor paste still blocks automatic-mode release and requires architecture review. Elapsed-time tuning alone is not an acceptable correction.

### Decisions 46–54 Future Validation Contract

These are future implementation acceptance requirements, not current tests and not authorization to change runtime behavior in M14-L:

- Prove Text Snippets are the only active AI-reference retrieval domain, Image Snippets are always excluded, and dormant Knowledge records/repositories/backups remain intact until a separately tested migration cleanup.
- Cover the exact Context/Gist matrix: Context-only enabled, Context-plus-Gist enabled, Gist-only enabled, both empty disabled. Minimal Gist must remain valid; Context-only must produce a reply request without synthetic user text.
- Verify precedence/grounding: safety/application rules remain highest; Gist controls current action/presentation; Context facts defeat conflicting or unsupported Snippet material; retrieved Text Snippets never become commands or inject unsupported case facts.
- Validate compact bounded auto-growth, internal scrolling after the maximum, input/output order, provider-independent Model dropdown, preserved editable output, Copy, no automatic input clearing, and absence of redundant primary-workflow copy.
- Treat Context Images as removable request-scoped attachments, separate from Snippet assets and Knowledge. Cover capability rejection, no silent omission, lifecycle cleanup, and any explicitly approved mounted-workspace continuity without permanent Library ownership.
- M14-M.0 is a blocking real-Chrome gate before migration. From an explicit Options gesture, a non-production/scratch boundary must: invoke `showDirectoryPicker({mode:'readwrite'})`; structured-clone the handle into extension-owned scratch IndexedDB; recover it across the relevant extension/service-worker lifecycle; observe `granted/prompt/denied` accurately; use already-granted authority from a later background context without prompting; prove `prompt`/`denied` needs a new gesture; create one random exact test file; close, reopen, read, and verify its identity/content; remove only that exact file; leave unrelated files unchanged; fail safely for revoked/unavailable destinations; and add neither `alarms`, `downloads`, nor arbitrary filesystem access. The gate cleans its exact artifact/scratch state. Any required failure blocks M14-M.1 and returns to Principal review.
- Only after recorded M14-M.0 PASS may M14-M.1 migration tests upgrade v1-v5 Dexie fixtures to exactly v6 once, preserve authored records/assets/Settings, create empty sidecars and the feasibility-proven local state, and prove strict Backup v7 export plus v1-v7 import validation and atomic rollback across Knowledge, Snippets, assets, Settings, usage, and generated metadata. Current v1-v6 Backup contracts remain byte/validation frozen.
- Usage tests must prove a service-worker-owned receipt is bound to request/Snippet/sender/catalog, expires after 30 seconds, consumes once, rejects duplicates/spoofed/stale acknowledgements, and is acknowledged only after exact cleanup. Both paste modes and Text/Image count; every excluded case does not. Injected-clock tests prove first use, atomic increments, UTC `lastUsedAt`, `Number.MAX_SAFE_INTEGER` saturation, delete cascade, restore, and that persistence failure/worker restart never changes delivery, feedback, clipboard, or automatic finalization.
- M14-N production selected-folder tests must repeat the gate's critical evidence over the final repository adapter and cover no picker/prompt from scheduled code, browser/extension restart, explicit reauthorization, revocation, moved/deleted/unavailable folders, same-directory set/manifest preservation, different-directory set rotation without deletion, Off/re-enable, and no silent Downloads fallback.
- Scheduling tests must prove exact 24-hour/168-hour anchors, one named alarm, startup reconciliation, one coalesced catch-up after missed intervals, future `nextDueAt`, no polling/keepalive/backlog, one in-memory mutex plus 30-minute lease, expired-run recovery, and no rapid retry. Generated-manifest validation must show only `alarms` is added for M14-N; `downloads`, `fileSystem`, and unrelated permissions remain absent.
- Automatic output tests must prove manual/automatic reuse one canonical v7 builder/validator/serializer, exact Windows-safe UUID/timestamp names, three-attempt collision failure without overwrite, close/reopen/length/SHA-256/v7 verification before success, and no retention before success. Retention must sort by `createdAt`/`backupId`, keep exactly seven for Daily or four for Weekly after successful pruning, and delete oldest only from manifest candidates that re-prove directory identity, exact ownership metadata, and digest. Proof/removal failure must stop pruning, leave safe extras, and never delete the new recovery point; unrelated/manual/missing/moved/replaced/tampered/unverifiable files remain untouched.
- Restore tests must prove `automaticBackupCadence` is portable preference only. Restored Daily/Weekly plus cleared local authority remains operationally inactive, schedules no file write or permission prompt, enters no rapid loop, reports `Backup location needs attention`, and preserves manual Export. A later explicit folder grant activates the restored cadence. Restored Off remains inactive without a location-attention requirement.
- Generated-tag tests must preserve authored order/content, restrict metadata to Text, invalidate on title/content/authored-tag fingerprint change, leave trigger-only edits intact, and prove Save succeeds before/independently of provider work. Cover missing model/provider, timeout/cancel/failure, no direct Ollama/business provider branch, exact configured-model resolution, no guessed/pulled model, and no retry queue.
- Tag-output tests must enforce the 64 KiB canonical input cap plus complete-array/4 KiB/eight-tag/1–40-code-point/NFKC/lowercase/whitespace/control/HTML/deduplication output contract and reject all malformed/prose/object/trailing/oversized cases without persisting raw output. Backfill tests allow qualifying edit or explicit maximum-20/concurrency-one/cancellable batch only; startup, delivery, and retrieval trigger no generation.
- Retrieval tests preserve Text-only eligibility, Knowledge/Prompt Builder v1 continuity, and deterministic per-token weights title 5/authored tags 3/content 1/generated tags 1 only for a matching fingerprint. Missing/wrong tags cannot remove other evidence. Usage/recency do not enter ranking, so popularity cannot dominate relevance.
- Every future schema/Backup/permission change receives its own migration, compatibility, generated-output, and real-browser risk review. Current Dexie v5 and Backup v6 must not be rewritten in place.

### Real Chrome Manual Validation

M14-D and M14-F.1 claim no new real Chrome validation because they change documentation only. Existing evidence remains: direct insertion of an ordinary Plain Snippet fails in tested Crisp, the same Snippet succeeds in another Rich editor, upstream persistence/projection/catalog delivery was separately verified, the speculative generic patch was removed, and manual native paste into Crisp works. This does not prove clipboard transport or authorize a Crisp-specific adapter.

M14-G.2 combines the cancelled list-only manual check with Text typing/formatting/list Save/reopen and screenshot Ctrl+V preview/Save/reopen after source review. Real Chrome proves M14-I Text clipboard preparation, trigger cleanup, copied notice, and native-paste fidelity for bold, italic, links, bullets, and numbering. Crisp inline-position, Enter, and Shift+Enter Text delivery pass with full formatting and preserved focus, real-validating M14-J.2. Real Intercom validates the M14-J.3 Shadow-DOM correction, trigger cleanup, focus, manual paste, and ordinary rich Text. M14-J.5 proves the apparent list failure came from an invalid fixture; the corrected three-item record and normal Intercom list paste pass. Crisp and Intercom Image paste pass. Intercom bullet-list triggering immediately after Shift+Enter remains a known low-priority compatibility limitation.

M14-J.6 automated validation passes, and Principal-owned browser acceptance is complete. With Intercom already open, reloading the unpacked extension without refreshing the page preserved one successful trigger workflow: activation, cleanup, copied notice, focus, manual paste, and no duplicate all passed. Crisp passed the same no-refresh sequence. Repeated extension reloads against the same open destination still produced exactly one activation, cleanup, copied notice, and clipboard payload. These real-browser results complement rather than replace the deterministic automated lifecycle tests; restricted site access remains a quiet safe failure.

The final M14-J.6 automated baseline is 628 passing tests with one opt-in test skipped, focused lifecycle/catalog coverage passing, lint/format/typecheck passing, one Playwright infrastructure test passing, production and `native-dev` builds plus generated-manifest validation passing, and `git diff --check` passing. M14-J.7 is documentation-only and does not rerun or reinterpret the implementation suite.

Manual validation need not exhaustively test every website. Closeout must identify the exact editors/origins tested, any destination-specific adapter used, omissions, and why each omission is non-blocking.

## Milestone 0 Status

Milestone 0 added no implementation code, so there were no runtime tests to execute. The testing approach is established for Milestone 1 and later work; each implementation task must define the checks applicable to its scope.
