# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, 11 — Settings, 12 — Import / Export, and 13 — Snippet Trigger Expansion v1 are complete. M13 adds optional unique triggers to plain-text Snippets, local trigger persistence and backup, a transient synchronized catalog, and safe expansion in supported focused editors. Normal HTTP and HTTPS websites are eligible; Chrome-protected, browser-internal, extension, `file://`, and unsupported-scheme pages remain unavailable. The M13 implementation checkpoint is `b76fcb4`, and its closeout checkpoint is `9a3c7ef`. M14 — Rich Snippet Templates is current with architecture defined by M14-A and Decision 36; implementation has not started. M15 remains Multimodal Screenshot Context and M16 remains OpenAI Provider Expansion.

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

Create M14-B — Structured Snippet Content and Backup Foundation. M14 architecture is defined; Dexie v4, Backup Format v3, rich editing, and rich expansion are approved but not implemented.
