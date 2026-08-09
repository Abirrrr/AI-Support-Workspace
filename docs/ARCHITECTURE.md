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
- Snippet trigger expansion: expands locally stored plain or structured Snippets through focused capability-aware page-editor adapters without coupling domain logic to merchant-platform DOM; deterministic plain projection is the universal fallback.

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

Milestone 9 defines the first complete manual Context-to-generated-output workflow in one extension-owned global Chrome Side Panel. The Side Panel is a persistent companion surface beside the active support website rather than a standalone Workspace tab. The popup remains a launcher for Workspace and Libraries, while the options page retains Knowledge and Snippet CRUD. M9 adds no router, injected UI, content-script change, active-page capture, or reply insertion.

One focused application-layer `OutputWorkflow` coordinates the existing headless boundaries. It depends on `RetrievalEngine`, `PromptBuilder`, and `GenerationProvider`; constructs the deterministic retrieval query; invokes retrieval once; passes original Context, original Guidance, and prepared results to Prompt Builder; constructs `GenerationRequest`; invokes the provider once; and returns `GenerationResult`. React owns presentation only. The WXT Side Panel entry point is the composition root and wires the existing repositories, Retrieval Engine, Prompt Builder, and `OllamaProvider` without a dependency-injection framework, provider registry, factory, or application-level Ollama branching.

Each Generate action automatically retrieves over both Libraries using non-whitespace Merchant Context followed by non-whitespace Guidance, preserving each included value and joining both with exactly `\n\n`. Empty results are valid, manual Library selection is absent, and M6 scoring plus M7 Prompt Builder selection and precedence remain unchanged. `PromptAssembly` remains internal.

Workspace owns transient manual multiline Context and Guidance, a transient model field, a guarded Generate action, four-state idle/generating/success/error presentation, editable plain-text output, and Copy of the current edited value. M9 introduced the field as blank-initial; completed M11 now initializes each new session from the optional saved default while keeping later edits transient. Repeated Generate performs the full workflow again and replaces output only on success. There is no Regenerate, Cancel, Clear, Save, history, persisted draft, model discovery, provider selector, or health-check workflow.

Generation runs directly in the foreground Side Panel page. M9 introduces no background generation or Chrome runtime messaging. The implementation uses WXT's native Side Panel entry point, whose generated manifest must declare `side_panel.default_path`, and adds exactly the `sidePanel` Chrome API permission plus `http://localhost/*` Ollama host permission. `tabs`, `activeTab`, storage, clipboard, scripting, `127.0.0.1`, broad host access, endpoint configuration, and cloud access remain excluded. The popup opens the global Side Panel for the current browser window from the direct Open Workspace user gesture without background messaging. Real browser use additionally requires external Ollama `OLLAMA_ORIGINS` configuration for the environment-specific installed extension origin, which the extension neither hardcodes nor changes.

Workspace task state remains memory-only while the Side Panel instance is mounted and may be lost when Chrome closes, destroys, or reloads that page. The optional M11 saved model is separate Settings state used only to initialize a new session. The layout is fluid and narrow-width-safe, uses available Side Panel width without horizontal scrolling, permits vertical scrolling, and never attempts to force panel width. M9 itself left schema version 1 unchanged; M11 later advanced it to version 2 only for Settings. M9 adds no telemetry, analytics, cloud fallback, prompt or output logging, dependency, or design-system framework. `DECISIONS.md` is authoritative for the exact M9 orchestration, input, state, UI, error, permission, privacy, non-goal, automated-test, and manual Chrome validation contracts.

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

Milestone 12 defines manual local backup and replace-only restoration of the currently persisted Knowledge, Snippet, and Settings domains. It supports recovery after reinstall or local browser-data loss and physical transfer of a backup file to another Chrome profile or computer. It provides no cloud synchronization, collaboration, sharing workflow, bulk editing, automatic backup, or scheduled backup.

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

Dexie remains the only persistent source of truth. The service worker may hold one derived in-memory map from canonical trigger to only the Snippet ID and plain-text content. Each matched content-script frame maintains one long-lived typed `chrome.runtime.Port` connection and may enable its frame-local cache only while that port is connected and the frame holds one completely validated atomic snapshot identified by the current worker-session epoch and catalog revision. Invalidation and complete-snapshot messages travel in order through that port. Neither layer writes the catalog to `chrome.storage`, `localStorage`, IndexedDB, or another durable store, and the content script never imports Dexie or a repository implementation.

Port disconnection immediately clears and disables the frame cache, so a disconnected frame cannot expand from its former snapshot and normal editor input continues unchanged. Reconnection requests a complete snapshot and does not re-enable expansion until that snapshot is completely validated and atomically installed. A service-worker restart creates a new epoch and rebuilds from the repository; frames reject older-epoch snapshots. Unknown messages, invalid or stale snapshots, revision regression, extension reload, disconnection, or messaging failure clears or leaves the local cache disabled.

Before Snippet create, edit, delete, import, or restore persistence, the coordinator sends invalidation through the ordered runtime port to every currently connected frame, and each connected frame clears its cache immediately. After successful persistence, the coordinator rebuilds from Dexie and publishes one complete new snapshot. If persistence fails, it republishes the unchanged snapshot. Publication failure leaves each affected frame disabled until reconnect or a successful refresh; the persisted operation is reported accurately and the options page provides safe temporary-unavailability feedback. No stale cache is knowingly used, and no durable queue, browser-storage catalog, polling loop, or per-keystroke service-worker lookup is introduced.

The service worker owns only transient catalog distribution and the existing M10 browser coordination. It does not own Snippet CRUD, React state, provider execution, Prompt Builder, Retrieval Engine, or a durable queue. Trigger expansion sends no editor content, Snippet content, or trigger usage to Ollama, OpenAI, analytics, or telemetry.

#### Persistence and Backup Evolution

M13 advances Dexie schema version 2 to version 3 by changing only `snippetEntries` to `id, createdAt, &trigger`. Triggerless physical records omit the indexed property and map to domain `null`; the migration preserves every existing Knowledge, Snippet, and Settings record without generating triggers. `DATABASE_SCHEMA.md` is authoritative for mapping, repository additions, uniqueness, migration, and errors.

Backup Format v1 remains frozen. The import boundary continues accepting valid v1 files and maps every v1 Snippet to `trigger: null`. New exports after M13 use Backup Format v2. Its envelope, identifier, timestamp, Knowledge, Settings, limits, ordering, filename, UI, and security rules remain as in v1, while each exact v2 Snippet DTO adds required `trigger: string | null`. Non-null triggers must already be canonical, valid, and unique. V2 rejects unexpected fields and unsupported future versions.

Both import versions construct current trusted models only after complete validation. Restore remains one atomic replacement transaction across Knowledge, Snippets, and Settings, with explicit DTO-to-domain-to-physical mappings and complete rollback on failure. V1 clears all restored trigger values to `null`; its preview states `This version 1 backup does not contain Snippet triggers. Restored Snippets will have no triggers.` V2 preserves triggers. Trigger data is never silently omitted from new exports.

#### Snippet Library, Security, and Scope

The existing Snippet create/edit form adds one optional Trigger input. Guidance is `Optional. Use 2–32 characters starting with ;. Letters, numbers, and single hyphens only.` Invalid input shows `Use 2–32 characters starting with ;. Use only letters, numbers, and single hyphens.` A collision shows `That trigger is already used by another Snippet.` A canonical trigger is shown in each configured Snippet list item. Existing `null` records display no trigger and remain editable. No rich editor, variable UI, suggestion menu, autocomplete, analytics, or additional top-level navigation is added.

Insertion is plain text only: no `innerHTML`, script, markup execution, external-resource loading, clipboard read/write, password input handling, secret capture, editor-content logging, provider transmission, or expansion outside the actively focused supported editor. M13 does not change Ollama, `GenerationProvider`, `OutputWorkflow`, Retrieval Engine, Prompt Builder, Side Panel generation, M10 capture, or Settings behavior. Rich Snippets move to M14, Multimodal Screenshot Context to M15, and OpenAI/provider selection to M16.

### Rich Snippet Templates

Milestone 14 extends the existing M13 Snippet aggregate, repository, trigger catalog, and editor-adapter foundation. A Rich Snippet is still a `SnippetEntry`: its ID, title, tags, optional canonical trigger, timestamps, repository identity, CRUD lifecycle, and trigger uniqueness retain their current meanings. The product has one Snippet Library and one trigger system; it does not add `TemplateEntry`, a parallel Template Library, or duplicated plain/rich records.

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

Rich content is a small, project-owned, ordered document model, never HTML. A paragraph block contains ordered inline nodes. A reference block initially has exactly `type: 'reference'`, `referenceType: 'image'`, a user-readable `label`, and a user-supplied `url`. Paragraph inline nodes are either text or link nodes; both carry explicit `bold` and `italic` booleans, while a link additionally carries its URL. The model is non-recursive and supports no arbitrary nesting, HTML, DOM node, CSS, font, color, table, script, event handler, iframe, video, or embed.

Ordinary link URLs initially allow only `https:`, `http:`, and `mailto:`. Image-reference URLs allow only `https:` and `http:`. Values using `javascript:`, `data:`, `blob:`, `file:`, `chrome:`, `chrome-extension:`, or another unapproved scheme are rejected before persistence and again at untrusted backup import. Imported HTML is never interpreted or converted.

M14 v1 resolves reusable images as references, not binary assets. It persists no Blob, base64 data, local file, clipboard image, fetched response, or upload-provider identity; adds no `snippetAssets` table, extension-managed file store, hosting service, or cloud uploader; and never automatically fetches a supplied URL. Local reusable asset storage requires a separate decision covering ownership, limits, backup, editor upload semantics, portability, and lifecycle. M15 screenshot Context remains a distinct transient generation-input domain and cannot be reused for M14 storage.

#### Deterministic Plain Projection and AI Compatibility

One project-owned domain/application operation, conceptually `renderSnippetPlainText(content: SnippetContent): string`, is the canonical readable representation wherever structured content cannot be consumed. Plain content returns its stored `text` exactly. Rich content preserves block order and joins every adjacent block with exactly `\n\n`. Paragraphs concatenate their inline nodes in order; bold and italic markers are omitted while readable text remains. A link renders as `label (url)` when label and URL differ, otherwise as the URL. An image reference renders exactly `[Image: label] url`. No block may silently disappear.

Retrieval Engine scoring and Prompt Builder composition remain text-only. Their Snippet input comes from the deterministic projection, so indexing, ranking, provider-facing Prompt sections, and AI serialization never receive rich DOM structures or markup merely because M14 exists:

```text
SnippetContent
→ deterministic plain projection
→ Retrieval Engine
→ Prompt Builder
```

M14 changes no provider contract, endpoint, provider serialization, model behavior, or AI permission.

#### Expansion and Rendering

Destination-aware expansion extends the M13 adapter boundary:

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

The adapter determines target capability; the domain contains no Intercom, Gmail, Shopify, Crisp, or other destination names. A safely supported generic `contenteditable` may render only extension-created text nodes, paragraph separation using `<p>` or an equivalent safe structure, `<strong>`, `<em>`, and validated `<a>` nodes, all created from the target's own `ownerDocument`. Snippet insertion must not use `innerHTML`, `insertAdjacentHTML`, `DOMParser`, or `document.write`. Generic rendering neither creates `<img>` nor fetches a reference URL. An image-reference block retains its position through the deterministic reference text unless a separately approved destination capability safely supports real inline-image insertion.

`textarea` always receives the plain projection. M13's absent/text/search single-line input boundary remains: if the final projection contains `\r` or `\n`, the adapter declines before preventing Space, leaves the host value unchanged, and preserves normal typing. Content is never truncated, flattened, normalized, or partially inserted to fit.

All M13 activation and caret behavior is frozen: canonical semicolon trigger lookup; trusted cancelable Space `beforeinput`; inactive composition; collapsed caret; trigger immediately before the caret with start/whitespace left boundary; exact trigger-range replacement; one trailing U+0020 space; bubbling composed `input`; no synthetic `change`; predictable caret; recursion guard; and fail-safe normal typing. Colon activation is not M14 scope.

#### Transient Catalog Continuity

Dexie remains the sole persistent source. The service worker derives the catalog, and content scripts never access Dexie. M14 may evolve each exact validated catalog entry to include canonical trigger, Snippet ID, deterministic plain projection, and optional validated rich structure. It may not include surrounding editor text, host data, history, provider state, logs, or unrelated Library records.

M13-B.1 remains authoritative: one long-lived typed port per frame; atomic complete snapshots; worker epochs; monotonic revisions; invalidation before Snippet CRUD/import/restore persistence; one global publication barrier; complete rebuild after success or unchanged rebuild after failure; and fail-closed stale, disconnected, invalid, or publication-failed state. No browser-storage catalog, durable queue, polling, or per-keystroke worker lookup is approved.

#### Persistence and Backup Evolution

M14-B implements Dexie version 4 while preserving version 1, 2, and 3 declarations unchanged. Version 4 retains `knowledgeEntries: 'id, createdAt'`, `settings: 'id'`, and `snippetEntries: 'id, createdAt, &trigger'`; it adds no table or index. Its migration maps each v3 `content: string` exactly to `{ kind: 'plain', text: formerContent }` while preserving ID, title, tags and order, trigger, `createdAt`, and `updatedAt`. Triggerless physical records continue omitting the unique indexed property, and unexpected migration input fails.

Backup Formats v1 and v2 remain frozen and importable. M14-B implements dedicated exact Backup Format v3 DTOs independent from live domain and Dexie records, with explicit field-by-field mappings. V1 content strings map to current plain content and `trigger: null`; v2 strings map to plain content and preserve their trigger. New v3 exports contain the existing Knowledge and Settings contracts plus Snippets with metadata, trigger, and exact discriminated content.

V3 validation rejects the complete backup for an inexact envelope, missing or extra keys, dangerous keys, invalid identity/timestamps, duplicate IDs or triggers, invalid discriminants, unknown blocks/inlines/marks/references, invalid field types, or unapproved URLs. It performs no repair and interprets no HTML. The 25 MiB guard, deterministic order, metadata-only preview and acknowledgement, replace-only restore, one-transaction atomicity, and rollback guarantees remain unchanged.

#### Snippet Library and Scope

The existing Snippet Library remains the single surface. Existing and new plain Snippets use the fast plain editor; new Snippets default to plain. `Convert to rich template` is an explicit user action that preserves readable content. A Rich Snippet stays rich during ordinary editing; rich-to-plain conversion is intentionally deferred because it is lossy.

Rich authoring state is extension-owned structured data. A controlled contenteditable may be used as an interaction surface, but its HTML is never persisted or trusted as domain state. Initial authoring covers ordered paragraphs, bold, italic, links, and image references. Block ordering must be keyboard-accessible and cannot require drag-and-drop. No third-party rich-text editor dependency is approved; demonstrated need requires dependency and architecture review before addition.

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

M14 remains local-first. It captures or logs no surrounding conversation/editor content, trigger usage, history, page data, or provider state; sends no Snippet payload to an AI provider, analytics, or telemetry; reads or writes no clipboard; performs no page scraping; and adds no persistent content-script storage. The Rich Snippet payload is extension-owned user data and content-script inspection remains limited to M13's bounded trigger candidate and exact replacement range.

M14 v1 introduces no variables, placeholders, merge fields, customer interpolation, conditions, loops, scripting, AI-generated fields, arbitrary HTML/CSS, local binary images, clipboard ingestion, file upload, cloud hosting, automatic remote loading, screenshot generation Context, page scraping, usage analytics, trigger autocomplete, alternate trigger syntax, folder redesign, collaboration, sync, provider change, or new Chrome permission. Normal website scope remains exactly `http://*/*` and `https://*/*`; protected pages and other schemes remain unsupported. Existing `sidePanel`, `activeTab`, `scripting`, and localhost Ollama access remain unchanged, and M14 adds no `<all_urls>`, `file://`, `tabs`, clipboard, downloads, `webRequest`, cookies, identity, or new host permission.

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

The platform architecture remains approved and frozen: WXT, Manifest V3, TypeScript, React, Tailwind CSS, pnpm, Dexie, React Context and Hooks, Vitest, Playwright, ESLint, Prettier, Husky, and lint-staged. Milestones 1 through 13 are implemented and validated. M13-A.1 defined the architecture; M13-B implemented it; M13-B.1 corrected the catalog publication barrier; and M13-B.2 established isolated-world-safe integration plus all-normal-HTTP/HTTPS availability. Principal Engineer review, automated validation, product-owner real Chrome validation, implementation checkpoint `b76fcb4`, and closeout checkpoint `9a3c7ef` are complete. M14 — Rich Snippet Templates is current under Decision 36 and architecture checkpoint `c1105d4`. M14-B implements structured content, Dexie version 4, Backup Format v3, and plain-projection compatibility at `ed23f30`; M14-C implements structured authoring through project-owned React form state and the existing application boundary. Browser insertion remains plain-only. After M14-C approval, the next action is M14-D — Rich Snippet Browser Rendering.
