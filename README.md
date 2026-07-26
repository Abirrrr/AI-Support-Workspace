# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

The platform architecture is approved and frozen. Milestone 5 — Snippet Library is complete following Principal Engineer review, manual Chrome validation, and documentation closeout, and Milestone 6 — Retrieval Engine is current. Users can manage locally persisted Knowledge and Snippet entries through the shared options-page Library surface, which is reached from the extension popup and uses lightweight local tab navigation between the two libraries.

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

Milestone 5 is committed and synchronized at checkpoint `10fbd72` (`feat: implement snippet library`). The deterministic lexical architecture for the current Milestone 6 — Retrieval Engine is implementation-ready and awaits Principal Engineer approval before the finalized implementation task proceeds.
