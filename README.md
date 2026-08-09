# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, 11 — Settings, 12 — Import / Export, and 13 — Snippet Trigger Expansion v1 are complete. M14 — Rich Snippet Templates is current. M14-B implements structured content, Dexie v4, Backup v3, and deterministic text compatibility; M14-C implements Rich authoring at `a787100`. M14-D adds Decision 37, revising the pending architecture toward one Rich editor with locally owned inline images and capability-based direct/clipboard delivery. Local assets, Dexie v5, Backup v4, unified image authoring, clipboard fallback, and Rich browser rendering are not yet implemented. M15 and M16 remain separate.

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

Create M14-E — Local Image Asset Foundation and Backup v4. M14-D is documentation-only; browser expansion still uses deterministic plain projection and has no clipboard permission or transport.
