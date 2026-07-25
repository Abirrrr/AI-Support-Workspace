# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

The platform architecture is approved and frozen. Milestone 4 — Knowledge Library is complete following Principal Engineer review, manual Chrome validation, and documentation closeout, and Milestone 5 — Snippet Library is current. The first product functionality now lets users manage locally persisted Knowledge entries through the existing options-page surface, reached from the extension popup.

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

The Milestone 4 implementation and closeout changes await an authorized Git checkpoint and GitHub synchronization. After that milestone boundary is synchronized, the Principal Engineer should prepare and approve the exact Milestone 5 — Snippet Library implementation task under the existing roadmap and frozen architecture.
