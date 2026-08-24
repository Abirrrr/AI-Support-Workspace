# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-J validates Text, list, Image, Shadow-DOM, and no-refresh lifecycle behavior in Crisp and Intercom. M14-K is Principal-approved, real-browser validated, complete, and closed at implementation checkpoint `e34cd76` and synchronized closeout checkpoint `3e5d545`. M14-L.1 — Hardening Architecture Continuity & Feasibility-Gate Reconciliation is the active documentation-only task; M14-M.0 through M14-P are assigned but unimplemented. Clipboard-only/manual `Ctrl+V` remains permanently supported.

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
- native/windows-clipboard-companion/: Windows native clipboard companion, protocol fixtures, and development registration tooling
- .github/workflows/: CI and workflow configuration

## Documentation

The documentation in the docs directory is the only authoritative source of truth for product direction, architecture, workflow, and project state.

## Next Step

Decisions 46–49 lock the future AI handoff. Principal-approved Decisions 50–53 and preserved Decision 54 define Snippet Hardening and primary navigation: one future Dexie v6/Backup v7 foundation after mandatory M14-M.0 real-Chrome selected-folder feasibility; separate non-blocking Text/Image usage statistics; a user-selected File System Access backup folder scheduled through future `chrome.alarms`; Daily latest-seven and Weekly latest-four retention with strict manifest/digest ownership proof; fingerprinted provider-independent generated Text tags with bounded deterministic retrieval; and the future toolbar → Workspace Side Panel → Settings gear → Options / Libraries model. Current Dexie v5, Backup v6, popup, permissions, dependencies, runtime behavior, Knowledge compatibility, and M6/M7/M9 contracts remain unchanged; no M14-M.0, M14-K optimization, or M15 implementation has started. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
