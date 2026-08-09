# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, 11 — Settings, 12 — Import / Export, and 13 — Snippet Trigger Expansion v1 are complete. M14 — Rich Snippet Templates / Snippet Delivery is current. M14-E at `1828f09` implements validated Snippet-owned local assets, atomic Dexie v5 persistence, strict Backup v4, and Decision 38 compatibility safety. Decision 39 cancels embedded local-image Rich authoring: Rich Snippets target portable formatted text and lists, while Image Snippets will be separate one-image Snippets using the same Library and trigger system. M15 Context Images remain separate generation inputs.

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

After M14-F.1 Principal approval, create M14-G — Rich Snippet Structured Lists and Backup v5 Foundation. Image Snippet authoring follows in M14-H, typed clipboard/native-paste image delivery in M14-I, and Rich text/list destination validation in M14-J. No clipboard permission or transport exists yet.
