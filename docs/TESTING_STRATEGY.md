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
- service-worker catalog construction containing only trigger, Snippet ID, and plain-text content; one long-lived typed `chrome.runtime.Port` per matched frame; port connection and initial complete validated snapshot; ordered invalidation and refresh; immediate cache clearing and disabling on disconnect; reconnection snapshot requirement; worker-restart epoch replacement; stale snapshot and older-epoch rejection; normal typing while disconnected; no expansion from a pre-mutation snapshot after disconnect or invalidation; pre-create/edit/delete/import/restore invalidation of every connected frame; complete refresh after success; unchanged republish after persistence failure; affected-frame disablement after publication failure; and absence of Dexie, `chrome.storage`, `localStorage`, a durable queue, polling, or per-keystroke service-worker lookup in content scripts;
- trusted cancelable Space `beforeinput` activation, composition exclusion, collapsed-selection requirement, editor-start/whitespace left boundary, exact candidate range immediately before the caret, maximum bounded look-behind, case-insensitive catalog match through canonicalization, and no scan or replacement elsewhere;
- single-line Snippet expansion in supported absent/text/search inputs; multiline Snippet safe fallback in those inputs before Space prevention; no host-value mutation when the input adapter declines; and no flattening, truncation, normalization, or partial insertion to fit a single-line input;
- complete single-line and multiline preservation in textarea and contenteditable; textarea replacement through exact selection ranges; contenteditable replacement across safe adjacent text nodes with block/`br`/embedded/root stops and safe text-node plus `<br>` insertion; exact Snippet and appended-space preservation; surrounding text and line-break preservation; bubbling composed host input notification; and caret collapse after the appended space;
- normal Space fallback for a multiline match in a single-line input, missing/partial trigger, selected text, unsupported or password/specialized editor, unsafe contenteditable range, noncancelable event, invalid/unavailable cache, disconnected port, messaging failure, paste, programmatic input, and composition;
- prevention of recursive expansion from inserted Snippet text and prevention of duplicate handling across nested editable targets or frames;
- Snippet Library Trigger input guidance, canonical value display, inline invalid and duplicate feedback, trigger list display, triggerless editing, accessibility, narrow layout, and unchanged plain-text content editing;
- generated manifest/content-script validation for exact matches `https://example.com/*` and `https://app.intercom.com/*`, `allFrames: true`, matching-frame-local operation, and absence of `match_about_blank`, fallback-origin injection, `<all_urls>`, arbitrary-site access, clipboard/storage permissions, new provider hosts, or unrelated configuration; and
- regressions proving unchanged Knowledge, Settings, Import/Export integrity, popup, Side Panel, M10 capture, Retrieval Engine, Prompt Builder, `GenerationProvider`, `OllamaProvider`, generation, Copy, permissions outside the approved content-script match, and production build. Normal M13 tests require no Ollama or AI provider.

Risk-based M13 manual validation must cover a supported single-line input with both successful single-line expansion and multiline decline without host-value mutation; complete multiline preservation in a normal textarea and generic contenteditable editor; Intercom or the current primary support editor; exact Space activation and miss fallback; surrounding-content, line-break, host-input, and caret behavior; create/edit/delete cache refresh; disconnect and service-worker reload recovery; v2 export and restore preserving triggers; v1 import producing triggerless Snippets; and existing popup, Libraries, selected-text capture, Settings, Side Panel generation, and M12 backup workflows. Password or unsupported editors must preserve normal typing without content capture.

Low-risk pattern permutations, forced IndexedDB rollback branches, revision-order combinations, and every unsupported input type may remain automated when deterministic coverage is reliable. Closeout must state the exact manual editors and origin tested, any destination-specific adapter used, what was omitted, and why each omission is non-blocking.

## Milestone 0 Status

Milestone 0 added no implementation code, so there were no runtime tests to execute. The testing approach is established for Milestone 1 and later work; each implementation task must define the checks applicable to its scope.
