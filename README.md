# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

The platform architecture is approved and frozen. Milestone 2 — Extension Shell is complete, and Milestone 3 — Local Database is current. The runnable Manifest V3 shell contains only the approved background service worker, content script, popup, and options page; no business functionality has been implemented yet.

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

After the authorized Milestone 2 Git checkpoint and repository synchronization, the Principal Engineer should prepare and approve the exact Milestone 3 — Local Database implementation task. Implementation must conform to the frozen platform and storage boundaries documented in the repository.
