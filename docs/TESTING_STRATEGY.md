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
- Minimal manual validation

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

Milestone 10 implementation must add generated-manifest coverage proving exactly one normal command named `capture-selection-to-workspace`, description `Capture selected text in AI Support Workspace`, suggested default `Ctrl+Shift+Space`, macOS suggestion `Command+Shift+Space`, and no global scope. The generated permission set must contain exactly `sidePanel`, `activeTab`, and `scripting`; host permissions must remain exactly `http://localhost/*`; the existing `https://example.com/*` persistent content-script match must remain unchanged; and `tabs`, storage, clipboard, broad site, `<all_urls>`, and unrelated permissions must remain absent.

Background command coverage must verify listener registration, recognition of only the approved command, safe ignoring of unknown commands, and safe use of the command-provided tab and window. Structural sequencing tests must prove that selection capture is invoked first, Side Panel opening is invoked immediately afterward, no awaited asynchronous boundary occurs between those invocations, and capture/open outcomes are handled independently. Coverage must distinguish capture success, empty, and failure from panel-open success and failure, defer delivery until the capture settles to a typed result, and avoid delivery when panel opening fails. It must also cover global current-command-window opening, repeated open/activate behavior without toggling or closing, and safe missing-tab, missing-window, scripting, and Side Panel failures without raw Chrome errors.

Selection-extraction coverage must include exact normal document and contenteditable selection, selected substrings from textarea and supported text-capable input ranges, Unicode and line-break preservation, leading and trailing whitespace preservation when the result contains non-whitespace, whitespace-only empty behavior, exclusion of surrounding page content, and active-tab main-frame-only targeting. Tests must prove no arbitrary conversation-DOM scraping, cross-frame capture, screenshot capture, or persistent content-script expansion.

Typed delivery coverage must prove that an already-mounted Side Panel and a newly opened Side Panel both receive the capture result, the mount race is handled through the focused readiness and acknowledgement contract, the Side Panel acknowledges only after applying the result or feedback, failed delivery does not silently overwrite state, and no Dexie, localStorage, Chrome storage, or other persistent capture mechanism is used.

Workspace coverage must prove that successful capture replaces Merchant Context exactly, preserves Guidance, model, generated or edited Output, and any active generation request, never invokes Generate, focuses Merchant Context, and places its caret at the end without selecting all. Empty selection and restricted or failed capture must preserve existing Context, show the approved safe feedback, avoid unrelated focus movement, and hide raw Chrome errors. Regression coverage must preserve the M9 Workspace, popup, Libraries, Retrieval Engine, Prompt Builder, Ollama Provider, generation, Copy, and production build.

Normal M10 tests must use controlled Chrome and provider boundaries. They require neither a live Ollama service nor a real model.

Controlled Chrome API fakes cannot faithfully prove preservation of Chrome's transient keyboard-command user activation. Automated tests enforce invocation ordering and settlement behavior, while real Chrome validation must prove that `chrome.sidePanel.open({ windowId })` is initiated synchronously enough to remain eligible. The validated runtime sequence starts `chrome.scripting.executeScript(...)`, immediately starts `chrome.sidePanel.open(...)` without awaiting capture, and only then observes both outcomes. Tests must reject orchestration that awaits capture before invoking Side Panel opening, but they must not claim that mock success proves the real browser gesture contract.

## Manual Verification Requirements

Browser-specific interactions such as selection capture, extension permissions, and Intercom behavior require manual verification. These behaviors were not applicable to Milestone 0 and should not be treated as fully automatable when later milestones introduce them.

No Milestone 3-specific manual Chrome validation was required. Its persistence boundary is validated more appropriately through isolated IndexedDB integration tests, and adding temporary browser UI solely for manual persistence testing would violate the approved milestone boundary. Regression validation confirmed that the existing Manifest V3 extension shell remains operational.

Milestone 4 manual Chrome validation confirmed that popup navigation opens the Knowledge Library on the existing options-page surface, creation and editing appear immediately and persist across reload or reopen, deletion cancellation preserves the record, confirmed deletion remains effective after reload or reopen, and the tested Knowledge Library workflow reports no runtime problems.

Milestone 5 manual Chrome validation confirmed that popup navigation opens the existing Library surface, lightweight local tab navigation opens the Snippet Library, its empty state works, create and edit changes appear immediately and persist across reload or reopen, deletion cancellation preserves the record, confirmed deletion remains effective after reload or reopen, the Knowledge Library remains operational, and the tested workflow reports no runtime problems.

No Milestone 6-specific manual Chrome validation was required. Retrieval Engine v1 is a headless application boundary, its deterministic algorithm is covered by unit tests, and its real repository behavior is covered by isolated IndexedDB integration tests. Adding temporary browser UI solely to demonstrate retrieval would violate the approved milestone scope. Existing extension build and runtime regression validation passed.

No Milestone 7-specific manual Chrome validation was required. Prompt Builder v1 is a headless application boundary with no browser UI or runtime interaction, and deterministic unit tests comprehensively cover its behavior. Adding temporary browser UI solely to demonstrate prompt composition would violate the approved milestone scope. Existing production build and Manifest V3 regression validation passed.

Milestone 9 manual Chrome validation passed after the native-fetch binding correction. It covered the global Side Panel surface beside the active webpage, narrow-width operation, real local generation, output editing and Copy, repeated generation, Guidance influence, safe missing-model and provider-unavailable feedback with prior-output preservation, expected options-page Library navigation, both Library regressions, and absence of blocking Chrome runtime or network errors.

Milestone 10 requires real Chrome validation after implementation review. Reload the extension; confirm `capture-selection-to-workspace` and its assigned or user-remapped key in `chrome://extensions/shortcuts`; invoke it from normal document, textarea, and available contenteditable selections; and confirm the corrected capture-first-invocation/immediate-open-invocation sequence physically opens the panel from the keyboard command. Verify exact Context replacement, Context focus and end-caret placement, Guidance/model/output preservation, no automatic generation, and repeated replacement without panel toggle. Validate empty selection, a restricted Chrome page, safe feedback, normal Generate afterward, popup Workspace and Library navigation, absence of runtime errors, and the exact least-privilege permission surface. Shortcut capture validation does not require live Ollama; generation regression may be run separately where useful. The initial manual pass proved command registration and Chrome-native remapping to `Ctrl+Shift+Y`, command dispatch, on-demand selection capture, direct Side Panel opening, and repeated success when capture and open were initiated without an intervening await; full corrected end-to-end validation remains pending.

## Milestone 0 Status

Milestone 0 added no implementation code, so there were no runtime tests to execute. The testing approach is established for Milestone 1 and later work; each implementation task must define the checks applicable to its scope.
