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
- Snippet delivery: recognizes typed Text/Image trigger metadata in page frames, loads authoritative local content only after activation, prepares safe clipboard representations through a typed application planner and optional offscreen transport, and performs compare-and-swap trigger cleanup before native user paste.

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

`DATABASE_SCHEMA.md` is authoritative for the implemented physical schema, repository semantics, errors, transactions, testing, and migration policy. The Milestone 3 physical schema introduced Knowledge Entry and Snippet Entry records. M11 implemented the typed Settings aggregate and advanced the physical database to version 2 by adding only the singleton Settings store while preserving both Library stores. M13 implemented forward-only version 3, adding only optional canonical Snippet trigger data and a unique trigger index while preserving Knowledge, existing Snippets, and Settings. M14-B implements forward-only version 4, changing only physical Snippet content representation while preserving the v3 indexes and every historical declaration.

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

Milestone 9 defines the first complete manual Context-to-generated-output workflow in one extension-owned global Chrome Side Panel. The Side Panel is a persistent companion surface beside the active support website rather than a standalone Workspace tab. In the current implementation, the popup remains a launcher for Workspace and Libraries, while the options page retains Knowledge and Snippet CRUD. M9 adds no router, injected UI, content-script change, active-page capture, or reply insertion.

One focused application-layer `OutputWorkflow` coordinates the existing headless boundaries. It depends on `RetrievalEngine`, `PromptBuilder`, and `GenerationProvider`; constructs the deterministic retrieval query; invokes retrieval once; passes original Context, original Guidance, and prepared results to Prompt Builder; constructs `GenerationRequest`; invokes the provider once; and returns `GenerationResult`. React owns presentation only. The WXT Side Panel entry point is the composition root and wires the existing repositories, Retrieval Engine, Prompt Builder, and `OllamaProvider` without a dependency-injection framework, provider registry, factory, or application-level Ollama branching.

Each Generate action automatically retrieves over both Libraries using non-whitespace Merchant Context followed by non-whitespace Guidance, preserving each included value and joining both with exactly `\n\n`. Empty results are valid, manual Library selection is absent, and M6 scoring plus M7 Prompt Builder selection and precedence remain unchanged. `PromptAssembly` remains internal.

Workspace owns transient manual multiline Context and Guidance, a transient model field, a guarded Generate action, four-state idle/generating/success/error presentation, editable plain-text output, and Copy of the current edited value. M9 introduced the field as blank-initial; completed M11 now initializes each new session from the optional saved default while keeping later edits transient. Repeated Generate performs the full workflow again and replaces output only on success. There is no Regenerate, Cancel, Clear, Save, history, persisted draft, model discovery, provider selector, or health-check workflow.

Generation runs directly in the foreground Side Panel page. M9 introduces no background generation or Chrome runtime messaging. The implementation uses WXT's native Side Panel entry point, whose generated manifest must declare `side_panel.default_path`, and adds exactly the `sidePanel` Chrome API permission plus `http://localhost/*` Ollama host permission. `tabs`, `activeTab`, storage, clipboard, scripting, `127.0.0.1`, broad host access, endpoint configuration, and cloud access remain excluded. The popup opens the global Side Panel for the current browser window from the direct Open Workspace user gesture without background messaging. Real browser use additionally requires external Ollama `OLLAMA_ORIGINS` configuration for the environment-specific installed extension origin, which the extension neither hardcodes nor changes.

Workspace task state remains memory-only while the Side Panel instance is mounted and may be lost when Chrome closes, destroys, or reloads that page. The optional M11 saved model is separate Settings state used only to initialize a new session. The layout is fluid and narrow-width-safe, uses available Side Panel width without horizontal scrolling, permits vertical scrolling, and never attempts to force panel width. M9 itself left schema version 1 unchanged; M11 later advanced it to version 2 only for Settings. M9 adds no telemetry, analytics, cloud fallback, prompt or output logging, dependency, or design-system framework. `DECISIONS.md` is authoritative for the exact M9 orchestration, input, state, UI, error, permission, privacy, non-goal, automated-test, and manual Chrome validation contracts.

#### Approved M14-P.4 Workspace Shell Action UX

Decisions 40 and 54 define the shell architecture; Decision 56 moves its implementation ownership from M15 to M14-P.4. The toolbar action now opens/toggles the global AI Support Workspace Side Panel directly through idempotent extension-startup `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`. Chrome owns the interaction; no custom action-click toggle state or new permission exists.

The Side Panel is the primary day-to-day application surface, not the full management application. Its header places a compact icon-only Settings button beside the **AI Support Workspace** title. The button invokes `chrome.runtime.openOptionsPage()` and has the accessible name `Open Settings and Libraries`, native keyboard activation, visible focus, a sufficient hit target, and safe non-blocking failure announcement. The existing authoritative Options application is configured with `options_ui.open_in_tab: true`, so this action opens a normal browser tab rather than Chrome's embedded Options dialog. It is not a duplicate page, custom window, full-width **Open Libraries** action, or dropdown/menu, and it requires no new permission. Snippet Library, Settings, Import / Export, backup, paste behavior, model/provider controls, and future management remain owned by Options; M14-P.4 hides Knowledge from that active navigation while preserving its compatibility data and code.

M14-P.4 retires `action.default_popup`, the popup entry point/component, and popup tests while retaining the popup-free toolbar `action`, `side_panel.default_path`, global scope, keyboard command, `options_ui`, Options boundaries, and least-privilege permissions. Its production Side Panel renders the compact responsive Workspace presentation: Merchant Context, structural Context Images, Guidance / Gist, disabled provider-neutral Model and Generate controls, Generated Output, disabled Save as Snippet/Copy actions, and an editable output surface. These fields are presentation-only boundaries with no mount-time provider call, generation, new persistence, fake output/model data, Context Image ingestion, Prompt Builder wiring, or F3 behavior. M15 owns those functional semantics.

#### Approved M14-P.4 Snippet Management Presentation Boundary

M14-P.4 changes presentation and navigation over the existing single `SnippetEntry` aggregate, Library, authoring flow, repositories, asset ownership, and deletion transaction. Each Library item presents Name/Title, Trigger, a separate Text/Image type chip, a separate visually numeric-only Usage chip with accessible count label, a bounded Details preview, and Actions in Delete → Edit → Copy order. Icon actions keep exact accessible names, native keyboard behavior, visible focus, and tooltip/title equivalents. Delete first opens a target-identifying Cancel/Delete confirmation; only explicit confirmation invokes existing atomic associated-data deletion.

M14-P.4.1 adds the approved `CopySnippetToClipboard` application boundary. It loads a stable Snippet identity and its authoritative Image asset when applicable, then delegates to the same Text serialization, Image validation/preparation, and clipboard writers used by delivery. Options supplies an explicit user-click clipboard port; the operation never fabricates trigger/catalog/editor state, invokes Automatic Paste, or creates a usage receipt. No second serializer, Image converter, native protocol path, or preview-derived clipboard path exists, and Library Copy does not count as usage under the current Decision 51 definition.

Text Details use existing safe rich/plain projection. Image Details and Image Edit use bounded visual containment without changing stored bytes. M14-P.4 repairs the observed retained-image broken-preview behavior, keeps the existing image visible during metadata edits, retains explicit screenshot `Ctrl+V`, file selection, replacement, and removal, and shows an intentional fallback when a valid asset cannot render. It never opens a picker or clipboard action automatically, silently deletes/replaces an asset, or changes encoding, resolution, dimensions, quality, PNG/JPEG/WebP semantics, Decision 42 safety, or M14-P.1 delivery behavior.

Knowledge hiding is a view/navigation boundary only. `KnowledgeEntry`, its repository/store, historical records, tests, Backup v1–v7 import/restore, and current versioned M6/M7/M9 contracts remain intact. M14-P.4 adds no migration, Backup version, new Snippet type, retrieval change, generated metadata, provider behavior, or functional AI Workspace behavior. M15 retains Context Image processing, model selection behavior, Generate/provider execution, generated-output lifecycle/Copy, Prompt Builder integration, and F3 Save as Snippet.

### Selected-Text Keyboard Command v1

Milestone 10 defines one browser-scoped standard Chrome command, `capture-selection-to-workspace`, that captures explicit selected text from the active tab's main frame, opens or activates the existing global Workspace Side Panel, replaces Merchant Context, requests Guidance DOM focus with a collapsed caret at the end of its preserved value, and leaves generation manual. The suggested keys are `Ctrl+Shift+Space` by default and `Command+Shift+Space` on macOS. Chrome's native extension-shortcut manager owns remapping and collision recovery; M10 adds no shortcut Settings UI and does not use an OS-global command.

The extension-platform service worker owns command recognition, active-tab and window validation, on-demand main-frame selection extraction, global Side Panel opening, typed transient result delivery, acknowledgement, and safe failure coordination. It does not own retrieval, prompt construction, `OutputWorkflow`, Ollama generation, persistence, or durable Workspace state. The capture API is invoked first, and `chrome.sidePanel.open({ windowId })` is invoked immediately afterward without awaiting capture so it remains in the keyboard-command user-action turn. Capture and open then settle independently before typed delivery; capture initiation precedes open initiation, but capture completion need not precede open initiation. The panel interaction is open/activate rather than toggle. Each queued transient result has a delivery ID; a newly mounted panel sends readiness, pending delivery is retried, application produces a matching acknowledgement, and only the matching acknowledged queue head is removed. This focused handshake reliably delivers to mounted and newly opened Side Panels without a generalized event bus, durable queue, or persistent storage.

Selection extraction uses a focused textarea or text-capable input's explicit selected range first and otherwise uses the main-frame document selection. Non-whitespace selections preserve their exact text, including Unicode, line breaks, and surrounding whitespace; whitespace-only selection is empty. M10 does no DOM conversation scraping, surrounding-text inference, cross-origin-frame capture, screenshot capture, persistent content-script expansion, or permanent support-site access.

M10 adds exactly `activeTab` and `scripting` alongside the existing `sidePanel` permission while retaining exactly `http://localhost/*` in host permissions and the unchanged `https://example.com/*` development content-script match. It adds one normal manifest `commands` entry and no `tabs`, storage, `clipboardRead`, `clipboardWrite`, `<all_urls>`, permanent support-site host, `127.0.0.1`, Settings, dependency, or database change. Successful capture replaces only Merchant Context while preserving Guidance, model, output, and any active generation request; after every success the presentation calls `guidanceElement.focus()` and `setSelectionRange(end, end)` without selecting or modifying Guidance. Empty or failed capture preserves Context and Output, produces safe Side Panel feedback, and does not force Guidance focus.

When the command opens a closed Side Panel, the browser transfers focus to the panel and the requested Guidance focus is expected to be immediately usable. When the Side Panel is already visible and the webpage owns keyboard focus, the same DOM focus and end-caret request remains mandatory but is best effort at the browser-host level: Chrome may keep keyboard input routed to the webpage, and the user may need to click Guidance. Chrome exposes no supported API for activating or focusing an already-visible Side Panel. M10 therefore adds no `window.focus()` assumption, retry, delay, polling, close/reopen, toggle, permission, persistence, notification, tab, or window workaround. `DECISIONS.md` is authoritative for the exact command, manifest, selection, sequencing, messaging, state, focus, platform limitation, failure, exclusion, automated-test, and manual-validation contracts.

### Saved Default Model Settings v1

Milestone 11 adds one local Settings capability whose application-owned aggregate is `Settings { defaultModel: string | null }`. `null` is the application default and means a new Workspace Side Panel session starts with a blank transient model field. A non-null value is an opaque Ollama model identifier after outer whitespace is trimmed. No installed model is assumed, and placeholder text such as `qwen2.5:7b` is not a default.

Settings is a third section in the existing options-page shell alongside Knowledge and Snippets. It contains one focused form with a labelled model input, help text, an explicit Save button, loading/saving state, normalized dirty-state handling, and accessible success or failure feedback. It uses existing local navigation without a router or separate page; popup behavior remains unchanged.

The dependency flow is `SettingsRepository` → focused Settings load/save application boundaries → options-page or Side Panel composition root → presentation. The domain/application layers own the `Settings` type, `null` default, normalization, and safe error mapping. The infrastructure layer owns the Dexie adapter and maps the aggregate to `{ id: 'global', defaultModel }`. React never accesses Dexie directly, and no arbitrary key/value Settings framework is introduced.

Milestone 11 advanced database `ai-support-workspace` from Dexie schema version 1 to version 2 by adding only `settings: 'id'`. The singleton table has no additional indexes or timestamps. The forward-only migration preserves all Knowledge and Snippet records without transformation and creates no Settings record. An absent record is normal; the repository returns absence and the application load boundary resolves it to `{ defaultModel: null }`. The minimum repository contract contains singleton load and save only.

The Side Panel composition root loads Settings once at startup and resolves the initial model before establishing editable Workspace state. It passes the resolved model into Workspace exactly once, preventing asynchronous load from overwriting user input. Missing or null Settings initializes blank. Load failure also initializes blank and produces safe non-blocking feedback. Workspace edits remain transient, never save Settings, and supply the current model to the unchanged `GenerationRequest`. Closing and reopening reloads the saved default; an already-mounted panel does not subscribe or live-sync.

Prompt Builder and `OllamaProvider` do not read Settings, provider identity remains `ollama`, and the endpoint remains fixed at `http://localhost:11434`. M11 adds no provider selection, endpoint configuration, behavior tuning, persistent writing preferences, theme, shortcut setting, Workspace persistence, secret storage, generic global state, runtime message, database subscription, dependency, or manifest permission. `DECISIONS.md` and `DATABASE_SCHEMA.md` are authoritative for the complete M11 contract and migration.

The implemented M11 architecture passed deterministic application, persistence, migration, UI, Workspace, and M10 handshake regression coverage plus real Chrome validation. Manual validation confirmed first-run blank state, save/reload persistence, new-session initialization, transient override restoration, real local Ollama generation, clear-to-null behavior, Library preservation, shortcut compatibility, popup navigation, and unchanged permissions. M11 is complete and synchronized at implementation checkpoint `d40e031` (`feat: add default Ollama model settings`).

### Import / Export v1

Milestone 12 defines the current manual local backup and replace-only restoration of the currently persisted Knowledge, Snippet, and Settings domains. It supports recovery after reinstall or local browser-data loss and physical transfer of a backup file to another Chrome profile or computer. M12 provides no cloud synchronization, collaboration, sharing workflow, bulk editing, automatic backup, or scheduled backup; Decision 48 separately approves future periodic local backup by reusing this canonical boundary.

#### Public Backup Contract

The public application-owned JSON DTO is distinct from Dexie records, physical store names, schema versions, and the Settings singleton identity. Format version 1 has the exact envelope shape:

```json
{
  "format": "ai-support-workspace-backup",
  "formatVersion": 1,
  "exportedAt": "2026-08-02T08:00:00.000Z",
  "data": {
    "knowledge": [],
    "snippets": [],
    "settings": {
      "defaultModel": null
    }
  }
}
```

Every displayed key is required, and strict version 1 validation rejects every unexpected key. `format` is exactly `ai-support-workspace-backup`; `formatVersion` is integer `1`; and `exportedAt` is a valid UTC ISO-8601 timestamp. Application and Dexie schema versions are not included. Settings is always present and exposes only `defaultModel: string | null`; a missing physical Settings record resolves through the M11 default to `null`, and physical ID `global` never enters the DTO.

Knowledge records contain exactly non-nullable strings `id`, `title`, `body`, `createdAt`, `updatedAt`, and `source`, plus non-nullable `tags: string[]`. Snippet records contain exactly non-nullable strings `id`, `title`, `content`, `createdAt`, and `updatedAt`, plus non-nullable `tags: string[]`. Version 1 contains no usage counts, Snippet triggers, rich content, images, or future fields.

Backup-format versioning is independent from Dexie schema versioning. The completed M12 implementation exports and accepts version 1. M13 keeps version 1 frozen and importable, adds strict version 2 for Snippet triggers, and continues rejecting unsupported future versions. Future format migrations belong inside the parser/import boundary and never redefine an earlier version.

Export orders Knowledge and Snippet arrays by `createdAt` ascending and then `id` ascending, preserves tag order and all text exactly, and produces filename `ai-support-workspace-backup-YYYY-MM-DDTHH-mm-ssZ.json` using UTC without colons. Object-key order is not semantically significant, and database iteration order is not part of restore equivalence. Normal browser collision behavior applies. Serialization occurs in memory, followed by a JSON Blob, object URL, temporary-anchor download, and object-URL revocation. No Chrome downloads or filesystem permission is used.

#### Size, Validation, and Security

Import rejects `File.size` above 25 MiB (`26,214,400` bytes) before reading or parsing. Export measures serialized UTF-8 bytes and refuses output above the same limit. There are no record-count, per-store, or new field-length limits.

Every file is untrusted. Processing is size check, text read, JSON parse, exact identifier/version/envelope/data validation, complete Knowledge/Snippet/Settings validation, duplicate-ID validation, trusted application-model construction, and only then persistence. Validation is strict and all-or-nothing: missing, unexpected, or dangerous keys; invalid types, nullability, canonical UUIDs, ISO timestamps, Settings values, or duplicate IDs reject the complete file. Dangerous keys include `__proto__`, `prototype`, and `constructor`.

The parser does not repair data and performs no persistence. It uses no evaluation, executable HTML, external-resource loading, arbitrary or prototype-based merging, paths, URL fetch, or script interpretation. HTML-like values remain plain strings and React renders them through normal escaped text rendering. Valid text, whitespace, tags and tag order, IDs, timestamps, and metadata remain exact.

#### Export and Restore Boundaries

The conceptual export flow is:

```text
Backup snapshot reader
→ export application service
→ BackupFileV1 DTO
→ serializer
→ browser download adapter
```

The conceptual import flow is:

```text
Browser file reader
→ JSON parser
→ strict BackupFileV1 validator
→ import preview model
→ restore application service
→ transactional restore port
→ Dexie transaction adapter
```

React owns interaction and presentation but no backup-format or persistence rule. The parser/validator never writes. The application layer owns replace policy; infrastructure maps public DTOs to physical records, restores the `global` Settings identity, and owns transaction mechanics. Provider, Prompt Builder, Retrieval Engine, Workspace, and M10 capture boundaries remain unchanged.

M12 restore has exactly one mode: replace all current Knowledge, Snippets, and Settings. It clears and writes all three stores within one Dexie read/write transaction after validation. Either every write succeeds or rollback leaves existing state unchanged. Ordinary create/update repositories are not used because they generate IDs or timestamps; a focused application-owned restore persistence port preserves every logical field exactly. Imported `defaultModel: null` clears the saved default.

The round-trip invariant is export followed by controlled restore yields equivalent persisted Knowledge, Snippets, and Settings, including identical IDs, timestamps, text, tag order, source, and default model. Public record-array ordering and physical database ordering are not restore-equivalence requirements.

#### Options-Page Integration

Import / Export is the fourth top-level section in the existing options-page shell. Export provides explanation, privacy warning, `Export backup`, busy state, and status. Import provides one labelled input accepting `.json,application/json`, validated filename/timestamp/Knowledge count/Snippet count/saved-model preview, destructive warning, unchecked acknowledgement, `Restore backup`, Cancel, busy state, and status. MIME and extension are advisory; content validation remains authoritative. Selecting a replacement file, validation failure, successful restore, and Cancel reset the applicable selected-file preview, confirmation, and status state.

The warning is `Restoring this backup will replace your current Knowledge, Snippets, and saved Settings.` The checkbox is `I understand that my current local data will be replaced.` Restore remains natively disabled until checked. Preview never renders Knowledge bodies or Snippet content. Valid empty Library arrays remain exportable and, after normal acknowledgement, clear current Libraries while restoring Settings.

Exact user messages are `Backup exported.`, `Couldn't export your data. Try again.`, `This backup file is too large. Choose a file smaller than 25 MB.`, `Couldn't read this backup file. Choose another file.`, `This isn't a valid AI Support Workspace backup file.`, `This backup version isn't supported by this version of AI Support Workspace.`, `Couldn't restore the backup. Your existing data was not changed.`, and `Backup restored.` The restore-success summary also reports the restored Knowledge count, Snippet count, and that Settings was restored. Raw JSON, browser, validation, and Dexie errors remain hidden.

After success, options-page-local navigation must show restored Knowledge, Snippets, and Settings without a browser restart. The smallest local refresh/remount mechanism is used; no event bus, runtime broadcast, or subscription framework is added. An already-mounted Side Panel does not live-sync imported Settings or transient Context, Guidance, Output, or model state; a recreated panel loads the restored default under M11 behavior.

The section uses visible headings and labels, keyboard-operable controls, associated explanation, natural focus order, accessible busy states and live announcements, native disabled semantics, preview focus after validation, accessible validation-error focus or equivalent announcement, and narrow-width-safe options layout. It adds no popup action, Side Panel UI, extension page, router, per-Library import control, generic data-management framework, merge controls, drag-and-drop, JSON editor, history, or scheduler.

Backup files may contain merchant knowledge, internal notes, reusable support replies, and saved local-model configuration. The UI states `Backup files may contain merchant knowledge, internal notes, and reusable support replies. Store them securely.` M12 provides no encryption, password protection, compression, ZIP, cryptographic signing, or related dependency.

M12 changes no manifest, Chrome permission, host permission, Dexie schema, dependency, or configuration. Database schema remains version 2. Any later implementation need for such a change is an architecture conflict requiring review.

### Snippet Trigger Expansion v1

Milestone 13 adds one optional plain-text expansion trigger to each existing Snippet. It does not create a second Snippet domain, rich template model, provider workflow, or generalized browser automation framework. The domain shape becomes `SnippetEntry { ...existingFields, trigger: string | null }`; existing records resolve to `null` and remain fully editable.

#### Trigger Contract

A blank Trigger field maps to `null`. Otherwise, a trigger contains 2–32 ASCII characters including its leading semicolon. User input is lowercased with locale-independent `toLowerCase()` and must then match `^;[a-z0-9]+(?:-[a-z0-9]+)*$`. Uppercase input is accepted and stored canonically; non-empty input is not trimmed, and whitespace, underscores, non-ASCII characters, unsupported punctuation, consecutive hyphens, and a trailing hyphen are rejected. Examples include `;hello`, `;refund2`, and `;shopify-limit`.

Canonical triggers are unique across Snippets. The application boundary owns normalization and validation, checks duplicate availability for actionable UI feedback, and maps the authoritative unique-index conflict for concurrent writes into one focused duplicate-trigger error. Create and update accept explicit `trigger: string | null`; delete releases the trigger when the record is removed.

#### Activation and Editor Adapters

Expansion is activated only by a trusted, cancelable `beforeinput` event with `inputType: 'insertText'`, `data: ' '`, no active composition, and an actively focused supported editor. The editor selection must be collapsed. Immediately before the caret must be one complete trigger-shaped candidate whose left boundary is the editor start or Unicode whitespace. The candidate is lowercased only for catalog lookup, so typed matching is case-insensitive while the original typed range remains the exact replacement range. At most the 32 trigger characters plus the boundary are inspected; unrelated editor text is never scanned.

On a catalog hit, the event's default Space insertion is prevented and the adapter replaces exactly the trigger range with the saved Snippet `content` followed by one U+0020 space. The content is preserved exactly as plain text, surrounding text and existing line breaks remain unchanged, and the caret is collapsed after the inserted space. The adapter produces the bubbling, composed `input` notification expected by the host editor; it does not synthesize `change`, whose normal focus/commit lifecycle remains host-owned. Inserted content is guarded so its text cannot recursively trigger expansion.

Partial or unknown triggers; selected text; composition; paste; programmatic changes; non-Space input; a missing left boundary; a match away from the caret; a noncancelable event; an unavailable catalog; and unsupported editors all preserve the browser or host application's normal behavior. The extension does not prevent the Space event in those cases and presents no disruptive page UI.

The focused adapter contract is conceptually:

```ts
interface EditorAdapter {
  readonly kind: 'textarea' | 'textInput' | 'contenteditable';
  readTriggerCandidate(maxLength: number): TriggerCandidate | undefined;
  replaceTriggerWithPlainText(candidate: TriggerCandidate, text: string): boolean;
}
```

Native `textarea` supports single-line and multiline Snippet content through selection ranges and native value replacement. Free-form `input` elements with absent, `text`, or `search` type use the same range mechanism but may expand only Snippets whose content contains neither carriage-return nor line-feed characters. When a matched Snippet contains `\r` or `\n`, the single-line input adapter declines before preventing Space, leaves the host value untouched, and allows normal Space behavior to continue unchanged. It must never flatten, truncate, normalize, or partially insert the Snippet merely to fit the input. Password, email, URL, telephone, number, date, and other specialized inputs are unsupported.

Generic `contenteditable` supports single-line and multiline Snippet content through the active editing root and a DOM `Range`: it walks backward only through adjacent text nodes within that root, stops at block, `<br>`, embedded-element, or root boundaries, and deletes the exact candidate range. It inserts a fragment of safe text nodes plus extension-created `<br>` boundaries corresponding to the Snippet's plain-text line breaks; it never parses Snippet content as HTML. It then places the Selection after the appended space. If a safe exact range or expected input notification cannot be produced, the adapter declines before preventing Space.

Intercom remains the required primary real-world target, but its DOM does not enter domain or application contracts. M13-B.2 intentionally configures the generic content script with exactly `matches: ['http://*/*', 'https://*/*']` and `allFrames: true`, making expansion available on normal HTTP and HTTPS websites. Chrome-protected pages, extension pages, `file://` pages, and non-HTTP(S) schemes remain unsupported. Each injected matching frame operates locally; there is no cross-frame traversal, `match_about_blank`, fallback-origin injection, `<all_urls>`, `tabs`, clipboard, storage, persistent catalog, or new AI host permission. A destination-specific editor adapter still requires observed evidence that the corrected generic adapter is insufficient.

Content-script event and DOM integration is structural and realm-safe. Trusted/cancelable Space `beforeinput` remains the activation boundary, but dispatch does not depend on `event instanceof InputEvent`. Supported editor, text-node, and internally created Range/candidate validation uses node type, local name, owner document, capabilities, and internal candidate identity rather than current-global constructor identity. The broad site scope does not authorize full-editor scans: candidate inspection remains limited to 32 trigger characters plus the left boundary, and unsupported or unsafe editors fail closed without preventing normal typing.

#### Runtime and Trigger Catalog

The dependency flow is:

```text
Dexie Snippet repository
→ trigger catalog application service
→ service-worker transient catalog coordinator
→ one ordered typed runtime Port per matched frame
→ frame-local content-script cache
→ editor adapter
```

Dexie remains the only persistent source of truth. The service worker may hold one derived in-memory map from canonical trigger to the metadata-only typed descriptor: delivery kind, canonical trigger, and Snippet ID. Each matched content-script frame maintains one long-lived typed `chrome.runtime.Port` connection and may enable its frame-local cache only while that port is connected and the frame holds one completely validated atomic snapshot identified by the current worker-session epoch and catalog revision. Invalidation and complete-snapshot messages travel in order through that port. Neither layer writes the catalog to `chrome.storage`, `localStorage`, IndexedDB, or another durable store, and the content script never imports Dexie or a repository implementation. Snippet content, generated HTML, Blob, base64, asset ID, filename, MIME type, and image bytes remain outside frame catalogs and are loaded authoritatively only after activation.

Port disconnection immediately clears and disables the frame cache, so a disconnected frame cannot expand from its former snapshot and normal editor input continues unchanged. Reconnection requests a complete snapshot and does not re-enable expansion until that snapshot is completely validated and atomically installed. A service-worker restart creates a new epoch and rebuilds from the repository; frames reject older-epoch snapshots. Unknown messages, invalid or stale snapshots, revision regression, extension reload, disconnection, or messaging failure clears or leaves the local cache disabled.

M14-J.6 preserves normal WXT static content-script injection for new HTTP/HTTPS navigations and adds bounded, best-effort recovery for eligible pages that were already open at extension install/update/reload or browser startup. The service worker listens to `runtime.onInstalled` and `runtime.onStartup`, queries only exact `http://*/*` and `https://*/*` matches, skips discarded tabs, resolves the current packaged content-script files from the generated manifest, and reinjects them into all matching frames with a maximum concurrency of four. One tab or frame denial cannot abort recovery for the others. There is no polling, alarm, durable recovery state, page inspection, or artificial service-worker keepalive.

Each frame owns one versioned runtime registry in its isolated global. Re-executing the current script reconnects the existing runtime instead of adding listeners; an obsolete or unrecoverable owner is safely disposed and replaced one-for-one. A disconnected catalog client also attempts one interaction-driven reconnect on focus or the next qualifying `beforeinput`, then requires a complete snapshot from the current worker epoch before activation. This makes ordinary service-worker termination recoverable without continuously reinjecting scripts or keeping the worker alive.

Decision 44 grants persistent host access at exactly `http://*/*` and `https://*/*`, including the existing localhost provider endpoint. `activeTab` remains for the M10 user-gesture workflow but is not lifecycle-recovery authority; the extension still declares no `tabs`, `file://`, `<all_urls>`, or `clipboardRead` permission. Chrome user site-access controls remain authoritative, and restricted/denied pages fail quietly without examining or transmitting page content.

Before Snippet create, edit, delete, import, or restore persistence, the coordinator sends invalidation through the ordered runtime port to every currently connected frame, and each connected frame clears its cache immediately. After successful persistence, the coordinator rebuilds from Dexie and publishes one complete new snapshot. If persistence fails, it republishes the unchanged snapshot. Publication failure leaves each affected frame disabled until reconnect or a successful refresh; the persisted operation is reported accurately and the options page provides safe temporary-unavailability feedback. No stale cache is knowingly used, and no durable queue, browser-storage catalog, polling loop, or per-keystroke service-worker lookup is introduced.

The service worker owns only transient catalog distribution and the existing M10 browser coordination. It does not own Snippet CRUD, React state, provider execution, Prompt Builder, Retrieval Engine, or a durable queue. Trigger expansion sends no editor content, Snippet content, or trigger usage to Ollama, OpenAI, analytics, or telemetry.

#### M14-I Unified Clipboard Delivery

M14-I uses one typed delivery planner for Text and Image entries. Frame catalogs contain only kind, canonical trigger, and Snippet ID. Text plans contain deterministic `text/plain` plus project-owned safe `text/html`; Image plans reload and validate the exactly-one owned asset after activation.

Clipboard transport uses explicitly granted optional `clipboardWrite` and `offscreen`, one packaged static `CLIPBOARD` document, bounded request-scoped JSON-compatible binary encoding, one serialized write at a time, and immediate lifecycle closure. `clipboardRead` remains prohibited. M14-I and clipboard-only mode never synthesize paste; Decision 45 separately permits only the narrowly scoped, focus-guarded Windows automatic-paste capability after clipboard success.

Decision 42 gates image decode using encoded PNG/JPEG/WebP metadata before any decoder/canvas allocation, caps width/height at 8,192, pixels at 16,777,216, decoded RGBA at 64 MiB, and planned two-surface raster work at 128 MiB. Animated WebP and oversized images fail closed without changing stored data.

Once the synchronous trigger path accepts a trusted cancelable Space `beforeinput`, the content runtime consumes that activation command with `preventDefault()` before asynchronous delivery begins. Clipboard success precedes exact trigger-only cleanup because no activation Space is inserted. Changed text, selection, root, catalog identity, or request identity skips cleanup and cannot overwrite user edits; the prepared clipboard remains usable through native Ctrl+V.

M14-I.1.2 preserved project-owned failure identity across planner, permission, offscreen creation, runtime messaging, response validation, Clipboard API availability/format/write, and image validation/decode boundaries. Real Chrome then identified `clipboard-write-failed` at the final offscreen Text `navigator.clipboard.write()` operation. M14-I.1.3 therefore routes only Text through one temporary offscreen `copy` handler and `document.execCommand('copy')`; the handler sets the authoritative planned `text/plain` and safe `text/html`, calls `preventDefault()`, and is removed in every path. Success requires a true command result, handler execution, and both representations written without exception. Safe HTML is never parsed, rendered, or inserted into DOM. Real Chrome validates Text clipboard preparation, trigger cleanup, copied notice, bold/italic/link native paste, and bullet/numbered-list native paste.

Real Chrome separately proved that the normal Image `ClipboardItem` / `navigator.clipboard.write()` path reaches the final offscreen operation and fails with `stage=offscreen-write`, `code=clipboard-write-failed`, `kind=image`, and `phase=clipboard-write`. M14-I.1.4 removed that path from normal Image delivery. After Decision 42 inspection and genuine JPEG/WebP-to-PNG conversion, it constructed a disposable `File` named `snippet.png` with MIME `image/png` and added it synchronously through a temporary copy event. Real Chrome reported command success but native paste produced `snippet.png`, not the intended image. The File item is therefore a failed final representation, not a valid inline/native-image fallback.

M14-I.1.5.2 concludes the browser feasibility probe without approving production architecture. The corrected visible 96 × 96 A1 probe produced `TEXT` and failed genuine Image semantics. Focused extension-page B used the same deterministic PNG and produced `VISIBLE IMAGE`, proving Chrome/Windows image clipboard capability from a focused extension document but unacceptable focus-stealing UX. A2/F9 was not run and is no longer required. Decision 43 subsequently selected the native architecture; after its real-Chrome end-to-end pass, M14-I.5 removed M14-I.1.4 and all feasibility runtime probes while retaining this history.

#### M14-K Optional Automatic Paste

Decision 45 attaches one optional application capability after the existing Text/Image clipboard-success boundary:

```text
trusted activation + one-use editor guard
→ authoritative Text or Image clipboard preparation
→ browser sender/tab/window proof + native foreground context capture
→ exact compare-and-swap trigger cleanup
→ immediate post-cleanup editor/caret proof
→ consume one paste authorization
→ final browser and native foreground/clipboard/modifier checks
→ at most one native Ctrl+V input sequence
```

`AutomaticPasteTransport.requestPaste` expresses only “paste the already-prepared clipboard once.” Text and Image keep their existing transport and representation behavior; neither creates a separate automatic-paste content route. `clipboard-only` remains the default and a first-class permanent workflow. `automatic` is opt-in and uses the same clipboard preparation before attempting Windows input. An automatic-only browser/native precheck failure does not suppress the existing exact cleanup after clipboard success; it simply selects copied/manual-fallback UX. Clipboard failure, stale cleanup state, unavailable native support, unsafe focus, changed foreground window, changed clipboard, active modifier, concurrency, or uncertain input produces no automatic retry and leaves any successfully prepared clipboard available for manual `Ctrl+V`.

The browser owns DOM/editor knowledge. A content-script activation guard captures the supported editor, composed focus chain where applicable, exact trigger/caret state, frame document, request, and catalog epoch/revision. It is one-use and permanently invalidated by focus/selection/caret departure, any input/content mutation other than its own exact authorized cleanup, editor disconnection, visibility/page lifecycle change, or navigation. Exact cleanup atomically transitions the guard to its expected collapsed cleanup caret before immediate revalidation. The service worker binds that proof to `MessageSender.documentId`, `frameId`, `tab.id`, `tab.windowId`, active-tab state, and focused-window state, and keeps only one in-memory, request-lifetime, one-use authorization. A service-worker restart fails closed. No durable authorization, independent timer, or paste queue exists.

The native host remains DOM-agnostic. A strict protocol-v2 capture operation records the current Windows foreground root `HWND`, its owning process ID, and `GetClipboardSequenceNumber()` after clipboard preparation. The final narrow `paste-clipboard` operation must observe the same non-null root window/process and unchanged clipboard sequence immediately before input, with Ctrl/Shift/Alt/Windows keys all up. It never focuses a window or interprets browser/profile/site/editor data. This distinguishes multiple browser windows without hardcoding Chrome or a destination. The browser guard is the only proof of the internal editor; because native Windows input cannot atomically identify that DOM object, the residual same-window last-instant focus race must be stressed in M14-K.2/M14-K.3 and blocks release if it is not acceptably bounded.

The Windows adapter extends the existing C#/.NET companion; AutoHotkey is not a permanent dependency. Protocol v1 remains exact and frozen. Protocol v2 accepts no arbitrary key, command, path, executable, content, HTML, image, or customer data. The only input call is one `SendInput` array containing Ctrl down, V down, V up, and Ctrl up. A full count is reported as `paste-issued`, meaning input was accepted—not that insertion was observed. Partial acceptance, disconnect, or lost response after input may have begun is `indeterminate` and never retried. The host does not inject speculative key-up cleanup or release modifiers it did not own; the requested balanced four-event array is the only approved modifier-state measure. UIPI/elevation can prevent injection.

Automatic delivery uses one extension-wide no-queue critical section from clipboard preparation through the paste result plus one immediate-fail native paste mutex. A second fully validated activation still consumes its activation Space synchronously; if it is then declined before it can replace the clipboard, its trigger remains and a concise retry-later delivery-busy message must not claim that second Snippet was copied. The automatic-paste result taxonomy is `paste-issued`, `clipboard-only`, `unsafe-focus`, `not-foreground`, `clipboard-changed`, `unsafe-keyboard-state`, `busy`, `native-unavailable`, `input-injection-failed`, and `indeterminate`. Automatic success is announced as `Paste sent`. Once clipboard success is confirmed, every automatic non-success falls back to the existing truthful copied notice, with `(trigger unchanged)` when cleanup was not authorized. The clipboard is not cleared after success, so a later user `Ctrl+V` naturally inserts it again.

The M14-K.2 Settings field is `snippetPasteMode: 'clipboard-only' | 'automatic'`, defaulting to `clipboard-only`, in the existing singleton Settings aggregate/repository. At that checkpoint it added no store, index, or Dexie version; Backup v5 stayed frozen, strict Backup v6 became the export format, and every v1-v5 import supplied `clipboard-only`. Windows automatic mode depends on the existing optional native companion/permission. Unsupported platforms and unavailable helpers remain fully supported through clipboard preparation and manual `Ctrl+V` fallback.

M14-K.2 implements this architecture end to end: Settings/Backup v6, the shared extension boundary, one-use browser guard, sender/tab/window checks, strict protocol v2, native context/modifier/mutex validation, and one four-event `SendInput` call. Protocol v1 and existing clipboard transports remain compatible. Automated coverage uses mock/fake browser and Win32 boundaries and performs no real keyboard injection. M14-K.3 real Crisp/Intercom Text/Image validation is Principal-approved; the residual same-window race remains documented.

M14-K.2.3 corrects the first real-Intercom automatic Text blocker without changing that architecture. The failed same-worker trace reached `post-cleanup-check` with `unsafe-focus` after successful clipboard preparation and exact cleanup. The shared contenteditable guard had bound the post-cleanup caret to one raw DOM `Node` identity; an editor may replace that node with a structurally identical live node while preserving the exact composed caret. The corrected model captures the post-cleanup editor structure plus the exact root-relative boundary path/offset, moves through one scoped `pre-cleanup` → `post-cleanup` transaction before the page input notification, and revalidates after that notification. Structurally different content, a different boundary, focus departure, disconnection, lifecycle change, or stale state still permanently invalidates authorization. This is generic for normal and Shadow-DOM contenteditable editors; input/textarea retain exact value and selection checks. Native protocol and `SendInput` are unchanged. The later M14-K.3 evidence validates the corrected path in real Intercom and Crisp.

M14-K.2.3.4 corrects the proven activation race. A real Intercom trace showed that accepted Space was not prevented and a trusted composed same-editor/root `insertText` arrived before the owned cleanup input, invalidating authorization. `handleBeforeInput` now returns an explicit accepted/ignored result. Only an accepted activation is synchronously prevented by the document runtime, and asynchronous delivery starts afterward. Rejected events retain ordinary Space. Textarea, supported input, generic contenteditable, and composed Shadow-DOM cleanup compare-and-swap against the unchanged trigger-only state; the owned cleanup `InputEvent` remains exact and synchronous. Any later non-owned input or editor mutation invalidates without a grace period. The transient catalog adds only a privacy-safe single-line-eligibility boolean so multiline Text remains rejectable in supported single-line inputs before Space prevention. Clipboard-only and automatic modes share these activation and cleanup semantics; manual `Ctrl+V` remains permanent. Native protocol and `SendInput` are unchanged. M14-K.3 later real-browser evidence validates this corrected path in Intercom and Crisp.

M14-K.3 completes the current validation/optimization-readiness review without changing architecture. Principal evidence passes automatic Text and Image in Intercom and Crisp, clipboard-only Text and Image, unknown-trigger ordinary typing, and live paste-mode propagation. The successful trace keeps automatic mode aligned at persisted/worker/frame/branch layers, suppresses accepted activation input, retains valid post-cleanup focus/caret/selection/structure/lifecycle authorization, and ends at one `paste-issued` native result with 4/4 events, last error 0, and the correct 40-byte win-x64 `INPUT`.

The Image hot path remains authoritative load/ownership validation → metadata-before-decode safety → PNG direct return or JPEG/WebP browser decode and PNG re-encode → base64 Native Messaging serialization → one-shot native parse/WIC decode → registered PNG plus CF_DIBV5 clipboard ownership → the shared optional paste boundary. M14-P.1 re-measures this current path before optimization. Text and direct PNG browser preparation are Category D regression baselines; repeated Blob reads/copies are measurable low-single-digit Category B work; genuine non-PNG conversion and one-shot process consolidation remain Category C architectural opportunities. The newly isolated Category-A operation is bounded protocol-v1 PNG request serialization: an efficient byte-array base64 API plus exact bounded fallback replaces the prior monolithic binary string without changing request shape or content. A deterministic 4.46 MiB fixture improves from 254.3 ms to 1.5 ms warm median. Decision 42 limits, Decision 43 one-shot authority, and protocol v1/v2 remain unchanged. Production installer/registration, signing, updater, and version migration remain a separate distribution architecture boundary.

M14-P.1's benchmark harness is test/development-only. It imports the real planner, serializer, browser preparer, and request builder through local Vite/Chromium, generates stable valid 64×64, 640×480, and 1440×900 fixtures, and reports cold plus warm distributions with no CI timing threshold. It introduces no production instrumentation or cache. Live synthetic paste is deliberately excluded because it could inject input; live native PNG write is excluded because it would overwrite the user's clipboard. Content-free one-shot capability and context-capture measurements remain sufficient to show current startup materiality. Further native consolidation would require separately approved lifecycle/protocol architecture.

#### M14-P.5 Performance Closure and M14-O Hot-Path Boundary

Decision 57 closes broad speculative performance work before M14-O. M14-P.1 remains the authoritative current delivery baseline: Text planning/serialization is effectively immediate, guarded PNG preparation is efficient, native request serialization has already received the evidence-backed optimization, and genuine JPEG/WebP decode/re-encode remains an accepted quality-preserving cost. No new performance milestone sits between M14-P.5 and M14-O.

Text is the most frequent daily-use path and remains the highest performance priority. Its product requirement is perceived immediacy in normal use, evaluated through measured behavior and a real-Chrome daily-use workflow rather than a new arbitrary hard timing SLA. Image delivery continues to prioritize quality, correctness, and Decision 42 safety over absolute speed; resizing, downsampling, quality reduction, decode bypasses, and weaker guards are not optimization options.

The one-shot native process model remains approved. Its measured startup overhead is an architectural opportunity, not authority for a persistent host, service, daemon, keepalive, or protocol expansion. A native lifecycle redesign requires new evidence and separate Principal architecture approval.

M14-O generated metadata and retrieval remain completely outside the Snippet-delivery hot path. Trigger detection and delivery never wait for fingerprinting, generated-tag reads, retrieval, generation, or backfill. The final M14-P gate rechecked Text against M14-P.1 and in real Chrome; both automated and Principal manual evidence passed, closing the concern without another performance milestone. Any future perceived meaningful delay must first be localized to its actual trigger, worker, clipboard, native, cleanup, Automatic Paste, or destination-editor stage before a focused follow-up is authorized.

#### M14-O Implemented Generated-Metadata Lifecycle

M14-O uses the existing Dexie v6 `snippetGeneratedMetadata` sidecar and frozen Backup v7 shape without a migration. The sidecar's supported generation/fingerprint version is the committed version-1 canonical source serialization inside `sourceFingerprint`; the physical record remains exactly `snippetId`, normalized unique `generatedTags`, lowercase SHA-256 `sourceFingerprint`, and application-owned UTC `generatedAt`. Authored ordered tags remain only on `SnippetEntry`.

The canonical fingerprint bytes are explicitly serialized as version, exact title, deterministic rendered Text, and authored tags in their existing order, then UTF-8 encoded and SHA-256 hashed. Authoritative content is not Unicode-normalized for fingerprinting. Trigger, usage, last-used time, generated metadata/time, and unrelated timestamps are excluded. Existing authored update/delete transactions retain ownership of material invalidation and sidecar cascade; trigger-only and usage-only changes preserve metadata. A conditional repository operation verifies the proposed fingerprint against the immutable snapshot and atomically compares current authoritative material before writing.

The application exposes a focused provider-neutral `GenerateSnippetTags` port returning a raw string. M14-O has no production adapter or provider/model/network wiring. The generation service snapshots Text semantic material, enforces a 64 KiB UTF-8 input ceiling, calls only the injected port, strictly parses the complete maximum-4-KiB JSON array, normalizes/deduplicates at most eight 1–40-code-point tags, rechecks the current fingerprint, and conditionally persists. A per-Snippet latest-attempt guard plus serialized persistence section prevents stale or older concurrent results from regaining authority. Failures return typed outcomes and mutate no authored data.

Explicit backfill is an application call only. It sorts Text Snippets by `createdAt` then ID, checks metadata validity per item, selects at most 20 missing/stale/invalid records, skips Image and valid current records, invokes generation sequentially at concurrency one, honors cancellation between items, and retains typed per-item outcomes. Nothing invokes it from startup, background lifecycle, delivery, retrieval, or UI.

Retrieval retains the M6 exact-token composition and tie-breakers. It optionally loads generated metadata beside the existing repositories, fails soft to no generated signal if the sidecar cannot be read, rejects malformed/unknown-version/stale entries, and tokenizes valid generated tags into one set. Per unique query token the weights are title 5, authored tags 3, content 1, and valid generated tags 1. Duplicate generated tags/tokens cannot multiply score. Usage, recency, and `generatedAt` are absent from scoring and ordering. Knowledge, Prompt Builder v1, Image Snippets, delivery, UI, permissions, and network behavior are unchanged.

#### M14-P.6/M14-P.6.1 Final Completion Gate and Closeout

M14-P.6 is the audit-only gate over the approved Snippet architecture. Source/import inspection confirms M14-O remains absent from trigger delivery and Library Copy; the established Text benchmark remains in the M14-P.1 effectively-instantaneous class; Decision 42 Image bounds/decode/quality, Decision 45 clipboard-first optional Automatic Paste, repository-owned delete/sidecar cleanup, Manual Backup v7 plus reminder, and Dexie v6 remain intact. Production output retains the popup-free Side Panel, normal-tab Options, hidden Knowledge navigation, disabled M15 controls, approved permissions, and no automatic-backup or generated-tag runtime. The automated audit passed with no blocker, and M14-P.6.1 records the Principal-accepted 14-item real-Chrome/manual validation PASS. M14-P is **COMPLETE / PRINCIPAL-APPROVED**. M15 — AI Workspace is next, but its functional implementation remains not started.

### Approved Future AI Drafting and Snippet-Hardening Architecture

#### M14-N.3 Current Backup Architecture Pivot

Decision 55 supersedes Decisions 48 and 52 only for current product-facing backup behavior. The previously planned real-Chrome automatic-backup validation is cancelled. M14-N.1 and M14-N.2 remain accurate historical feasibility and implementation checkpoints, but their scheduler, File System Access workflow, managed retention, and Options controls are retired from production activation.

The authoritative current path is Options Import / Export → load local backup-age status → user clicks **Export backup** → existing canonical manual Backup v7 construction and download complete → record local `lastSuccessfulBackupAt` → derive whether 30 elapsed days have passed. There is no background scheduler, filesystem directory authority, automatic write/deletion, retention, permission prompt, polling, timer, notification, or alarm.

`lastSuccessfulBackupAt` is canonical UTC ISO local operational state behind a focused application/repository boundary and an injected clock. It is an optional field on the existing Dexie v6 Settings singleton record, requiring no store/index/version change, and is excluded from the portable Settings snapshot and frozen Backup v7 DTO. Settings saves and restore preserve it locally. Import cannot provide it, refresh it, or create filesystem authority. Invalid or future values fail safe to the `Never`/recommended state. Exactly 30 elapsed 24-hour days is due.

The dormant Dexie v6 `automaticBackupState` store remains solely for non-destructive profile compatibility. Current runtime and UI never read or activate it, and no migration deletes it. Historical Backup v7 `automaticBackupCadence` remains a required frozen field and is still validated/imported, but has no current execution or UI owner. Previously written managed backup files remain user-owned and are never enumerated, pruned, renamed, migrated, or deleted.

The M14-N.1, M14-N.2, and selected-folder subsections below are retained as historical architecture records. Decision 55 and this M14-N.3 subsection are authoritative for current product behavior.

Decisions 46–48 define future product architecture; they do not describe the current runtime. Today, M6 retrieval still reads both implemented repositories, M7/M9 Prompt Builder still accepts Knowledge and Snippet collections, the options page still renders Knowledge CRUD, M9/M11 still use a free-text model value, and Merchant Context is text-only. M14-M.1 changes only the data foundation: Dexie physical version 6 and Backup v7 are current without changing those behaviors.

The future active AI-reference flow uses Text Snippets as the only user-managed reference library. Knowledge UI/retrieval participation retires from that future workflow, while the underlying Knowledge domain, store, repository, backups, compatibility, and tests remain dormant and intact until a separate migration/cleanup task is approved. Image Snippets remain delivery assets and never become AI reference material. This requires an explicit future application-contract revision rather than a reinterpretation of `RetrievalResults` or Prompt Builder v1.

The future drafting request boundary accepts optional Merchant Context text and optional Guidance / Gist, with Generate enabled when either is present. Application defaults always apply. Safety/application rules remain highest; Gist controls current intent and presentation; Merchant Context owns current-case facts; retrieved Text Snippets are supporting reference/examples; defaults fill gaps. Neither Gist nor a retrieved Snippet authorizes unsupported or contradicted facts.

The compact future Side Panel keeps inputs before output, uses auto-growing bounded Context and Guidance / Gist fields, places a provider-independent Model dropdown beside Generate, preserves editable output, and places **Save as Snippet** plus **Copy** in the output header. Save as Snippet hands the current response to Text Snippet authoring as a prefilled draft; title, trigger, tags, and content remain user-editable, and persistence occurs only on explicit user Save. Generation never auto-creates a reusable record. Request-scoped removable Context Images are a separate transient M15 input domain, never an Image Snippet or Knowledge record. Provider capability/serialization remains outside React and outside this documentation task.

Snippet hardening is assigned to M14-L through M14-P under Principal-approved Decisions 50–53, with M14-L.1 reconciling feasibility order and Decision 54 preserved separately. M14-M.1 implements the coordinated persistence foundation at Dexie v6 and Backup v7 while preserving authored `SnippetEntry.tags`; M14-M.3 implements delivery-time usage behavior over that sidecar; M14-N.1 implements the provider-independent automatic-backup runtime foundation; and M14-N.2 implements the Options activation/reauthorization/status surface. Production real-Chrome revalidation and M14-N closeout remain M14-N.3; generated-tag provider work/retrieval, F1/F2, and Decision 54 navigation remain later tasks.

#### M14-L Coordinated Hardening Data Architecture

M14-M.0 is **PASS / REAL-CHROME VALIDATED**. Its native-dev-only harness proved explicit-click Options selection, scratch IndexedDB handle persistence, Options reload and browser-restart recovery, truthful granted permission querying, independent service-worker recovery and reuse without another picker, exact random owned-file create/read/verify/delete with no remaining artifact, same-folder `isSameEntry` recognition, unrelated-file isolation, and unavailable/deleted-location fail-safe behavior. Production generated-output validation prohibits all harness markers, and no `alarms`, `downloads`, or arbitrary filesystem permission was required. Different-folder distinction did not produce reliable positive evidence and remains a non-blocking M14-N production-adapter verification before managed retention may rely on it; deterministic manifest/digest ownership proof remains mandatory.

M14-M.1 implemented that one coordinated physical Dexie v6 / Backup v7 evolution. Separate `snippetUsageStats` and `snippetGeneratedMetadata` stores keep operational writes and fallible AI metadata out of authored `SnippetEntry`, catalog publication, and authored timestamps. At that foundation stage, the singleton `automaticBackupState` stored only the gate-proven structured-clone directory handle plus local backup-set identity; M14-N.1 now adds logical scheduling, attempt/success/failure, lease, and manifest fields within the same store. Settings contains portable preferred `automaticBackupCadence`, while every local handle/permission/operational/schedule/manifest value is excluded from backup serialization.

#### M14-N.1 Automatic Backup Runtime Boundary

M14-N.1 extends the existing Dexie v6 singleton logically, without a physical migration, with a bounded verified-file manifest, anchor/next-due schedule, 30-minute lease, and bounded last-attempt/success/failure status. One application-owned runtime reconciles the portable cadence with local authority on service-worker startup and the stable `ai-support-workspace-automatic-backup` alarm. The alarm is always one-shot (`when` only); activation/cadence change waits one complete 24-hour or 168-hour interval, and overdue intervals coalesce into one catch-up before advancing by whole anchor intervals to a future due time. `Off`, prompt/denied permission, and unavailable location clear active timing but preserve the handle, backup set, and manifest. No repeating timer, polling, keepalive, backlog replay, or scheduled permission request exists.

The production directory port accepts only structured-clone-compatible directory handles and exposes read/write permission query, `isSameEntry` identity, exact create/read, and exact removal. Background code calls `queryPermission` only. Same identity preserves ownership; different identity or any uncertainty creates a new random set and empty manifest while abandoning old-location ownership without deletion. Each execution binds the captured handle, set, schedule, and atomic lease, while an in-memory guard rejects same-worker overlap. Context checks prevent stale success commits or pruning after location/cadence changes.

#### M14-N.2 Automatic Backup Options Boundary

The Options composition injects a typed application facade into Settings. React can load a safe snapshot and invoke only cadence update, folder choice/change, and reauthorization commands; it never receives a directory handle or imports persistence, alarms, scheduling, file creation, retention, deletion, set IDs, leases, or manifests. The facade preserves the Settings aggregate, delegates cadence timing to `reconcileCadenceChange()`, delegates selected-handle identity and ownership to `adoptDirectory()`, and delegates granted-permission recovery to `reconcileStartup()`.

The browser foreground adapter calls exactly `showDirectoryPicker({ mode: 'readwrite' })` from Choose Folder or Change Folder and `requestPermission({ mode: 'readwrite' })` only inside an explicit folder/reauthorization command. Load, render, effects, cadence changes, service-worker startup, alarms, and automatic retries never request authority. The UI derives only `Off`, `Ready`, `Backup location needs attention`, or `No backup location selected`; cancellation, denial, and failures remain non-destructive. M14-N.3 owns real-Chrome validation of the composed production path and M14-N closeout.

#### M14-N.1 Automatic Backup Output and Retention

Manual Export and automatic output share `BackupV7CreationService`, including snapshot ownership validation, deterministic mapping, strict v7 parsing, and the 96 MiB limit. Automatic output adds `creationMode: 'automatic'` and the active `backupSetId`, derives the exact Windows-safe managed filename, and never overwrites. One execution creates exactly one canonical backup identity/name; a collision fails that cadence attempt without generating an alternate identity or scheduling an immediate retry. Success requires close/reopen, exact UTF-8 byte length, SHA-256, and strict identity readback before the local manifest changes. Only then does manifest-driven retention sort `createdAt`/`backupId` and attempt Daily latest-seven or Weekly latest-four pruning. Every candidate is reread and must re-prove directory identity, exact filename relationship, byte length, digest, Backup v7 ID/set/mode, and active lease context; uncertainty stops pruning and leaves safe overflow. No directory enumeration or loose filename ownership exists.

Strict Backup v7 extends rather than rewrites v6. It retains Knowledge compatibility, Text/Image Snippets, assets, authored tags, model and paste settings, and adds generated metadata, usage statistics, preferred cadence, plus required backup/creation ownership metadata while retaining the 96 MiB canonical byte limit. Cadence is exactly `off | daily | weekly`; v1–v6 map absent sidecars to empty and cadence to `weekly`. Restore validates every new value/reference and recomputed source fingerprint before atomically replacing only portable stores. Machine-local `automaticBackupState` remains outside that transaction and is preserved independently; a payload cannot contain, replace, or create directory authority. M14-N.1 operational writing therefore requires independently held local authority and current granted permission; portable cadence alone can never activate or restore it.

#### M14-L Usage Boundary

The content frame is the only layer that knows exact cleanup succeeded, while the service worker is the authoritative clipboard owner. Clipboard-success responses therefore include a 30-second one-use receipt bound to request, Snippet, sender, catalog, and delivery kind. Exact cleanup sends a separate acknowledgement. The automatic path does not await the statistics write before final paste authorization, and clipboard-only feedback does not await it either. A separate handler consumes the receipt, timestamps it with an injected service-worker clock, and atomically creates/increments the sidecar. Counts saturate at `Number.MAX_SAFE_INTEGER`; failed writes are swallowed at that boundary and are not replayed. Both Text and Image count; retrieval, view/edit, backup, unknown triggers, clipboard failure, and cleanup failure do not.

M14-M.3 implements this boundary without persisting receipts or adding keepalive. Each receipt binds exact `requestId`, `snippetId`, kind, sender document/frame/tab/window identity, and catalog epoch/revision; duplicate, expired, unknown, or mismatched acknowledgements cannot consume it. A recreated worker starts with no receipts and never reconstructs them. Accepted consumption captures canonical UTC acknowledgement time and launches one best-effort repository call while clipboard-only notice or automatic finalization continues. The Options Library loads the sidecar independently of authored ordering and, after M14-M.3.1, displays only the numeric count, with absence as `0` and an accessible count label; no sorting, ranking, analytics, history, catalog publication, generated-metadata invalidation, or authored timestamp update is introduced.

#### M14-L Selected-Folder Automatic Backup Boundary

The selected-folder design uses the standard [File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access), not an arbitrary path string. The Options page calls `showDirectoryPicker({ mode: 'readwrite' })` from the user's Choose-folder or Change-folder gesture and stores the structured-clone handle in extension-origin IndexedDB through the application boundary. Chrome documents that handles can be stored in IndexedDB and that permission must be checked because it is not always retained between sessions. Scheduled code retrieves the handle and proceeds only when `queryPermission({ mode: 'readwrite' })` is `granted`; prompts and pickers remain foreground user-gesture operations. Permission revocation, a missing/moved/unavailable folder, or any read/write error records safe status and defers to the next cadence without touching Snippet workflows. On a later Choose-folder action, `isSameEntry()` preserves the backup set/manifest for the same directory; a different directory receives a new set identity and the old manifest is abandoned without deleting external files.

The service worker uses one named one-shot [`chrome.alarms`](https://developer.chrome.com/docs/extensions/reference/api/alarms) alarm and the required `alarms` manifest permission. Daily is exactly 24 hours and Weekly 168 hours from a persisted anchor. Startup and worker activation reconcile the alarm from `nextDueAt`; missed intervals coalesce into one catch-up, and the next due instant advances until future. An in-memory mutex plus expiring persistent lease prevents overlap. There is no polling, keepalive, backlog replay, or rapid failure retry.

[`chrome.downloads`](https://developer.chrome.com/docs/extensions/reference/api/downloads) is not the selected-folder fallback: it requires `downloads`, limits programmatic filenames to the default Downloads directory, and uses `saveAs` for a chooser on each download rather than durable arbitrary-directory authority. M14-N adds no `downloads` or legacy Chrome App `fileSystem` permission. Manual Export remains the supported fallback whenever the selected location cannot be reused.

Manual and automatic export share one canonical snapshot/builder/validator/serializer/digest boundary. Automatic output uses lowercase random UUIDs and the Windows-safe exact name `ai-support-workspace-managed-{backupSetId}-{YYYYMMDDTHHmmssSSSZ}-{backupId}.json`; one collision fails the execution rather than overwriting or generating an alternate name. It writes and closes the managed v7 file through the authorized directory handle, reopens it, and verifies exact length, SHA-256, and v7 identity before recording success. Retention then sorts successful manifest entries by `createdAt`/`backupId` and keeps exactly the latest seven for Daily or latest four for Weekly. Candidates originate only from the local manifest and must re-prove directory identity with `isSameEntry`, exact name/IDs/timestamp/version/length/digest/success metadata, and matching automatic-v7 file content before `removeEntry(exactName)`. A loose filename match never authorizes deletion; unverifiable or unrelated files remain untouched. Proof/removal failure stops pruning and may safely leave extra recovery points until a later successful run; no existing point is removed before its replacement succeeds.

#### M14-L Generated-Tag and Retrieval Boundary

Generated Text tags are a separate sidecar keyed by Snippet ID and guarded by a versioned SHA-256 source fingerprint. A title/content/authored-tag change removes mismatching metadata in the authored transaction; best-effort regeneration begins only after Save. `GenerateSnippetTags` uses injected `GenerationProvider` plus a focused configured-model resolver, not Prompt Builder, direct Ollama calls, or provider-name business logic. Missing model/provider and every generation failure leave Save successful and metadata absent.

Provider input is limited to Text title, rendered plain content, and authored tags in a canonical payload capped at 64 KiB UTF-8; oversized input skips generation without affecting Save. Output is an exact JSON string array, at most 4 KiB raw, at most eight unique tags, each 1–40 Unicode code points after NFKC/lowercase/whitespace normalization, with control characters, line breaks, HTML delimiters, prose, objects, and trailing data rejected. Raw prompts/output and Snippet content are not logged or persisted. Historical records are handled only on qualifying edit or an explicit bounded 20-record, concurrency-one batch; never at startup, delivery, or retrieval.

Deterministic retrieval retains current Text-only eligibility and current title/authored-tag/content weights `5/3/1`; fingerprint-valid generated tags add only `1`. Total textual score remains primary, and usage/recency are excluded from M14-O ranking. Knowledge retrieval and Prompt Builder v1 remain current compatibility behavior until the separate M15 product transition.

#### M14-L Permission, Failure, and Privacy Matrix

| Capability | Future permission/API impact | User gesture | Failure owner |
| --- | --- | --- | --- |
| Usage statistics | No new Chrome permission; extension-origin Dexie only | None after trigger activation | Usage repository; never delivery |
| Generated Text tags | No new Chrome permission or destination; existing configured `GenerationProvider`/current provider host authority only | Ordinary authored Save; provider work is post-save | Metadata service; never authoring |
| M14-M.0 selected-folder gate | File System Access + scratch IndexedDB; no production schema, `alarms`, or `downloads` | Required for picker and reauthorization cases | Gate result; FAIL blocks M14-M.1 |
| Automatic backup schedule | Add manifest `alarms` in M14-N | None for an already configured due run | Scheduler/output state; never Snippet use |
| Backup directory | File System Access web API; no manifest file permission | Required for Choose folder and every reauthorization prompt | Directory adapter; manual Export remains |
| Downloads fallback | Not approved; do not add `downloads` | Not applicable | Not part of M14-N |

The failure equations are permanent: authored Snippet success is independent of tag generation; delivery success is independent of usage persistence; Snippet use is independent of automatic backup. No hardening handler enters the M14-K critical path as a prerequisite, changes clipboard/focus/input behavior, or retries a possibly completed delivery.

Usage and backup operational metadata remain local with no telemetry. Automatic backup writes only the canonical local file selected by the user and performs no cloud upload. Tag generation sends the Text Snippet title, deterministic plain-text rendering, and authored tags only to the already configured generation provider; it introduces no destination, provider-specific business logic, raw-output persistence, content logging, or generation history.

M14-L non-goals are AI Workspace/Guidance/Gist/Context Image implementation, Knowledge deletion or migration, embeddings/vector retrieval, cloud sync, backup encryption/compression, AutoHotkey, M14-K performance optimization, persistent native hosts, production native packaging, authored-tag editing redesign, analytics dashboards, and AI generation history.

#### Daily-Use Snippet UX and Completion Gate

M14-M.2 records two presentation/navigation corrections without implementing them. F1 renders text carrying the already validated safe-link mark as conventional blue underlined linked text in the Snippet rich-text editor. The mark and persisted Rich Text model remain unchanged; no arbitrary color controls, general underline mark, broader typography system, or schema evolution is authorized. F2 keeps current edit loading/data behavior but, after the selected draft is rendered, deterministically brings the editor into view and focuses its primary appropriate field through accessible component lifecycle/focus ownership. It requires no route redesign and prohibits arbitrary delay-based focus hacks.

F1 and F2 are completion-gate work, not M14-M usage behavior. Before M14-P closes, the Principal reviews the complete daily-use Snippet subsystem: Text/Image authoring, trigger activation, clipboard-only delivery, automatic paste, destination compatibility, lifecycle recovery, usage statistics, automatic backup, generated retrieval tags, import/export, real-world feedback, user-visible performance, regression evidence, and documentation consistency. Decision 57 closes broad speculative optimization before M14-O. The final gate re-measures Text against M14-P.1 and validates real-Chrome responsiveness; only a meaningful user-visible delay, localized to its actual stage, authorizes a focused follow-up before M15.

#### Persistence and Backup Evolution

M13 advances Dexie schema version 2 to version 3 by changing only `snippetEntries` to `id, createdAt, &trigger`. Triggerless physical records omit the indexed property and map to domain `null`; the migration preserves every existing Knowledge, Snippet, and Settings record without generating triggers. `DATABASE_SCHEMA.md` is authoritative for mapping, repository additions, uniqueness, migration, and errors.

Backup Format v1 remains frozen. The import boundary continues accepting valid v1 files and maps every v1 Snippet to `trigger: null`. New exports after M13 use Backup Format v2. Its envelope, identifier, timestamp, Knowledge, Settings, limits, ordering, filename, UI, and security rules remain as in v1, while each exact v2 Snippet DTO adds required `trigger: string | null`. Non-null triggers must already be canonical, valid, and unique. V2 rejects unexpected fields and unsupported future versions.

Both import versions construct current trusted models only after complete validation. Restore remains one atomic replacement transaction across Knowledge, Snippets, and Settings, with explicit DTO-to-domain-to-physical mappings and complete rollback on failure. V1 clears all restored trigger values to `null`; its preview states `This version 1 backup does not contain Snippet triggers. Restored Snippets will have no triggers.` V2 preserves triggers. Trigger data is never silently omitted from new exports.

#### Snippet Library, Security, and Scope

The existing Snippet create/edit form adds one optional Trigger input. Guidance is `Optional. Use 2–32 characters starting with ;. Letters, numbers, and single hyphens only.` Invalid input shows `Use 2–32 characters starting with ;. Use only letters, numbers, and single hyphens.` A collision shows `That trigger is already used by another Snippet.` A canonical trigger is shown in each configured Snippet list item. Existing `null` records display no trigger and remain editable. No rich editor, variable UI, suggestion menu, autocomplete, analytics, or additional top-level navigation is added.

Insertion is plain text only: no `innerHTML`, script, markup execution, external-resource loading, clipboard read/write, password input handling, secret capture, editor-content logging, provider transmission, or expansion outside the actively focused supported editor. M13 does not change Ollama, `GenerationProvider`, `OutputWorkflow`, Retrieval Engine, Prompt Builder, Side Panel generation, M10 capture, or Settings behavior. Rich Snippets move to M14, Multimodal Screenshot Context to M15, and OpenAI/provider selection to M16.

### Rich Snippet Templates

Milestone 14 extends the existing M13 Snippet aggregate, repository, trigger catalog, and editor-adapter foundation. A Rich Snippet is still a `SnippetEntry`: its ID, title, tags, optional canonical trigger, timestamps, repository identity, CRUD lifecycle, and trigger uniqueness retain their current meanings. The product has one Snippet Library and one trigger system; it does not add `TemplateEntry`, a parallel Template Library, or duplicated plain/rich records.

The Decision 36 subsections below describe the implemented architecture through M14-C: structured paragraph/link content, legacy URL Image References, Dexie v4, Backup v3, structured form authoring, and deterministic plain browser expansion. Decision 37 records the M14-D/M14-E local-asset foundation. Decision 39 now supersedes Decision 37's unimplemented inline Rich-image authoring/rendering direction: new Rich authoring is text-only, while an Image Snippet is a distinct one-image `SnippetContent` variant inside the same aggregate and trigger system.

#### Canonical Content and Validation

The approved domain representation has one source of truth:

```ts
type SnippetContent = PlainSnippetContent | RichSnippetContent;

interface PlainSnippetContent {
  kind: 'plain';
  text: string;
}

interface RichSnippetContent {
  kind: 'rich';
  blocks: RichSnippetBlock[];
}
```

The implemented M14-C Rich content is a small, project-owned, ordered document model, never HTML. A paragraph block contains ordered inline nodes. Its currently implemented image representation is the legacy reference block with exactly `type: 'reference'`, `referenceType: 'image'`, a user-readable `label`, and a user-supplied `url`. Paragraph inline nodes are either text or link nodes; both carry explicit `bold` and `italic` booleans, while a link additionally carries its URL. The model is non-recursive and supports no arbitrary nesting, HTML, DOM node, CSS, font, color, table, script, event handler, iframe, video, or embed.

Ordinary link URLs initially allow only `https:`, `http:`, and `mailto:`. Image-reference URLs allow only `https:` and `http:`. Values using `javascript:`, `data:`, `blob:`, `file:`, `chrome:`, `chrome-extension:`, or another unapproved scheme are rejected before persistence and again at untrusted backup import. Imported HTML is never interpreted or converted.

The implemented M14-E foundation supports Decision 37 local-image blocks backed by validated Snippet-owned Blobs in `snippetAssets`, Dexie v5, and Backup v4. Those blocks are now legacy compatibility data: no new Rich local-image authoring will be added. The same asset foundation will support a distinct Image Snippet with exactly one owned asset. Clipboard delivery, hosting, and cloud upload remain absent, and supplied legacy URLs are never fetched. M15 screenshot Context remains a distinct transient generation-input domain and cannot reuse Image Snippet ownership.

#### Deterministic Plain Projection and AI Compatibility

One project-owned domain/application operation, conceptually `renderSnippetPlainText(content: SnippetContent): string`, is the canonical readable representation wherever structured text cannot be consumed. Plain content returns its stored `text` exactly. Rich content preserves block order and joins every adjacent block with exactly `\n\n`. Paragraphs concatenate their inline nodes in order; bold and italic markers are omitted while readable text remains. A link renders as `label (url)` when label and URL differ, otherwise as the URL. An image reference renders exactly `[Image: label] url`. Future unordered list items project as `- Item`; ordered items project as `1. Item`, with one `\n` between items. An Image Snippet has no truthful text representation and projects to the empty string; Retrieval and Prompt Builder exclude it rather than emitting a placeholder. No supported Rich text block may silently disappear.

Retrieval Engine scoring and Prompt Builder composition remain text-only. Their Snippet input comes from the deterministic projection, so indexing, ranking, provider-facing Prompt sections, and AI serialization never receive rich DOM structures or markup merely because M14 exists:

```text
SnippetContent
→ deterministic plain projection
→ Retrieval Engine
→ Prompt Builder
```

M14 changes no provider contract, endpoint, provider serialization, model behavior, or AI permission.

#### Expansion and Rendering

Decision 36 proposed destination-aware expansion through the M13 adapter boundary:

```text
Persisted Snippet
→ Catalog Projection
→ Service Worker Catalog
→ Typed Frame Port
→ Frame Cache
→ Expansion Controller
→ Editor Capability Adapter
  ├── Rich Renderer
  └── Plain Renderer
```

The current M14-C runtime has not implemented that Rich renderer: its trigger catalog and browser expansion still use deterministic plain projection. Under the Decision 36 safety boundary, a future safely supported generic `contenteditable` could render only extension-created text nodes, paragraph separation using `<p>` or an equivalent safe structure, `<strong>`, `<em>`, and validated `<a>` nodes created from the target's own `ownerDocument`; it could not use `innerHTML`, `insertAdjacentHTML`, `DOMParser`, or `document.write`. Decision 37 below now makes the Delivery Planner and evidence-backed target capabilities authoritative for future delivery. Destination names do not enter the domain.

`textarea` always receives the plain projection. M13's absent/text/search single-line input boundary remains: if the final projection contains `\r` or `\n`, the adapter declines before preventing Space, leaves the host value unchanged, and preserves normal typing. Content is never truncated, flattened, normalized, or partially inserted to fit.

M13 trigger-recognition and publication guarantees remain frozen: canonical semicolon lookup; trusted cancelable Space `beforeinput`; inactive composition; collapsed caret; trigger immediately before the caret with start/whitespace left boundary; fail-safe normal typing; ordered invalidation; and the publication barrier. M14-K.2.3.4 supersedes the earlier M14-I activation-edit assumption for deliverable entries: a fully accepted activation Space is synchronously consumed, and confirmed success permits compare-and-swap removal of only the unchanged trigger. Colon activation is not M14 scope.

#### Transient Catalog Continuity

Dexie remains the sole persistent source. The service worker derives the implemented metadata-only typed catalog, and content scripts never access Dexie. Each exact validated entry contains only delivery kind, canonical trigger, Snippet ID, and a privacy-safe single-line-eligibility boolean. It contains no deterministic plain projection, Rich structure, generated HTML, Blob, base64, asset ID, filename, MIME type, image bytes, surrounding editor text, host data, history, provider state, logs, or unrelated Library records. Authoritative content and assets are loaded only after activation.

M13-B.1 remains authoritative: one long-lived typed port per frame; atomic complete snapshots; worker epochs; monotonic revisions; invalidation before Snippet CRUD/import/restore persistence; one global publication barrier; complete rebuild after success or unchanged rebuild after failure; and fail-closed stale, disconnected, invalid, or publication-failed state. No browser-storage catalog, durable queue, polling, or per-keystroke worker lookup is approved.

Decision 38 adds a compatibility publication guard for every legacy Rich Snippet containing a Decision 37 local-image block. Such a Snippet is omitted from the transient trigger catalog, so its trigger is unknown to the frame cache and M13 leaves normal typing untouched. The guard does not insert local-image projection text, partially insert other Rich blocks, expose an asset ID, or publish Blob/base64 data.

Plain Snippets, Rich Snippets containing only portable text blocks or legacy URL Image References, and deliverable Image Snippets publish metadata-only typed descriptors. The excluded legacy Rich local-image record remains available to the Library, persistence, Backup v4, Retrieval Engine, and Prompt Builder. M14-E implemented this narrow filter without changing the M13-B.1 publication barrier. M14-I now supersedes Decision 39's transitional Image-Snippet omission by publishing typed Image descriptors; Decision 38 remains unchanged.

#### Persistence and Backup Evolution

M14-B implements Dexie version 4 while preserving version 1, 2, and 3 declarations unchanged. Version 4 retains `knowledgeEntries: 'id, createdAt'`, `settings: 'id'`, and `snippetEntries: 'id, createdAt, &trigger'`; it adds no table or index. Its migration maps each v3 `content: string` exactly to `{ kind: 'plain', text: formerContent }` while preserving ID, title, tags and order, trigger, `createdAt`, and `updatedAt`. Triggerless physical records continue omitting the unique indexed property, and unexpected migration input fails.

Backup Formats v1 and v2 remain frozen and importable. M14-B implements dedicated exact Backup Format v3 DTOs independent from live domain and Dexie records, with explicit field-by-field mappings. V1 content strings map to current plain content and `trigger: null`; v2 strings map to plain content and preserve their trigger. New v3 exports contain the existing Knowledge and Settings contracts plus Snippets with metadata, trigger, and exact discriminated content.

V3 validation rejects the complete backup for an inexact envelope, missing or extra keys, dangerous keys, invalid identity/timestamps, duplicate IDs or triggers, invalid discriminants, unknown blocks/inlines/marks/references, invalid field types, or unapproved URLs. It performs no repair and interprets no HTML. The 25 MiB guard, deterministic order, metadata-only preview and acknowledgement, replace-only restore, one-transaction atomicity, and rollback guarantees remain unchanged.

#### Snippet Library and Scope

The existing Snippet Library remains the single surface and exposes two user-facing types: Text and Image. Every new Text Snippet is Rich and uses the constrained Tiptap v3 WYSIWYG surface. Historical Plain records display as Text and convert only after successful Save; untouched rows are not migrated. Plain/Rich and explicit conversion are no longer normal user-facing choices.

Tiptap is UI infrastructure only. A focused adapter converts constrained Tiptap JSON to and from project-owned `SnippetContent`; HTML, ProseMirror runtime objects, DOM nodes, and editor instances are never persisted. The configured schema supports paragraphs, hard line breaks, bold, italic, validated links, unordered lists, ordered lists, and undo/redo, while excluding headings, quotes, code, strike, underline, horizontal rules, nested lists, images, tables, and arbitrary HTML. Legacy URL references and Rich local-image blocks remain read-only compatibility data if they cannot safely round-trip.

The layer ownership remains:

```text
Snippet Library UI
→ Snippet Application Service
→ Snippet Domain
→ Snippet Repository
→ Dexie Adapter
```

Backup version ownership remains explicit:

```text
Domain
→ explicit field mapping
→ Backup v3 DTO
→ strict JSON

Backup v1 / v2
→ version-specific parser
→ current PlainSnippetContent

Backup v3
→ strict parser
→ current PlainSnippetContent or RichSnippetContent
```

The implementation through M14-C remains local-first. It captures or logs no surrounding conversation/editor content, trigger usage, history, page data, or provider state; sends no Snippet payload to an AI provider, analytics, or telemetry; currently performs no clipboard read or write; performs no page scraping; and adds no persistent content-script storage. The Rich Snippet payload is extension-owned user data and content-script inspection remains limited to M13's bounded trigger candidate and exact replacement range. Decision 37 historically assigned optional clipboard-assisted delivery to the then-planned M14-G without implying that transport existed. Decision 39 supersedes that ownership: current clipboard image proof belongs to M14-I.

The implemented M14-C baseline introduces no variables, placeholders, merge fields, customer interpolation, conditions, loops, scripting, AI-generated fields, arbitrary HTML/CSS, local binary images, clipboard ingestion, file upload, cloud hosting, automatic remote loading, screenshot generation Context, page scraping, usage analytics, trigger autocomplete, alternate trigger syntax, folder redesign, collaboration, sync, provider change, or new Chrome permission. Its manifest still contains no clipboard/offscreen permission. Decision 37 supersedes this baseline only for approved future locally owned images and globally opt-in clipboard assistance with optional `clipboardWrite`/`offscreen`; neither capability is implemented. Normal website scope remains exactly `http://*/*` and `https://*/*`; protected pages and other schemes remain unsupported. Existing `sidePanel`, `activeTab`, `scripting`, and localhost Ollama access remain unchanged, and no `<all_urls>`, `file://`, `tabs`, downloads, `webRequest`, cookies, identity, or new host permission is approved.

#### Decision 37 Local Image Revision (Historical Foundation)

M14-D originally revised the final Rich authoring target without invalidating M14-C. M14-E then implemented its asset, persistence, and Backup v4 foundation. Decision 39 cancels the unimplemented continuous inline-image Rich editor: the local image structure described below remains historical compatibility data, while reusable image authoring moves to Image Snippets. Existing URL image references stay readable and removable as legacy blocks and are never fetched or automatically converted.

```text
SnippetEntry
→ RichSnippetContent
→ local image block { type, assetId, altText }
→ SnippetAsset { id, snippetId, mimeType, blob, byteSize,
                 originalFilename, createdAt }
```

The content model owns placement and optional human alt text; the asset store owns bytes. Each asset has one Snippet owner, cannot be shared across Snippets, and initially represents one insertion. Draft bytes stay in editor/application memory until Save. Runtime object URLs are preview handles only and are revoked on removal, replacement, cancel, or unmount. Save coordinates content plus asset creation/deletion in one transaction; Cancel cannot orphan or delete persisted data. Local images accept only PNG, JPEG, and WebP after MIME, signature, and byte validation. Limits are 5 MiB per asset, 20 MiB per Snippet, and 40 MiB per local profile/project.

Dexie v5 adds only `snippetAssets: 'id, snippetId, createdAt'`; v1-v4 declarations remain unchanged and v4-to-v5 does not rewrite Snippets or fetch legacy URLs. The application/repository boundary enforces ownership and referential integrity because IndexedDB provides no foreign keys. Snippet deletion and content/asset Save run atomically across `snippetEntries` and `snippetAssets`.

Backup v1-v3 remain frozen and importable. Backup v4 remains one strict JSON file, adds exact `snippetAssets`, and serializes each Blob as canonical RFC 4648 base64 with declared byte size, MIME, ownership, optional filename, and creation metadata. V4 validates exact keys, a 96 MiB serialized guard, base64 canonicality, decoded size, format signature, duplicate identity, ownership, missing/foreign/unreferenced assets, and aggregate limits before one atomic restore. Its deterministic asset ordering is `createdAt` then `id`. The roughly one-third base64 expansion and transient in-memory duplication are accepted for a simple provider-independent local-first first version; archives and compression remain deferred.

#### Delivery Planning Revision

Delivery planning becomes a project-owned application boundary above target adapters:

```text
SnippetContent + local assets
→ Delivery Planner
→ behavioral target capabilities
→ direct plain | direct rich | clipboard-assisted | unsupported
→ explicit delivery outcome
```

Capabilities describe behavior—plain text, rich clipboard HTML, clipboard images, and unsupported representations—not provider names. M14-I implements native-paste clipboard preparation as the destination-independent base path. M14-J validates real host behavior and may add only evidence-backed compatibility corrections behind capability resolution. An image-containing Snippet is never reported as delivered when the selected strategy omitted the image; degradation requires an explicit user/product choice.

Clipboard delivery means an extension-owned clipboard write followed by either the user's native `Ctrl+V` or Decision 45's optional focus-guarded Windows automatic paste. The serializer provides deterministic `text/plain` and safe project-owned `text/html` made only from validated paragraphs, line breaks, text, `strong`, `em`, anchors, `ul`, `ol`, and `li`. Serializer and transport remain separate. The distinct one-image Image Snippet prepares portable `image/png`; mixed Rich text/local-image delivery remains unsupported rather than dropping data or exposing asset IDs. Manual `Ctrl+V` remains permanently supported and is the fallback for every automatic-paste non-success.

Clipboard delivery is globally opt-in. The implemented Settings action explains and requests optional `clipboardWrite` and optional `offscreen`; trigger input never requests permission silently. Chrome's current extension documentation states that `clipboardWrite` carries a user warning, MV3 service workers lack DOM/window, and an offscreen document with reason `CLIPBOARD` provides the hidden document context. The service worker coordinates a short-lived packaged offscreen document through runtime messaging after permission grant. No `clipboardRead` is used. Denial, revocation, serialization, offscreen, or write failure preserves input and produces no success claim.

Because planning and clipboard writing are asynchronous while `beforeinput` is synchronous, an accepted activation must consume Space before returning control to the browser and before asynchronous delivery begins. The service worker checks the activation catalog identity before authoritative planning and again immediately after planning before clipboard mutation. Confirmed write then permits exact content-script compare-and-swap cleanup only if the same editor, unchanged trigger-only state, selection contract, catalog epoch/revision, and request remain unchanged. Otherwise content remains untouched; a post-copy stale state reports copied without cleanup, while a pre-write stale state never modifies the clipboard. Real Chrome retest of this corrected activation boundary remains pending.

M14-I.2 / Decision 43 defines the optional Windows Native Clipboard Companion architecture. M14-I.3 implements the standalone native side under `native/windows-clipboard-companion/`; M14-I.4 implements the extension-side `WindowsNativeImageClipboardTransport` behind `ImageClipboardTransport.writePng`. The adapter issues one service-worker `runtime.sendNativeMessage()` request to the self-contained C#/.NET 10 LTS host. Protocol v1 accepts only strict `get-capabilities` and `write-image-png` messages, a cryptographically random 32-lowercase-hex request ID, and a canonical base64 Decision 42-safe PNG within a 7,000,000-byte request envelope. The host repeats PNG-relevant Decision 42 guards, decodes only PNG with WIC, and eagerly writes registered `PNG` first plus bottom-up alpha-preserving `CF_DIBV5` second through a companion-owned hidden HWND. Success requires the complete Open/Empty/Set/Set/Close sequence.

Access is restricted by one exact non-wildcard `allowed_origins` entry plus compile-time host-side caller-origin verification. Production and stable-key development identities use separate host names/manifests/artifacts and per-user HKCU registrations. A future signed self-contained installer owns absolute paths, staged upgrade/rollback, repair, and uninstall; no network or temporary image file is used for clipboard writes. `nativeMessaging` is an optional Settings-granted permission. Text clipboard preparation remains browser-only and independent; only future Decision 45 automatic mode may invoke the helper after Text clipboard success. The exact protocol, error taxonomy, logging policy, concurrency/lost-response behavior, threat model, and cleanup plan are in `NATIVE_CLIPBOARD_COMPANION_ARCHITECTURE.md`.

M14-I.4 adds a stable public-key-derived development extension identity only in the `native-dev` build, optional `nativeMessaging`, independent Settings status/permission UX, Windows platform detection, strict TypeScript protocol/golden-fixture conformance, service-worker-only one-shot transport, and reversible `.dev` HKCU registration. The ordinary build has no dev key or dev host literal. The generated host manifest trusts exactly the stable dev origin, and the development executable independently embeds that same origin. Real Chrome validates Settings `Ready`, Image trigger activation, native preparation, cleanup, copied notice, and a visible genuine image through native `Ctrl+V`. No production identity, production registration, installer, or signing exists. Decision 45 now approves the separate optional input architecture for future M14-K.2 implementation; M14-K.1 adds no AutoHotkey, `SendInput`, protocol, Settings, or runtime change, and manual `Ctrl+V` remains supported.

M14-I.4.1 records direct real-Chrome service-worker `get-capabilities` success as authoritative proof that host discovery, launch, caller-origin enforcement, framing, and protocol response delivery work. The prior application path diverged at its async Chrome API boundary: it used the Promise overload for the native call while the proven call used Chrome's callback result, and its Settings `runtime.onMessage` listener returned a Promise rather than using the stable callback response-lifetime contract. It also collapsed strict invalid-response failures into `host-unavailable`. The correction wraps callback-delivered `sendNativeMessage` once inside the shared Windows transport, uses `sendResponse` plus literal `true` for Settings, and preserves separate ready, unavailable, incompatible, and invalid-response states. Protocol schemas and validation remain strict; no native source, registration, identity, trigger cleanup, Text transport, Decision 42, or Decision 43 change occurs.

M14-I.5 removes the failed M14-I.1.4 Image `File("snippet.png")` copy-event branch, the older offscreen Async Image capability, their Image-only message/error variants and tests, and all A1/A2/B feasibility runtime/probe UI. The offscreen runtime is now Text-only and retains exact `text/plain` plus safe `text/html` copy-event delivery. Normal Windows Image delivery has exactly one route: Decision 42 PNG preparation followed by `WindowsNativeImageClipboardTransport`. Native failure has no browser fallback and cannot authorize trigger cleanup or a copied notice. Historical browser evidence remains documented.

M14-I.3.1 clarifies the one-shot framing implementation without changing Decision 43: one `sendNativeMessage()` process consumes exactly the 4-byte prefix and declared body, validates and processes that request immediately, writes at most one response, and exits. It never waits for stdin EOF or reads/peeks beyond the declared body. Premature EOF inside the declared frame, oversized lengths before allocation, strict UTF-8, and strict protocol-v1 validation remain fail-closed. Process-lifetime stdin after the one declared request is ignored because the process exits after responding.

M14-I.3.1 also makes the existing partial clipboard-failure policy explicit. If registered PNG transfers and the required CF_DIBV5 Set fails, the overall operation remains failure, no transaction retry occurs, one best-effort clear is attempted while the clipboard remains open, and CloseClipboard is still attempted. Cleanup failure preserves the original write failure; a later close failure retains Decision 43's `clipboard-close-failed` precedence. The host never directly frees transferred HGLOBALs and releases only handles that remain application-owned.

The current Crisp evidence is a capability input, not domain logic: ordinary direct Plain insertion fails in the tested Crisp editor, the same Snippet succeeds elsewhere, upstream content/catalog boundaries were separately verified, the failed speculative contenteditable patch was removed, and manual native paste works. No Crisp-specific adapter is approved without concrete implementation evidence.

M14-D was documentation-only; M14-E subsequently implemented the asset/Dexie v5/Backup v4 foundation. Decision 39 supersedes its remaining sequence. Durable Snippet assets remain separate from M15 transient generation Context and never enter provider requests, telemetry, logs, cloud synchronization, or project-hosted uploads.

#### Decision 39 Product Boundary Correction

M14-F Unified Rich Editor Inline Image Authoring is cancelled before implementation. The authoritative product split is:

```text
Plain/Rich Snippet
-> reusable portable text: paragraphs, bold, italic, links, bullets, numbers

Image Snippet
-> exactly one locally owned image + ordinary Snippet trigger

Context Image
-> future transient M15 generation input
```

The target domain extends the existing union with `{ kind: 'image', assetId }`. Rich content gains a non-recursive `{ type: 'list', listType: 'unordered' | 'ordered', items }` block whose items contain the existing ordered inline nodes. No nested list, HTML, table, task list, image/text combination, gallery, or shared asset is approved. Image content owns exactly one same-Snippet `SnippetAsset`; bytes never enter content.

Dexie remains version 5 because the JSON content shape is not indexed and no store/index changes. Backup v4 remains frozen/importable. M14-G implements exact list and Image Snippet discriminants plus Backup v5 together; M14-G.2 adds Image Snippet authoring over the existing M14-E repository boundary. M14-H is absorbed. This prevents unnecessary consecutive public backup versions.

Existing Rich local-image blocks remain parseable, preservable, Backup-v4-importable, and fail-closed under Decision 38. There is no automatic conversion. A future explicit conversion is eligible only for one Rich block containing one valid same-owner local image and no other content or owned asset; mixed records remain legacy Rich data.

The implemented catalog is typed and metadata-only. Text and Image entries each carry only delivery kind, canonical trigger, and Snippet ID. Plain/Rich content, generated HTML, Blob, base64, asset ID, filename, MIME type, and image bytes never enter frame snapshots. After activation, the service worker authoritatively reloads Text content or the one owned Image asset from Dexie and builds the request-scoped clipboard plan.

Image delivery means preparing `image/png` on the system clipboard, then either asking the user to press real `Ctrl+V` or, in Decision 45 automatic mode, requesting one focus-guarded Windows paste. Stored JPEG/WebP input is decoded and converted to PNG because PNG is the portable mandatory/common clipboard image representation; destination placement remains destination-owned. No synthetic DOM paste event or upload reverse engineering is allowed. Copy failure or permission denial preserves the trigger. After success, compare-and-swap cleanup removes exactly the unchanged trigger after the accepted activation Space was synchronously consumed, leaves no placeholder/trailing space, and collapses the caret at the removed range start.

Clipboard capability is opt-in. Current Chrome documentation identifies `clipboardWrite` as warning-bearing, supports runtime optional permissions for permissions outside its exception list, and requires `offscreen` plus a `CLIPBOARD` reason for a packaged MV3 offscreen document. M14-I retains optional `clipboardWrite`/`offscreen` for Text, optional `nativeMessaging` for Windows Image, explicit Settings grants, Decision 42 PNG preparation, and separate transport boundaries. Text and Windows native Image destination paste are real-Chrome validated. The failed offscreen Async Image, File copy-event, focused-content A1, and focused-extension B control are historical only and absent from active runtime. `clipboardRead` is prohibited.

The revised sequence is M14-G/G.2 structured content, Backup v5, unified authoring, and Image authoring; M14-I unified clipboard delivery/trigger planning; M14-I.1.5.2 feasibility conclusion; M14-I.2 / Decision 43 Windows Native Clipboard Companion Architecture; M14-I.3 native foundation; M14-I.4 Chrome integration/development registration; real-Chrome Image validation; M14-I.5 browser Image/probe cleanup; final M14-I review and checkpoint; then M14-J destination compatibility validation. M14-H is absorbed into M14-G.2. Rich delivery covers paragraphs, marks, links, and lists only.

Rich delivery keeps deterministic `text/plain` as the universal representation. Safe `text/html` serialization may emit only validated text, `<p>`, `<strong>`, `<em>`, `<a>`, `<ul>`, `<ol>`, and `<li>` structures with no stored HTML, custom CSS, script, event attributes, parser-produced markup, or image nodes. Direct Rich insertion is used only where browser evidence proves it; clipboard-assisted text/HTML plus user native paste is the fallback where appropriate. Legacy Rich local images are not serialized or silently degraded.

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

Decision 43's top-level `native/windows-clipboard-companion/` boundary now contains the M14-I.3 separately publishable C#/.NET 10 LTS adapter, its tests, documentation, and language-neutral fixtures. It depends only on the frozen Native Clipboard protocol contract, the BCL, and native Windows APIs, never on live extension-domain types. Test-only xUnit packages do not enter the production runtime.

## Current Status

The platform architecture remains approved: WXT, Manifest V3, TypeScript, React, Tailwind CSS, pnpm, Dexie, Tiptap v3 as constrained UI infrastructure, React Context and Hooks, Vitest, Playwright, ESLint, Prettier, Husky, and lint-staged. M14-N.3 makes Manual Backup v7 Export plus local `lastSuccessfulBackupAt` and a 30-day advisory reminder the current backup architecture. Dexie remains v6, Backup remains v7, historical automatic state remains dormant, and production needs no filesystem authority or `alarms` permission. M14-O is approved and synchronized at `6e893886ea23870c374e7e96dcc09a1c92184afc`. M14-P.6 automated evidence and M14-P.6.1 Principal real-Chrome/manual validation both pass with no blocker, so M14-P is **COMPLETE / PRINCIPAL-APPROVED**. Text performance and Image quality/safety are accepted. M15 — AI Workspace is next, but its functional implementation remains not started. The canonical `;trigger + Space`, delivery, persistence versions, popup-free Side Panel/normal-tab Options ownership, and M15 AI-function ownership remain unchanged.
