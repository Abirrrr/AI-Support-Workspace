# Architecture

## Architectural Intent

The architecture for this project is intentionally simple. The repository should remain easy to navigate, easy to test, and easy to evolve without introducing unnecessary layers.

## High-Level Structure

The project is expected to evolve around a small set of responsibilities:

- Extension shell: hosts the user experience in the browser.
- Local storage layer: persists knowledge, snippets, and settings locally.
- Retrieval engine: searches and ranks relevant content quickly.
- Prompt builder: constructs provider-independent request payloads.
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

Dexie is the approved storage abstraction over browser-local IndexedDB. The application will depend on project-owned storage contracts so domain and application logic remain independent of Dexie and the browser persistence mechanism. Knowledge, snippets, and settings are local data. Table design, migrations, indexing, and transaction behavior remain schema decisions for the storage milestone and are not implemented by this architecture milestone.

History remains an intentionally undecided capability and is not part of the planned storage architecture.

### Project Layer Responsibilities

- Extension platform layer: owns WXT and Manifest V3 entry points, Chrome API integration, permissions, messaging, and extension lifecycle behavior.
- Presentation layer: owns React views, Tailwind styling, components, Context and Hooks usage, interaction state, and accessibility behavior.
- Application layer: coordinates use cases and connects presentation to domain contracts.
- Domain layer: owns provider-independent and storage-independent business concepts and rules.
- Infrastructure layer: implements browser, Dexie storage, and AI-provider adapters behind project-owned contracts.
- Shared layer: contains only stable, cross-layer types and utilities that do not belong to a more specific layer.

React Context and Hooks coordinate presentation state without replacing application services or domain contracts. Independent state-management libraries may not be substituted without an explicit architecture review.

### Planned Folder Structure

The following structure is architectural guidance for future implementation. This milestone does not create these directories.

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

The platform architecture is approved and frozen for implementation: WXT, Manifest V3, TypeScript, React, Tailwind CSS, pnpm, Dexie, React Context and Hooks, Vitest, Playwright, ESLint, Prettier, Husky, and lint-staged. No implementation modules or platform artifacts are present yet.
