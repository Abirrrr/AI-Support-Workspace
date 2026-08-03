# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, 11 — Settings, 12 — Import / Export, and 13 — Snippet Trigger Expansion v1 are complete. M13 adds optional unique triggers to plain-text Snippets, local trigger persistence and backup, a transient synchronized catalog, and safe expansion in supported focused editors. Normal HTTP and HTTPS websites are eligible; Chrome-protected, browser-internal, extension, `file://`, and unsupported-scheme pages remain unavailable. The latest committed and pushed checkpoint is `b76fcb4` (`feat: add snippet trigger expansion`). M14 — Rich Snippet Templates is current but not started; M15 remains Multimodal Screenshot Context and M16 remains OpenAI Provider Expansion.

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

Create M14-A — Rich Snippet Templates Architecture and Product Boundary. M14 architecture and implementation have not started.
