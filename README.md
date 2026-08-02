# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, and 11 — Settings are complete. The latest committed checkpoint is `f0eb4d3` (`docs: define default model settings architecture`); the completed M11 implementation, tests, and closeout documentation remain uncommitted pending Principal approval. M11 adds exactly one optional saved default Ollama model through a typed Settings boundary and Dexie version 2 singleton. Each new Side Panel session initializes its transient model field from that value; Workspace overrides remain temporary. The browser-scoped M10 capture handshake, provider boundary, fixed local Ollama endpoint, popup behavior, manifest, and permissions remain unchanged. Milestone 12 — Import / Export is current, but its architecture and implementation are not defined by the M11 closeout.

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

Review and authorize the uncommitted M11 implementation checkpoint, then push and synchronize it. After that milestone boundary is complete, define Milestone 12 — Import / Export architecture in a separate documentation task before implementation; do not expand M12 through M11 closeout wording.
