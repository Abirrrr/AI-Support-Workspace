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

Side Panel is not an approved application surface and requires a documented product and architecture decision before implementation.

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

A future application orchestration boundary decides the retrieval query, invokes the existing Retrieval Engine, and passes its `RetrievalResults` to Prompt Builder. Prompt Builder does not call Retrieval Engine, rerun scoring, rerank results, or construct the retrieval query. It preserves the separate Knowledge and Snippet collections and their M6 ranking order.

The v1 input contract contains optional Merchant Context, optional Guidance, and optional already-computed Retrieval Results. At least one of Merchant Context or Guidance must contain non-whitespace text; retrieval results alone cannot define the current support task. Images, provider identifiers, destination identifiers, and manual Library-record selection are not Prompt Builder v1 inputs.

`PromptAssembly` contains an ordered collection of sections whose kinds are explicit. The canonical order is instructions, non-empty Guidance, non-empty Merchant Context, selected Knowledge, and selected Snippets. Prompt Builder owns deterministic section content and a static provider-independent instruction section, but not provider message roles, request serialization, model configuration, tokenization, provider limits, or AI execution. Future provider adapters consume the assembly and serialize it for their provider boundary.

Provider-facing content remains separate from application metadata. Knowledge sections use the human-readable title and body, while Snippet sections use the human-readable title and content. Record identity, retrieval score, tags, and Knowledge source may remain available as application metadata but are not automatically rendered into provider-facing text. `DECISIONS.md` is authoritative for precedence, grounding, input semantics, selection limits, formatting, empty behavior, metadata treatment, purity, and M7 non-goals.

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

The platform architecture remains approved and frozen: WXT, Manifest V3, TypeScript, React, Tailwind CSS, pnpm, Dexie, React Context and Hooks, Vitest, Playwright, ESLint, Prettier, Husky, and lint-staged. The Milestone 1 development foundation, Milestone 2 runtime extension shell, Milestone 3 local persistence foundation, Milestone 4 Knowledge Library, Milestone 5 Snippet Library, and Milestone 6 Retrieval Engine are implemented. Knowledge and Snippet management share the existing options-page Library surface, while the headless Retrieval Engine operates over their separate project-owned repository contracts and returns independently ranked domain collections. Milestone 6 passed Principal Engineer review and comprehensive automated validation without architecture, schema, browser-surface, provider, or permission changes. No M6-specific manual Chrome validation was required because the implemented boundary is headless and is validated through deterministic unit and isolated repository-integration tests. Milestone 7 — Prompt Builder is current, and its deterministic provider-independent composition contract is approved for implementation; no Prompt Builder implementation exists yet.
