# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, and 11 — Settings are complete. The latest committed and pushed checkpoint is `f09e776` (`docs: add task identifiers and assign future milestones`). Milestone 12 — Import / Export is current and incomplete. M12-B completed its readiness review with verdict `ARCHITECTURE DEFINITION REQUIRED`. M12-C completed the approved implementation-ready architecture and passed Principal Engineer review. M12-D is active as the next authorized implementation task but has not started. M13 remains Provider Expansion / OpenAI, M14 remains Multimodal Context Attachments, and M15 remains Rich Snippet Templates & Trigger Expansion.

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

Create and synchronize the shared M12-C architecture documentation checkpoint when authorized, then begin the active but unstarted M12-D implementation task. M12 is not complete, and no implementation checkpoint exists.
