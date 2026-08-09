# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–13 are complete. M14 — Snippet Authoring and Delivery is current. The uncommitted M14-G/G.2 package implements structured lists, strict Backup v5, unified Tiptap Text authoring, and screenshot-first Image Snippet authoring over M14-E's atomic Dexie v5 asset foundation. Historical Plain remains compatible and converts only on Save; Image Snippets remain isolated from Retrieval, Prompt Builder, and trigger delivery. M15 Context Images remain separate generation inputs.

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

After Principal approval/checkpoint, implement M14-I — Unified Snippet Clipboard Delivery and Trigger Planner for both Text and Image Snippets. M14-H is absorbed into M14-G.2. External clipboard transport, permissions, and native destination paste are not implemented yet; M14-J remains destination compatibility validation.
