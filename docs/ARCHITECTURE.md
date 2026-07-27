# Architecture

## Architectural Intent

The architecture for this project is intentionally simple. The repository should remain easy to navigate, easy to test, and easy to evolve without introducing unnecessary layers.

## High-Level Structure

The project is expected to evolve around a small set of responsibilities:

- Extension shell: hosts the user experience in the browser.
- Local storage layer: persists knowledge, snippets, and settings locally.
- Retrieval engine: searches and ranks relevant content quickly.
- Prompt builder: deterministically composes typed, provider-independent prompt assemblies.
- Provider adapters: preserve a provider-independent boundary, with Ollama as the initial implementation target and other providers added later.
- Output workspace: lets the user review and refine generated content.

## Design Principles

- No microservices.
- No unnecessary abstraction.
- No provider-specific logic leaking into business logic.
- No premature plugin systems.
- Performance is a primary design goal.
- Provider-independent architecture is the default approach.
- Initial implementation target: Ollama.
- Future providers may be added without affecting business logic.

## Technical Direction

- The extension should remain self-contained as much as possible.
- Local data persistence should be the default path.
- Any provider integration should be kept behind a narrow interface.
- The system should be designed for fast local retrieval rather than complex orchestration.

## Implementation Boundary Categories

### Infrastructure

Infrastructure is the technical machinery that allows product code to be built, validated, and run. Repository tooling, build configuration, quality gates, and testing foundations are infrastructure. The WXT runtime extension shell—including Manifest V3 entry points, browser messaging, permissions, the background service worker, content script, popup, and options page—is also infrastructure rather than business functionality.

Milestone classification still controls when infrastructure is implemented: Milestone 1 owns repository tooling and validation infrastructure, while Milestone 2 owns runtime extension-shell infrastructure. Calling the extension shell infrastructure does not move it into Milestone 1.

Chrome Side Panel is approved specifically as the Milestone 9 global Output Workspace surface. Other Side Panel uses still require a documented product and architecture decision before implementation.

### Application Architecture

Application architecture defines the layers, project-owned contracts, dependency direction, state boundaries, and adapter boundaries that organize implementation. It determines where code belongs and how responsibilities interact, but it does not itself provide a user-facing product capability.

### Business Features

Business features deliver product-specific behavior and user value. Knowledge and snippet management, retrieval, prompt construction, AI-provider behavior, and generated-output workflows are business features assigned to their respective roadmap milestones. They must remain independent of WXT, React, Dexie, and provider-specific infrastructure through the documented boundaries.

## Technical Foundation

### Extension Platform

WXT is the approved extension platform, targeting Manifest V3. WXT owns extension entry-point discovery, build orchestration, manifest generation, development workflows, and packaging. Browser lifecycle, permissions, messaging, and WXT-specific integration must remain isolated at the extension-platform boundary so browser concerns do not leak into business logic.

### Project Language

TypeScript is the project language. Application, UI, extension, and test code should use TypeScript so contracts remain explicit and refactoring can be validated statically.

### UI Framework

React is the approved UI framework. React is responsible for presentation and user interaction; business rules, persistence, retrieval, prompt construction, and provider behavior must remain outside React components.

### Styling

Tailwind CSS is the approved styling solution. It provides a consistent utility-based styling system for React presentation code. Product behavior and domain concepts must not depend on Tailwind classes or styling conventions.

### State Management

React Context and Hooks are the approved state-management approach. Component-specific state should remain local through Hooks, while Context should be scoped to genuinely shared UI or application coordination. Business rules and persistence remain in application, domain, and infrastructure layers rather than Context providers.

### Provider Architecture

The architecture is provider-independent. Business and application layers depend on project-owned contracts rather than Ollama or any future provider SDK. Ollama is the initial implementation target, and additional provider adapters may be added without changing business logic.

### Build Tooling

WXT is the approved extension and build platform, and pnpm is the approved package manager. The build should follow WXT conventions, remain minimal, and provide predictable development, validation, production, and packaging commands. Custom build infrastructure should be introduced only when WXT cannot satisfy a documented requirement.

### Testing Architecture

Testing follows a layered approach:

- Static validation uses TypeScript and ESLint.
- Vitest unit tests cover domain and application behavior without browser, storage, or provider dependencies.
- Vitest UI tests cover React components and user interaction at the presentation boundary.
- Vitest integration tests cover Dexie storage, provider, and browser adapter boundaries with controlled dependencies.
- Playwright end-to-end tests and manual validation cover behavior that requires a real browser or installed extension environment.

Test code should mirror production boundaries and use fakes at external interfaces rather than coupling business logic to Chrome or an AI provider. Vitest is the default for fast repository-level tests, while Playwright is reserved for workflows that require browser-level confidence.

### Repository Quality Gates

ESLint is the approved linting standard and Prettier is the approved formatting standard. Husky and lint-staged form the local commit quality gate by running applicable checks on staged files. These local gates provide fast feedback and complement, rather than replace, full automated validation in continuous integration.

### Local-first Infrastructure Philosophy

Infrastructure should run within the WXT extension and the user's browser wherever practical. Dexie-backed local persistence is the default data path, and no hosted backend is required. Browser, storage, and AI-provider integrations remain adapters around project-owned contracts so infrastructure choices do not control product logic.

### Local-first Storage Architecture

Dexie is the approved storage abstraction over browser-local IndexedDB. The application depends on project-owned persistence contracts so domain and application logic remain independent of Dexie and the browser persistence mechanism. Dexie database declaration, typed tables, schema versions, and transaction mechanics remain centralized in the infrastructure layer.

`DATABASE_SCHEMA.md` is authoritative for the implemented physical schema, repository semantics, errors, transactions, testing, and migration policy. The Milestone 3 physical schema includes Knowledge Entry and Snippet Entry records. Settings remains a planned domain entity but its physical persistence is deferred to the Settings milestone.

History remains an intentionally undecided capability and is not part of the planned storage architecture.

### Retrieval Engine v1

Milestone 6 introduces one headless application-level retrieval operation over the existing local Knowledge and Snippet domains. The retrieval application boundary depends on the project-owned `KnowledgeEntryRepository` and `SnippetEntryRepository` contracts, loads records through `list()`, and performs deterministic lexical scoring in memory. Retrieval must not access Dexie or IndexedDB directly, add persistence search methods, mutate records, or depend on React, WXT, a browser UI, an AI provider, or a network service.

The project-owned result envelope contains separate `knowledge` and `snippets` collections. Each result preserves its domain kind, source record identity, complete domain record, and numeric relevance score. The domains are ranked independently, with no combined cross-domain ordering, because Knowledge and Snippets remain distinct concepts and later consumers may apply different selection policies.

`DECISIONS.md` is authoritative for Retrieval Engine v1 query normalization, participating fields, exact lexical scoring, repeated-term behavior, zero-score and empty-query behavior, deterministic ordering, absence of result limits, read-only policy, and performance direction. M6 adds no search UI, database schema or index change, provider integration, context or prompt assembly, or snippet expansion behavior.

### Prompt Builder v1

Milestone 7 defines a headless, deterministic application-layer Prompt Builder. It validates already-prepared prompt inputs, selects the approved number of already-ranked retrieval results, applies the documented input precedence, and returns a typed project-owned `PromptAssembly`. It remains independent from React, WXT, browser APIs, persistence, provider SDKs, and network behavior.

Milestone 9 `OutputWorkflow` is the application orchestration boundary that decides the retrieval query, invokes the existing Retrieval Engine, and passes its `RetrievalResults` to Prompt Builder. Prompt Builder does not call Retrieval Engine, rerun scoring, rerank results, or construct the retrieval query. It preserves the separate Knowledge and Snippet collections and their M6 ranking order.

The v1 input contract contains optional Merchant Context, optional Guidance, and optional already-computed Retrieval Results. At least one of Merchant Context or Guidance must contain non-whitespace text; retrieval results alone cannot define the current support task. Images, provider identifiers, destination identifiers, and manual Library-record selection are not Prompt Builder v1 inputs.

`PromptAssembly` contains an ordered collection of sections whose kinds are explicit. The canonical order is instructions, non-empty Guidance, non-empty Merchant Context, selected Knowledge, and selected Snippets. Prompt Builder owns deterministic section content and a static provider-independent instruction section, but not provider message roles, request serialization, model configuration, tokenization, provider limits, or AI execution. Provider adapters consume the assembly and serialize it for their provider boundary.

Provider-facing content remains separate from application metadata. Knowledge sections use the human-readable title and body, while Snippet sections use the human-readable title and content. Record identity, retrieval score, tags, and Knowledge source may remain available as application metadata but are not automatically rendered into provider-facing text. `DECISIONS.md` is authoritative for precedence, grounding, input semantics, selection limits, formatting, empty behavior, metadata treatment, purity, and M7 non-goals.

### Ollama Generation Provider v1

Milestone 8 implemented one narrow project-owned `GenerationProvider` boundary. Application consumers depend on this contract rather than Ollama, HTTP response types, or provider SDKs. A provider exposes stable project-owned identity and a `generate` operation that accepts a transient `GenerationRequest`, optionally receives an `AbortSignal`, and returns a provider-independent `GenerationResult`. `OllamaProvider` is the first infrastructure implementation and uses provider identity `ollama`; no provider registry or placeholder for a future provider was introduced.

The implemented flow is `GenerationProvider` → `OllamaProvider` → `POST http://localhost:11434/api/chat` → `GenerationResult`. The adapter maps availability, missing-model, rejected-request, invalid-response, and caller-cancellation failures into the focused project-owned errors defined in `DECISIONS.md`. This keeps raw Ollama payloads and error shapes behind the infrastructure boundary.

The request contains one already-built `PromptAssembly` and one caller-supplied model identifier. The result exposes only generated text, provider identity, and the requested model. Model selection, prompt construction, output editing, and persistence remain outside the provider adapter. Raw Ollama payloads and response fields remain private to the adapter.

`OllamaProvider` translates each assembly into exactly two Ollama chat messages: the system message contains the Prompt Builder Instructions content without added provider instructions, and the user message is deterministic JSON representing the applicable Guidance, Merchant Context, Knowledge, and Snippet content. The translation preserves Prompt Builder ordering and content, omits absent sections, excludes application metadata, and does not mutate its input. The adapter sends the fixed non-streaming request to the fixed local Ollama chat endpoint through native `fetch` and an injectable fetch-compatible transport seam used by tests. Its production default binds native `globalThis.fetch` to `globalThis` for browser compatibility, and request construction occurs before the transport-error boundary so only actual fetch failures become `ProviderUnavailableError`.

M8 intentionally does not select an extension runtime or wire a browser consumer. The provider remains runtime-independent application/infrastructure code until a later workflow integration decides whether generation runs from a background service worker or another approved boundary. Chrome messaging, localhost host permission, CORS and extension-origin access, browser UI, output workflows, Settings, model persistence, provider selection, timeouts, retries, health checks, model pulling, streaming, and tuning options are therefore deferred. Their eventual implementation requires the milestone that owns them to review the relevant runtime and permission consequences.

The provider boundary is replaceable by construction: `PromptAssembly` flows through `GenerationProvider`, while provider-specific translation and transport remain inside `OllamaProvider`. Future providers implement the same project-owned contract without changing Prompt Builder or introducing provider-name branching across application consumers. `DECISIONS.md` is authoritative for the exact M8 contracts, request translation, transport, response validation, focused error taxonomy, cancellation, privacy, and configuration policy.

### Output Workspace v1

Milestone 9 defines the first complete manual Context-to-generated-output workflow in one extension-owned global Chrome Side Panel. The Side Panel is a persistent companion surface beside the active support website rather than a standalone Workspace tab. The popup remains a launcher for Workspace and Libraries, while the options page retains Knowledge and Snippet CRUD. M9 adds no router, injected UI, content-script change, active-page capture, or reply insertion.

One focused application-layer `OutputWorkflow` coordinates the existing headless boundaries. It depends on `RetrievalEngine`, `PromptBuilder`, and `GenerationProvider`; constructs the deterministic retrieval query; invokes retrieval once; passes original Context, original Guidance, and prepared results to Prompt Builder; constructs `GenerationRequest`; invokes the provider once; and returns `GenerationResult`. React owns presentation only. The WXT Side Panel entry point is the composition root and wires the existing repositories, Retrieval Engine, Prompt Builder, and `OllamaProvider` without a dependency-injection framework, provider registry, factory, or application-level Ollama branching.

Each Generate action automatically retrieves over both Libraries using non-whitespace Merchant Context followed by non-whitespace Guidance, preserving each included value and joining both with exactly `\n\n`. Empty results are valid, manual Library selection is absent, and M6 scoring plus M7 Prompt Builder selection and precedence remain unchanged. `PromptAssembly` remains internal.

Workspace owns transient manual multiline Context and Guidance, a blank-initial transient model field, a guarded Generate action, four-state idle/generating/success/error presentation, editable plain-text output, and Copy of the current edited value. Repeated Generate performs the full workflow again and replaces output only on success. There is no Regenerate, Cancel, Clear, Save, history, persisted draft, model discovery, provider selector, or health-check workflow.

Generation runs directly in the foreground Side Panel page. M9 introduces no background generation or Chrome runtime messaging. The implementation uses WXT's native Side Panel entry point, whose generated manifest must declare `side_panel.default_path`, and adds exactly the `sidePanel` Chrome API permission plus `http://localhost/*` Ollama host permission. `tabs`, `activeTab`, storage, clipboard, scripting, `127.0.0.1`, broad host access, endpoint configuration, and cloud access remain excluded. The popup opens the global Side Panel for the current browser window from the direct Open Workspace user gesture without background messaging. Real browser use additionally requires external Ollama `OLLAMA_ORIGINS` configuration for the environment-specific installed extension origin, which the extension neither hardcodes nor changes.

Workspace state is memory-only while the Side Panel instance remains mounted and may be lost when Chrome closes, destroys, or reloads that page. The layout is fluid and narrow-width-safe, uses available Side Panel width without horizontal scrolling, permits vertical scrolling, and never attempts to force panel width. Database schema version 1 and the existing tables remain unchanged. M9 adds no storage, telemetry, analytics, cloud fallback, prompt or output logging, dependency, or design-system framework. `DECISIONS.md` is authoritative for the exact M9 orchestration, input, state, UI, error, permission, privacy, non-goal, automated-test, and manual Chrome validation contracts.

### Selected-Text Keyboard Command v1

Milestone 10 defines one browser-scoped standard Chrome command, `capture-selection-to-workspace`, that captures explicit selected text from the active tab's main frame, opens or activates the existing global Workspace Side Panel, replaces Merchant Context, focuses Guidance with a collapsed caret at the end of its preserved value, and leaves generation manual. The suggested keys are `Ctrl+Shift+Space` by default and `Command+Shift+Space` on macOS. Chrome's native extension-shortcut manager owns remapping and collision recovery; M10 adds no shortcut Settings UI and does not use an OS-global command.

The extension-platform service worker owns command recognition, active-tab and window validation, on-demand main-frame selection extraction, global Side Panel opening, typed transient result delivery, acknowledgement, and safe failure coordination. It does not own retrieval, prompt construction, `OutputWorkflow`, Ollama generation, persistence, or durable Workspace state. The capture API is invoked first, and `chrome.sidePanel.open({ windowId })` is invoked immediately afterward without awaiting capture so it remains in the keyboard-command user-action turn. Capture and open then settle independently before typed delivery; capture initiation precedes open initiation, but capture completion need not precede open initiation. The panel interaction is open/activate rather than toggle. A focused ready-and-acknowledgement runtime handshake must reliably deliver to both mounted and newly opened Side Panels without a generalized message bus or persistent storage.

Selection extraction uses a focused textarea or text-capable input's explicit selected range first and otherwise uses the main-frame document selection. Non-whitespace selections preserve their exact text, including Unicode, line breaks, and surrounding whitespace; whitespace-only selection is empty. M10 does no DOM conversation scraping, surrounding-text inference, cross-origin-frame capture, screenshot capture, persistent content-script expansion, or permanent support-site access.

M10 adds exactly `activeTab` and `scripting` alongside the existing `sidePanel` permission while retaining exactly `http://localhost/*` in host permissions and the unchanged `https://example.com/*` development content-script match. It adds one normal manifest `commands` entry and no `tabs`, storage, clipboard, broad-host, Settings, dependency, or database change. Successful capture replaces only Merchant Context while preserving Guidance, model, output, and any active generation request; it then focuses Guidance with a collapsed caret at the end without selecting or modifying its content. Empty or failed capture preserves Context, produces safe Side Panel feedback, and does not force Guidance focus. `DECISIONS.md` is authoritative for the exact command, manifest, selection, sequencing, messaging, state, focus, failure, exclusion, automated-test, and manual-validation contracts.

### Project Layer Responsibilities

- Extension platform layer: owns WXT and Manifest V3 entry points, Chrome API integration, permissions, messaging, and extension lifecycle behavior.
- Presentation layer: owns React views, Tailwind styling, components, Context and Hooks usage, interaction state, and accessibility behavior.
- Application layer: coordinates use cases and connects presentation to domain contracts.
- Domain layer: owns provider-independent and storage-independent business concepts and rules.
- Infrastructure layer: implements browser, Dexie storage, and AI-provider adapters behind project-owned contracts.
- Shared layer: contains only stable, cross-layer types and utilities that do not belong to a more specific layer.

React Context and Hooks coordinate presentation state without replacing application services or domain contracts. Independent state-management libraries may not be substituted without an explicit architecture review.

### Planned Folder Structure

The following structure remains architectural guidance. Directories are created incrementally by the milestone that first needs them.

```text
/
├── docs/                  Project memory, architecture, decisions, and milestone state
├── src/
│   ├── extension/         WXT and Manifest V3 entry points and Chrome integration
│   ├── ui/                React, Tailwind, Context, and Hooks presentation code
│   ├── application/       Use-case coordination and application services
│   ├── domain/            Provider-independent and storage-independent business logic
│   ├── infrastructure/    Dexie, browser, and AI-provider adapters
│   └── shared/            Stable cross-layer types and utilities
├── tests/
│   ├── unit/              Isolated domain, application, and component tests
│   ├── integration/       Boundary and adapter integration tests
│   └── e2e/               Real extension workflow tests where practical
└── .github/workflows/     Automated repository validation
```

The structure may be refined only through an approved documentation change. Directories should be created incrementally by the milestone that first needs them.

## Current Status

The platform architecture remains approved and frozen: WXT, Manifest V3, TypeScript, React, Tailwind CSS, pnpm, Dexie, React Context and Hooks, Vitest, Playwright, ESLint, Prettier, Husky, and lint-staged. Milestones 1 through 9 are implemented. Milestone 9 implementation checkpoint `7b88b94` (`feat: implement output workspace`) and M10 runtime sequencing architecture checkpoint `009a28b` (`docs: amend keyboard shortcut runtime sequencing`) were committed, pushed, and synchronized with `origin/master`. The native global Side Panel, provider-independent `OutputWorkflow`, retrieval-to-generation pipeline, and browser-fetch correction passed automated and real Chrome validation. Milestone 10 — Keyboard Shortcut remains current; its implementation is uncommitted, under manual validation, and must adopt the Guidance-focus amendment before final validation without marking the milestone complete.
