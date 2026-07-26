# Changelog

## [Unreleased]

### Milestone 8 — Ollama Provider Architecture Definition

- Corrected repository continuity to record Milestone 7 implementation checkpoint `a71dfed` (`feat: implement prompt builder`) as committed, pushed to `origin/master`, and synchronized between local `master` and the remote.
- Defined a narrow project-owned `GenerationProvider` contract with stable provider identity, transient `PromptAssembly` and model input, optional caller cancellation, and a minimal provider-independent generated-text result.
- Defined `OllamaProvider` as the first infrastructure adapter with identity `ollama`, native `fetch`, an injected fetch-compatible test seam, fixed local-only `http://localhost:11434/api/chat` access, and no SDK or new HTTP dependency.
- Approved deterministic conversion of each `PromptAssembly` into exactly one unchanged Instructions system message and one JSON user message ordered as applicable Guidance, Merchant Context, Knowledge, and Snippets content, excluding application metadata.
- Approved an exact non-streaming chat request with `stream: false`, caller-supplied model validation, strict assistant-content response validation, optional `AbortSignal` forwarding, and focused unavailable, missing-model, request, response, and cancellation errors.
- Preserved provider replaceability and local privacy by keeping raw Ollama types internal, exposing no raw response or telemetry, adding no prompt or generated-content logging, and defining no OpenAI placeholder, provider registry, or provider-name branching across consumers.
- Explicitly deferred extension runtime ownership, Chrome messaging and localhost permissions, CORS and extension-origin handling, UI and output workflows, Settings and model persistence, health checks, model pulling, streaming, timeouts, retries, tuning options, and database changes.
- Defined deterministic injected-transport automated coverage and an optional opt-in live validation against a developer's existing local Ollama model; normal automated tests must not require Ollama or real network access.
- Kept Milestone 8 current and made its provider architecture implementation-ready without adding implementation code, tests, dependencies, manifests, permissions, browser-runtime changes, UI, or WXT configuration.

### Milestone 7 — Prompt Builder

- Completed the approved deterministic, pure, headless Prompt Builder v1 as an application-layer operation over optional Merchant Context, optional Guidance, and optional prepared M6 `RetrievalResults`.
- Implemented the focused missing-primary-input error: at least one non-whitespace Context or Guidance value is required, retrieval-only input is rejected, and minimal Guidance such as `follow up` is valid.
- Implemented the frozen static provider-independent instructions and `Guidance > Merchant Context > Knowledge > Snippets` precedence without AI-based conflict resolution.
- Preserved M6 ranking while selecting at most the first five Knowledge and first three Snippet results, with no reranking, rescoring, threshold, padding, or retrieval invocation.
- Implemented typed explicit Instructions, Guidance, Merchant Context, Knowledge, and Snippets sections in canonical order, omitting empty optional sections and producing structurally deterministic assemblies without mutating inputs.
- Kept human-readable Knowledge title/body and Snippet title/content separate from application metadata. Domain kinds, IDs, and scores remain metadata; tags and Knowledge source are not automatically rendered into prompt content.
- Added 22 focused deterministic unit tests in 1 file. The full Vitest suite passed with 13 files and 72 tests.
- Passed dependency installation, linting, the final formatting check, type-checking, Playwright discovery of 1 test, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Required no M7-specific manual Chrome validation because Prompt Builder is headless, deterministic unit tests comprehensively cover its behavior, no browser interaction was added, and temporary demonstration UI would violate milestone scope.
- Introduced no retrieval orchestration, provider execution or serialization, Ollama, OpenAI, AI behavior, UI, images, Prompt Templates, persistence or history, token handling, snippet expansion, `;hello` behavior, schema or index change, Chrome permission, or Side Panel.
- Completed the mandatory Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation required synchronization; decisions, product requirements, and the UI workflow were reviewed and required no changes.
- Corrected repository continuity to record Prompt Builder architecture checkpoint `2c2c0ae` (`docs: define prompt builder architecture`) as committed, pushed to `origin/master`, and synchronized locally and remotely before implementation began.
- Advanced the current project milestone to Milestone 8 — Ollama Provider, then created checkpoint `a71dfed` (`feat: implement prompt builder`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 7 — Prompt Builder Architecture Definition

- Corrected repository continuity to record Milestone 6 implementation checkpoint `9649c1b` (`feat: implement retrieval engine`) as committed, pushed to `origin/master`, and synchronized between local `master` and the remote.
- Defined Prompt Builder v1 as a pure, headless, deterministic application-layer composition boundary that validates already-prepared inputs, applies fixed retrieval selection and approved precedence, and produces a typed provider-independent `PromptAssembly`.
- Approved optional Merchant Context, optional Guidance, and optional already-computed `RetrievalResults` as the input contract, with at least one non-whitespace primary input required and a focused missing-primary-input validation error.
- Assigned retrieval-query construction and Retrieval Engine invocation to a future application orchestrator; Prompt Builder preserves M6 ranking and does not call retrieval, alter scores, or rerank results.
- Approved `Guidance > Merchant Context > Knowledge > Snippets`, a static provider-independent grounding instruction section, top-five Knowledge and top-three Snippet selection, and canonical instructions/Guidance/Merchant Context/Knowledge/Snippets section ordering.
- Separated provider-facing title/body or title/content material from application metadata such as domain kind, ID, score, tags, and Knowledge source, with no fabricated citations.
- Defined deterministic empty-section, purity, grounding, formatting, and testing contracts while deferring provider serialization, AI execution, token handling, images, UI, persistence, Prompt Templates, schema changes, and retrieval orchestration.
- Kept Milestone 7 current without implementation code, tests, dependencies, database changes, permissions, or browser surfaces, then created checkpoint `2c2c0ae` (`docs: define prompt builder architecture`), pushed it to `origin/master`, and confirmed local and remote synchronization before implementation began.

### Milestone 6 — Retrieval Engine

- Completed the approved headless Retrieval Engine v1 as a local-only, deterministic, read-only application operation over the existing `KnowledgeEntryRepository` and `SnippetEntryRepository` contracts.
- Implemented separate typed Knowledge and Snippet result collections with complete domain records and numeric relevance scores; no combined cross-domain ranking was introduced.
- Implemented the frozen NFKC, lowercase, Unicode letter-or-number tokenization and exact 5/3/1 title/tag/body-or-content scoring behavior defined in `DECISIONS.md`, including token deduplication, Knowledge source exclusion, zero-score exclusion, tokenless-query handling, deterministic score/`createdAt`/`id` ordering, and no fixed result limit.
- Kept retrieval in memory behind project-owned repository boundaries with no record mutation, direct Dexie access, persistence search API, schema or index change, browser UI, provider dependency, or network access.
- Added focused deterministic unit and isolated IndexedDB repository-integration coverage. Focused retrieval validation passed with 2 files and 14 tests, and the full Vitest suite passed with 12 files and 50 tests.
- Passed dependency installation, linting, the final formatting check, type-checking, Playwright discovery of 1 test, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Required no M6-specific manual Chrome validation because the feature is headless, its algorithm and real repository integration are comprehensively covered by automation, and temporary demonstration UI would violate milestone scope.
- Introduced no semantic or vector retrieval, embeddings, fuzzy, prefix, or stemming behavior, search UI, AI or provider functionality, Context Builder, Prompt Builder, snippet expansion, `;hello` behavior, database or index change, Chrome permission, or Side Panel.
- Completed the mandatory Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation required synchronization; decisions, product requirements, and the UI workflow were reviewed and required no changes.
- Corrected repository continuity to record retrieval architecture checkpoint `5f2e0a0` (`docs: define retrieval engine architecture`) as committed, pushed to `origin/master`, and synchronized locally and remotely before implementation began.
- Advanced the current project milestone to Milestone 7 — Prompt Builder, then created checkpoint `9649c1b` (`feat: implement retrieval engine`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 6 — Retrieval Architecture Definition

- Corrected repository continuity to record Milestone 5 checkpoint `10fbd72` (`feat: implement snippet library`) as committed, pushed to `origin/master`, and synchronized locally and remotely.
- Defined Retrieval Engine v1 as one local, deterministic, read-only, provider-independent application operation over the existing `KnowledgeEntryRepository` and `SnippetEntryRepository` contracts, with in-memory scoring and no direct Dexie access.
- Approved a project-owned result envelope with separately ranked `knowledge` and `snippets` collections. Results retain their explicit domain kind, record identity, complete domain record, and numeric lexical score; no combined cross-domain ordering is defined.
- Approved Unicode NFKC normalization, locale-independent lowercase conversion, contiguous Unicode letter-or-number tokenization, and query and field token deduplication without stemming, fuzzy or prefix matching, synonym expansion, stop-word removal, or phrase matching.
- Defined Knowledge scoring fields as title, tags, and body while excluding source, and Snippet scoring fields as title, tags, and content.
- Approved exact per-token field weights of 5 for title, 3 for tags, and 1 for body or content, with no repeated-term inflation or phrase, recency, usage, source, domain, or random bonuses.
- Defined zero-score exclusion, empty results for queries without tokens, independent score-descending ranking with `createdAt` and `id` tie-breakers, and no fixed M6 result limit.
- Preserved database `ai-support-workspace`, schema version 1, tables, fields, indexes, migrations, repository contracts, browser surfaces, permissions, and provider independence.
- Added deterministic Retrieval Engine unit and isolated repository-integration test requirements without requiring browser UI for retrieval validation.
- Kept Milestone 6 current without retrieval implementation, dependency, schema, or UI changes, then created checkpoint `5f2e0a0` (`docs: define retrieval engine architecture`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 5 — Snippet Library

- Completed the first usable local Snippet Library on the existing options-page Library surface shared with the Knowledge Library through lightweight local tab navigation.
- Preserved popup navigation to the Library in a browser tab and kept the Knowledge Library operational after the Milestone 5 changes.
- Added a separate application-layer Snippet Library boundary over the existing project-owned `SnippetEntryRepository`; presentation code does not access Dexie or IndexedDB directly.
- Implemented deterministic listing, empty and loading states, manual creation, editing, confirmation-protected deletion, and local success and error feedback for Snippet entries.
- Exposed only the approved user-authored Snippet fields: title, content, and tags. Identity and timestamps remain persistence-owned.
- Preserved the approved database `ai-support-workspace`, physical schema version 1, table definitions, indexes, repository contracts, and persistence semantics.
- Added focused application, React UI, and application-to-Dexie integration coverage. The focused Milestone 5 suite passed with 3 files and 11 tests, and the full Vitest suite passed with 10 files and 36 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Completed Principal Engineer review and manual Chrome validation. Popup navigation opened the Library, lightweight local tabs opened the Snippet Library, the empty state worked, create and edit changes appeared immediately and persisted across reload or reopen, canceled deletion preserved data, confirmed deletion remained effective after reload or reopen, the Knowledge Library remained operational, and no runtime problems were reported during the tested workflow.
- Introduced no Chrome permissions, host permissions, database schema or index changes, snippet expansion or insertion, retrieval, AI behavior, Settings functionality, Side Panel, or other later-milestone functionality.
- Completed the mandatory Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation required synchronization; product requirements, the UI workflow, and the backlog were reviewed and required no changes.
- Corrected repository continuity to record Milestone 4 checkpoint `8f65922` (`feat: implement knowledge library`) as committed, pushed to `origin/master`, and synchronized locally and remotely.
- Advanced the current project milestone to Milestone 6 — Retrieval Engine, then created checkpoint `10fbd72` (`feat: implement snippet library`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 4 — Knowledge Library

- Completed the first usable local Knowledge Library on the existing options-page surface, with popup navigation that opens the surface in a browser tab.
- Added an application-layer Knowledge Library boundary over the existing project-owned `KnowledgeEntryRepository`; presentation code does not access Dexie or IndexedDB directly.
- Implemented deterministic listing, empty and loading states, manual creation, editing, confirmation-protected deletion, and local success and error feedback for Knowledge entries.
- Exposed only the approved user-authored Knowledge fields: title, body as Content, tags, and source. Identity and timestamps remain persistence-owned.
- Preserved the approved database `ai-support-workspace`, physical schema version 1, table definitions, indexes, repository contracts, and persistence semantics.
- Added focused application, React UI, and application-to-Dexie integration coverage. The full Vitest suite passed with 7 files and 25 tests.
- Passed dependency installation, linting, formatting, type-checking, Playwright test discovery, the production WXT build, generated Manifest V3 validation, and `git diff --check`.
- Completed Principal Engineer review and manual Chrome validation. Popup navigation opened the Knowledge Library, create and edit changes appeared immediately and persisted across reload or reopen, canceled deletion preserved data, confirmed deletion remained effective after reload or reopen, and no runtime problems were reported during the tested workflow.
- Introduced no Chrome permissions, host permissions, database schema or index changes, Snippet functionality, retrieval, search, ranking, AI behavior, Settings functionality, Side Panel, or other unapproved browser surface.
- Completed the mandatory Documentation Impact Review. Project-state, changelog, roadmap, README, architecture-status, database-status, and testing documentation required synchronization; product requirements and the UI workflow were reviewed and required no changes.
- Corrected repository continuity to record Milestone 3 checkpoint `fd6ffe5` (`feat: implement local persistence foundation`) as committed, pushed to `origin/master`, and synchronized locally and remotely.
- Advanced the current project milestone to Milestone 5 — Snippet Library, then created checkpoint `8f65922` (`feat: implement knowledge library`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 3 — Local Database

- Completed the Dexie-backed local persistence foundation using database `ai-support-workspace` and physical schema version 1.
- Implemented the approved `knowledgeEntries` and `snippetEntries` tables with inbound `id` primary keys and `createdAt` indexes, without changing the approved schema.
- Implemented project-owned `KnowledgeEntryRepository` and `SnippetEntryRepository` contracts with the approved create, get, list, update, and delete semantics behind the persistence boundary.
- Validated UUID generation, timestamp behavior, deterministic ordering, missing-record behavior, persistence-error wrapping, update semantics, and persistence across database close and reopen.
- Kept `fake-indexeddb` isolated to automated tests. All 13 persistence integration tests passed, and the full Vitest suite passed with 4 files and 15 tests.
- Passed linting, formatting, type-checking, Playwright test discovery, the production WXT build, and `git diff --check`; regression validation confirmed that the existing Manifest V3 extension shell remains operational.
- Required no Milestone 3-specific manual Chrome validation because the persistence boundary is validated more appropriately through isolated IndexedDB integration tests, while temporary browser UI would exceed the approved milestone scope.
- Introduced no Chrome permissions or host permissions and no Settings persistence, search, retrieval, ranking, AI behavior, product UI, undocumented schema change, or architecture change.
- Completed the mandatory Documentation Impact Review and synchronized the affected project-state, roadmap, schema-status, architecture-status, testing, README, and changelog documentation.
- Advanced the current project milestone to Milestone 4 — Knowledge Library, then created checkpoint `fd6ffe5` (`feat: implement local persistence foundation`), pushed it to `origin/master`, and confirmed local and remote synchronization.

### Milestone 3 — Database Architecture Definition

- Corrected repository state to record Milestone 2 checkpoint `6a8b0ae`, its push to `origin/master`, and local/remote synchronization.
- Approved the `ai-support-workspace` IndexedDB/Dexie database identity and initial physical schema version 1.
- Defined `knowledgeEntries` and `snippetEntries` as the only Milestone 3 physical tables; kept Settings planned and deferred to its later roadmap milestone.
- Defined primary keys, minimal `createdAt` indexes, UUID identity, timestamp behavior, record defaults, deterministic list ordering, project-owned CRUD contracts, error behavior, transaction policy, and migration policy.
- Approved `fake-indexeddb` as a test-only adapter for isolated Dexie integration tests without adding the dependency or implementation code.
- Preserved all approved domain fields and excluded search, retrieval, product UI, Settings persistence, and other future functionality from Milestone 3.

### Milestone 2 — Extension Shell

- Completed the first runnable WXT Chrome extension shell targeting Manifest V3.
- Added the approved background service worker, content script, React popup, and React options page without product or business functionality.
- Restricted the content script to `https://example.com/*`; the generated manifest contains no `permissions` or `host_permissions` and does not include Side Panel.
- Validated React and Tailwind within the popup and options surfaces.
- Added the first production WXT build, automated generated-manifest and build-output validation, React shell tests, and a continuous-integration production-build gate.
- Passed dependency installation, linting, formatting, type-checking, Vitest execution, Playwright test discovery, production build validation, and `git diff --check`.
- Completed Principal Engineer review and manual Chrome validation. The unpacked extension loaded successfully, Chrome accepted the generated Manifest V3 manifest, all approved runtime surfaces operated without reported errors, the content script initialized on its test page, and no unintended page modification was observed.
- Completed the mandatory Documentation Impact Review and synchronized affected repository status documentation without changing architecture, product requirements, milestone definitions, or roadmap scope.
- Advanced the current project milestone to Milestone 3 — Local Database.

### Engineering Workflow v1

- Formalized the standard implementation milestone lifecycle from finalized Principal Engineer scope through Codex implementation, review, documentation synchronization, manual validation, Git checkpoint, and GitHub push.
- Added Documentation Impact Review as a mandatory checkpoint gate with an explicit repository record required even when no documentation updates are needed.
- Added a reusable Milestone Closeout Checklist.
- Documented Git and GitHub synchronization policy for milestone boundaries.
- Defined deterministic, directly copy-pasteable Principal Engineer implementation task standards.
- Preserved the current milestone, architecture, roadmap, and product requirements.

### Milestone 1 — Technical Foundation

- Completed the Milestone 1 development foundation without adding extension runtime or business functionality.
- Initialized pnpm project management with a reproducible lockfile and explicit dependency build-script policy.
- Configured WXT, Manifest V3 targeting, TypeScript, React, Tailwind CSS, and Vite for future extension implementation.
- Added ESLint, Prettier, Husky, and lint-staged quality tooling.
- Added Vitest and Playwright testing foundations, including an infrastructure-only Playwright discovery test.
- Added continuous integration for installation, linting, formatting, type-checking, Vitest execution, and Playwright configuration validation.
- Validated the complete development toolchain successfully.
- Preserved the milestone boundary: no manifest, extension entry point, runtime source, storage implementation, business feature, or WXT production build was introduced.
- Deferred the first WXT production build to Milestone 2 — Extension Shell.

### Added

- Repository foundation documentation structure
- Initial product vision and requirements
- Initial architecture and decision records
- Initial roadmap and testing strategy
- Initial coding agent rules
- Initial project state document
- `UI_WORKFLOW.md`

### Updated

- Repository foundation completed.
- Finalized repository documentation after Principal Engineer review.
- Marked Milestone 0 as completed and aligned the project state with the new documentation-first workflow.
- Split the technical foundation and extension shell into separate milestones and synchronized subsequent milestone numbering.
- Added Milestones 0B, 0C, and 0D to make documentation finalization, technical architecture decisions, and platform approval explicit roadmap gates.
- Documented Manifest V3, TypeScript, React, layered testing, minimal state management, provider independence, planned storage boundaries, and project-layer responsibilities.
- Platform architecture approved.
- Technology stack finalized as WXT, Manifest V3, TypeScript, React, Tailwind CSS, pnpm, Dexie, React Context and Hooks, Vitest, Playwright, ESLint, Prettier, Husky, and lint-staged.
- Infrastructure decisions frozen for implementation.
- Repository ready for Milestone 1 implementation under an approved task.
- Repository continuity validation completed through a successful fresh-thread reconstruction.
- Documentation clarified following reconstruction testing.
- Milestone boundaries and infrastructure, architecture, and business-functionality terminology clarified without architecture changes.

### Notes

- Milestone 0 completed without implementation code.
- Milestones 0C and 0D documented and approved architecture without adding implementation artifacts.
- DP-001 includes no architecture changes and no implementation changes.
- The repository is now documented in a way that supports future milestone continuity.
