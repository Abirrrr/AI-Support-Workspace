# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-J validates Text, list, Image, Shadow-DOM, and no-refresh lifecycle behavior in Crisp and Intercom. M14-K is Principal-approved, real-browser validated, complete, and closed. M14-L/L.1 is checkpointed at `5450cff`, M14-M.0 remains **PASS / REAL-CHROME VALIDATED**, the M14-M.1/M14-M.1.1 Dexie v6/Backup v7 foundation is synchronized at `20b509c`, and M14-M.2 is synchronized at `f4d9ab0`. M14-M.3 implements deterministic non-blocking Text/Image usage counting and lightweight Library counts; M14-N, M14-O, M14-P, and M15 remain unstarted. Clipboard-only/manual `Ctrl+V` remains permanently supported.

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

Decisions 46–49 lock the future AI handoff. Principal-approved Decisions 50–53 and preserved Decision 54 define Snippet Hardening and primary navigation. M14-M.3 records one use only after clipboard success, exact cleanup, and matching transient receipt consumption; the Library shows the separate sidecar count without authored or retrieval churn. M14-N automatic backup remains the next separately gated implementation after review/checkpoint. Before M14-P closes, daily-use link presentation, deterministic Edit focus/navigation, the complete Snippet subsystem, and real-world delivery performance must be reviewed and stabilized. Future M15 Generated Output adds user-controlled Save as Snippet plus Copy; generation never auto-creates a Snippet. Popup behavior, production permissions/dependencies, Knowledge compatibility, and M6/M7/M9 contracts remain unchanged. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
