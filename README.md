# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, 11 — Settings, 12 — Import / Export, and 13 — Snippet Trigger Expansion v1 are complete. M14 — Rich Snippet Templates is current. M14-E implements validated Snippet-owned local image assets, atomic Dexie v5 persistence, strict Backup v4, and Decision 38's temporary catalog exclusion. Unified image authoring, clipboard-assisted delivery, and Rich browser rendering remain M14-F through M14-H. M15 and M16 remain separate.

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

Create M14-F — Unified Rich Editor Inline Image Authoring. Until M14-G, Snippets containing local-image blocks are omitted from the trigger catalog; no clipboard permission or transport exists.
