# Changelog

## [Unreleased]

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
- Kept Milestone 6 current and performed no retrieval implementation, dependency change, schema change, UI change, commit, or push.

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
