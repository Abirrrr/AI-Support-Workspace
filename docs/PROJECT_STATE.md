# Project State

## Current Milestone

- Milestone 7 — Prompt Builder

## Previous Milestones

- Milestone 0 — Foundation: Completed
- Milestone 0B — Repository Documentation Finalization: Completed
- Milestone 0C — Technical Architecture Decisions: Completed
- Milestone 0D — Platform Architecture Approval: Completed
- Milestone 1 — Technical Foundation: Completed
- Milestone 2 — Extension Shell: Completed
- Milestone 3 — Local Database: Completed
- Milestone 4 — Knowledge Library: Completed
- Milestone 5 — Snippet Library: Completed
- Milestone 6 — Retrieval Engine: Completed

## Project Status

- Status: Platform architecture remains approved and frozen. Milestone 6 implementation is complete at checkpoint `9649c1b` (`feat: implement retrieval engine`), committed and pushed to `origin/master`, with local `master` and `origin/master` synchronized at that checkpoint. Milestone 7 is current.
- Scope: Milestone 7 — Prompt Builder is the current implementation milestone defined by the roadmap. Its deterministic provider-independent composition contract is approved and implementation-ready, but Prompt Builder has not been implemented.
- Business functionality: The Knowledge Library, Snippet Library, and local lexical Retrieval Engine are implemented. Prompt construction, provider integration, output, and other later-milestone functionality are not implemented.
- The completed runtime shell provides the approved background service worker, content script, popup, and options-page boundaries required for later milestones.

## Architecture Status

- Extension platform: WXT targeting Manifest V3.
- Language and UI: TypeScript, React, and Tailwind CSS.
- Package and quality tooling: pnpm, ESLint, Prettier, Husky, and lint-staged.
- State and persistence: React Context and Hooks, with Dexie behind project-owned storage contracts.
- Testing: Vitest for unit, UI, and integration tests; Playwright for browser-level end-to-end tests.
- Business logic remains local-first, layered, storage-independent, and AI-provider-independent.
- Development tooling, automated validation, the runnable Manifest V3 extension shell, the Dexie-backed local persistence foundation, the Knowledge and Snippet Libraries, and the Retrieval Engine business feature exist.
- The initial physical database schema, project-owned CRUD contracts, identity and timestamp semantics, error behavior, transaction policy, migration policy, and isolated test adapter are approved in `DATABASE_SCHEMA.md` and `DECISIONS.md`.
- Knowledge and Snippet management share the existing options-page Library surface, opened in a browser tab from popup navigation, with lightweight local tab navigation between the libraries. Their presentation uses separate application-layer boundaries over `KnowledgeEntryRepository` and `SnippetEntryRepository` and does not access Dexie directly.
- Retrieval Engine v1 is implemented as one headless application-level operation over the two existing repository contracts. It returns separately ranked Knowledge and Snippet collections, scores records in memory, remains local and read-only, and does not access Dexie directly or depend on UI or AI-provider behavior.
- `DECISIONS.md` is authoritative for the M6 normalization, fields, scoring, repeated-term behavior, empty and no-match behavior, deterministic per-domain ordering, absence of result limits, and performance direction.
- Prompt Builder v1 is approved as a pure, headless application-layer composition boundary over optional Merchant Context, optional Guidance, and already-computed Retrieval Results. A future orchestrator owns query construction and Retrieval Engine invocation; Prompt Builder validates primary input, preserves M6 ranking, selects the first five Knowledge and first three Snippet results, applies `Guidance > Merchant Context > Knowledge > Snippets`, and returns an explicitly sectioned provider-independent `PromptAssembly`.
- `DECISIONS.md` is authoritative for the M7 input and output contracts, minimum valid input, default instructions, precedence and grounding, content-versus-metadata policy, selection limits, deterministic formatting, empty behavior, purity, and provider, UI, persistence, token, and image boundaries.

## Completed Work

- Completed Milestone 0 documentation and engineering workflow setup.
- Added a dedicated UI workflow document describing the user journey from a product perspective.
- Finalized repository documentation so it can serve as the project's primary memory across future conversations.
- Established the required lifecycle from approved decisions through validation, documentation, and a Git checkpoint.
- Completed Milestone 0B documentation finalization and created its Git checkpoint.
- Documented the technical architecture and application boundaries in Milestone 0C.
- Approved and froze the platform stack in Milestone 0D.
- Completed Milestone 1 by configuring pnpm, WXT, TypeScript, React, Tailwind CSS, ESLint, Prettier, Husky, lint-staged, Vitest, Playwright, and continuous integration.
- Validated dependency installation, linting, formatting, type-checking, Vitest execution, and Playwright configuration without creating an extension runtime or running a WXT production build.
- Completed Milestone 2 by adding the WXT-owned Manifest V3 runtime shell with the approved background service worker, content script, popup, and options page.
- Added minimal React and Tailwind runtime surfaces without product or business functionality.
- Added the first production WXT build, generated-manifest validation, React shell tests, and the production build continuous-integration gate.
- Confirmed that the generated manifest contains no `permissions` or `host_permissions`, restricts the content script to `https://example.com/*`, and does not introduce Side Panel.
- Completed Principal Engineer review and manual Chrome validation of unpacked loading, Manifest V3 acceptance, popup and options rendering, service-worker operation, content-script initialization, absence of page modification, and absence of browser/runtime errors.
- Completed the Milestone 2 Documentation Impact Review. Project-state, changelog, README, roadmap, architecture-status, and database-status documentation were synchronized without changing architecture, product requirements, milestone definitions, or roadmap scope.
- Created Milestone 2 checkpoint `6a8b0ae` (`feat: implement extension shell`), pushed `master` to `origin/master`, and confirmed local and GitHub synchronization at that checkpoint.
- Defined the implementation-ready Milestone 3 database architecture and synchronized it at checkpoint `1513d13` (`docs: define local persistence architecture`).
- Completed Milestone 3 by implementing database `ai-support-workspace`, schema version 1, the approved `knowledgeEntries` and `snippetEntries` tables, and project-owned Knowledge Entry and Snippet Entry repositories without changing the approved architecture or schema.
- Validated the persistence foundation with 13 passing integration tests, including close-and-reopen persistence; the full project suite passed with 4 files and 15 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, and `git diff --check`, while regression validation confirmed that the existing Manifest V3 extension shell remains operational.
- Completed the Milestone 3 Documentation Impact Review and synchronized all affected status, schema, architecture, testing, roadmap, README, and changelog documentation.
- Determined that no Milestone 3-specific manual Chrome validation was required because isolated IndexedDB integration tests are the appropriate persistence validation and temporary browser UI would exceed the approved milestone boundary.
- Created Milestone 3 checkpoint `fd6ffe5` (`feat: implement local persistence foundation`), pushed `master` to `origin/master`, and confirmed local and GitHub synchronization at that checkpoint.
- Completed Milestone 4 by adding the application-layer Knowledge Library boundary and a focused create, list, edit, and confirmation-protected delete experience on the existing options page, reached through popup navigation.
- Kept the UI behind `KnowledgeEntryRepository`, used the real M3 Dexie implementation in production, and preserved database `ai-support-workspace`, physical schema version 1, table definitions, indexes, and persistence semantics.
- Added application, React UI, and application-to-Dexie integration coverage. The full project suite passed with 7 test files and 25 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, generated Manifest V3 validation, and `git diff --check` without adding permissions, host permissions, or Side Panel.
- Completed Principal Engineer review and manual Chrome validation of popup navigation, immediate create and edit behavior, persistence across reload or reopen, delete cancellation, confirmed deletion, deletion persistence, and absence of reported runtime problems.
- Completed the Milestone 4 Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation were synchronized; product requirements and UI workflow were reviewed and required no changes.
- Created Milestone 4 checkpoint `8f65922` (`feat: implement knowledge library`), pushed `master` to `origin/master`, and confirmed local and remote synchronization at that checkpoint.
- Completed Milestone 5 by adding a focused create, list, edit, and confirmation-protected delete experience for Snippets on the existing options-page Library surface.
- Added lightweight local tab navigation between the Knowledge and Snippet libraries while preserving the existing popup-to-Library browser-tab navigation and keeping the Knowledge Library operational.
- Kept Snippet UI behavior behind a separate application-layer boundary over `SnippetEntryRepository`, used the real Milestone 3 Dexie implementation in production, and preserved database `ai-support-workspace`, physical schema version 1, table definitions, indexes, contracts, and persistence semantics.
- Added focused application, React UI, and application-to-Dexie integration coverage. The focused Milestone 5 suite passed with 3 files and 11 tests, and the full project suite passed with 10 files and 36 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, generated Manifest V3 validation, and `git diff --check` without adding permissions, host permissions, schema or index changes, snippet expansion or insertion, retrieval, AI, Settings, or Side Panel functionality.
- Completed Principal Engineer review and manual Chrome validation of Library navigation, the Snippet empty state, immediate create and edit behavior, persistence across reload or reopen, delete cancellation, confirmed deletion, deletion persistence, Knowledge Library regression behavior, and absence of reported runtime problems.
- Completed the Milestone 5 Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation were synchronized; product requirements, UI workflow, and backlog were reviewed and required no changes.
- Created Milestone 5 checkpoint `10fbd72` (`feat: implement snippet library`), pushed `master` to `origin/master`, and confirmed local and remote synchronization at that checkpoint.
- Defined the implementation-ready Milestone 6 Retrieval Engine v1 architecture as a local, deterministic, lexical, provider-independent, read-only application operation over the existing Knowledge and Snippet repository contracts.
- Approved separate Knowledge and Snippet result collections; NFKC, locale-independent lowercase, and Unicode letter-or-number tokenization; exact title/tag/body-or-content weights of 5/3/1; query and field token deduplication; zero-score exclusion; empty-query behavior; deterministic score/`createdAt`/`id` ordering; and no fixed result limit.
- During the architecture-definition task, preserved the existing database, schema version, tables, fields, indexes, migrations, repository contracts, browser surfaces, permissions, and provider-independent boundaries while adding no implementation code or dependencies.
- Created Retrieval Engine architecture checkpoint `5f2e0a0` (`docs: define retrieval engine architecture`), pushed `master` to `origin/master`, and confirmed local and remote synchronization before implementation began.
- Completed Milestone 6 by implementing the approved headless Retrieval Engine over the existing Knowledge and Snippet repository `list()` contracts, with separate typed result collections and no direct Dexie, browser UI, provider, or network dependency.
- Implemented the frozen NFKC, lowercase, Unicode letter-or-number tokenization and exact 5/3/1 lexical scoring behavior, including query and field token deduplication, Knowledge source exclusion, zero-score exclusion, tokenless-query handling, deterministic per-domain ordering, no fixed result limit, and read-only operation.
- Added deterministic unit and isolated IndexedDB repository-integration coverage. Focused retrieval validation passed with 2 files and 14 tests, and the full project suite passed with 12 files and 50 tests.
- Passed dependency installation, linting, final formatting validation, type-checking, Playwright discovery of 1 test, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Completed Principal Engineer review and determined that no M6-specific manual Chrome validation was required because the Retrieval Engine is headless, the algorithm and real repository boundary are comprehensively automated, and temporary demonstration UI would violate milestone scope.
- Completed the Milestone 6 Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation were synchronized; decisions, product requirements, and UI workflow were reviewed and required no changes.
- Created Milestone 6 implementation checkpoint `9649c1b` (`feat: implement retrieval engine`), pushed `master` to `origin/master`, and confirmed local and remote synchronization at that checkpoint.
- Defined the implementation-ready Milestone 7 Prompt Builder v1 architecture as a deterministic, pure, headless application-layer composition boundary that receives already-computed Retrieval Results and produces a typed provider-independent `PromptAssembly`.
- Approved optional Merchant Context and Guidance with at least one non-whitespace primary input; `Guidance > Merchant Context > Knowledge > Snippets` authority; a static grounding instruction section; fixed top-five Knowledge and top-three Snippet selection; canonical section ordering; and separation of provider-facing content from application metadata.
- Deferred retrieval orchestration, provider selection and serialization, AI execution, model and token handling, images, UI, persistence, Prompt Templates, and database changes from M7 while adding no implementation code, tests, dependencies, permissions, or browser surfaces during architecture definition.

## Next Engineering Action

- The Principal Engineer should review the Milestone 7 architecture definition and authorize its documentation checkpoint and GitHub synchronization when satisfied.
- After the architecture checkpoint is synchronized, the Principal Engineer should prepare and approve the exact Milestone 7 — Prompt Builder implementation task from the frozen contract.
- Provider integrations, output workflows, and other later-milestone functionality remain out of scope for Milestone 7 unless the existing roadmap and an approved implementation task explicitly include them.

## Repository Status

- The repository contains the completed Milestone 1 development foundation and completed Milestone 2 extension shell.
- A fresh-thread reconstruction validation successfully recovered the frozen architecture, repository status, and correct current milestone using repository documentation alone.
- The approved platform may not be substituted without an explicit architecture review.
- Package management, build-tool configuration, quality tooling, testing configuration, production manifest validation, an infrastructure-only Playwright discovery test, and continuous integration are configured.
- The WXT-generated Manifest V3 extension includes only the background service worker, content script, popup, and options page. Side Panel is absent.
- The approved Dexie-backed local persistence foundation exists with database `ai-support-workspace`, schema version 1, two physical tables, and project-owned repository contracts.
- The Knowledge and Snippet libraries share the options-page Library surface with lightweight local tab navigation, popup navigation, and locally persisted create, list, edit, and confirmation-protected delete workflows.
- The latest existing checkpoint is `9649c1b` (`feat: implement retrieval engine`) and is synchronized between local `master` and `origin/master`.
- The Milestone 7 architecture definition is an uncommitted documentation change. No M7 architecture or implementation checkpoint has been recorded.
- The headless Retrieval Engine exists with deterministic exact-token lexical ranking over Knowledge and Snippets through their existing repository contracts.
- No semantic or vector retrieval, embeddings, fuzzy, prefix, or stemming behavior, search UI, Context Builder, Prompt Builder, snippet expansion or insertion, provider integration, AI behavior, Settings functionality, or later-milestone business functionality exists.

## Continuity Handoff

- Frozen architecture: WXT and Manifest V3 with the approved TypeScript, React, Tailwind CSS, pnpm, Dexie, validation, testing, and commit-gate stack listed above.
- Current implementation milestone: Milestone 7 — Prompt Builder.
- Current repository state: Documentation, architecture, the Milestone 1 development toolchain, the reviewed and manually validated Milestone 2 extension shell, the reviewed and automatically validated Milestone 3 local persistence foundation, the reviewed and manually validated Milestone 4 Knowledge Library and Milestone 5 Snippet Library, and the reviewed and automatically validated Milestone 6 Retrieval Engine are complete. The Milestone 7 Prompt Builder contract is defined but not implemented.
- Next action: Obtain Principal Engineer approval for the Milestone 7 architecture-definition documentation and its authorized checkpoint, then approve the exact M7 implementation task.
- Additional business functionality starts only in its assigned later milestones.

## Outstanding Risks

- Browser-specific behaviors introduced by future milestones will require their own automated and manual validation.
- The Milestone 2 content script intentionally matches only `https://example.com/*`; production merchant-platform behavior remains future scope.
- The Milestone 7 architecture-definition changes require Principal Engineer review, an authorized Git checkpoint, and GitHub synchronization before implementation begins.
- History remains intentionally undecided and must not be assumed to be in scope.

## Current Git Checkpoint

- Latest existing checkpoint: `9649c1b` (`feat: implement retrieval engine`). Local `master` and `origin/master` are synchronized at this checkpoint.
- The Milestone 7 architecture definition has no authorized checkpoint yet, and no Prompt Builder implementation exists.
