# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, 11 — Settings, and 12 — Import / Export are complete. The latest committed and pushed checkpoint is `ea3e90d` (`docs: close milestone 12 and advance to milestone 13`), which remains the repository base before the uncommitted M13-A.1 documentation. Milestone 13 — Snippet Trigger Expansion v1 is current. The unstarted M13-A OpenAI readiness review was superseded by the product-priority realignment. M13-A.1 — Snippet Trigger Expansion Roadmap and Architecture Definition is complete and Principal Engineer approved; M13-B — Snippet Trigger Expansion Implementation is active but has not started, and no M13 source implementation exists yet. M14 is Rich Snippet Templates, M15 is Multimodal Screenshot Context, and M16 is OpenAI Provider Expansion.

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

Perform M13-B — Snippet Trigger Expansion Implementation. It has not started and is the exact next engineering action.
