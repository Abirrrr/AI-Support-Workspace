# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

The platform architecture is approved and frozen. Milestone 6 — Retrieval Engine is complete at synchronized checkpoint `9649c1b` (`feat: implement retrieval engine`), and Milestone 7 — Prompt Builder is current. Its deterministic provider-independent composition contract is defined and implementation-ready, but Prompt Builder has not been implemented. Users can manage locally persisted Knowledge and Snippet entries through the shared options-page Library surface, while the headless Retrieval Engine provides deterministic local lexical retrieval over both domains for future consumers.

## Technology Stack

- WXT with Manifest V3
- TypeScript
- React with Tailwind CSS
- React Context and Hooks
- pnpm
- Dexie for local persistence
- Vitest and Playwright
- ESLint and Prettier
- Husky and lint-staged

## Repository Structure

- docs/: project documentation and planning artifacts
- src/: extension runtime and presentation source code
- tests/: automated unit, integration, build-output, and browser-test foundations
- .github/workflows/: CI and workflow configuration

## Documentation

The documentation in the docs directory is the only authoritative source of truth for product direction, architecture, workflow, and project state.

## Next Step

The Principal Engineer should review this Milestone 7 architecture definition and authorize its documentation checkpoint and GitHub synchronization. After that checkpoint is synchronized, the exact Milestone 7 — Prompt Builder implementation task should be approved from the frozen contract. No work should advance beyond M7.
