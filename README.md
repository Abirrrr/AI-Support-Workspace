# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-J validates Text, list, Image, Shadow-DOM, and no-refresh lifecycle behavior in Crisp and Intercom. M14-K is Principal-approved, real-browser validated, complete, and closed. M14-L/L.1 is checkpointed at `5450cff`, and M14-M.0 remains **PASS / REAL-CHROME VALIDATED**. M14-M.1 plus its focused M14-M.1.1 cadence/local-authority correction implement the coordinated Dexie v6 / Backup v7 data foundation and await Principal review; M14-M behavior, M14-N, M14-O, M14-P, and M15 remain unstarted. Clipboard-only/manual `Ctrl+V` remains permanently supported.

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

Decisions 46–49 lock the future AI handoff. Principal-approved Decisions 50–53 and preserved Decision 54 define Snippet Hardening and primary navigation. M14-M.1/M14-M.1.1 advance current persistence to Dexie v6 and Backup v7 with separate usage/generated sidecars, exact portable `off | daily | weekly` cadence, and a separately preserved local-only selected-directory state boundary. Backup import never contains, clears, replaces, or creates filesystem authority. M14-M.0 evidence remains authoritative; different-folder distinction remains an M14-N verification before retention reliance. Popup behavior, production permissions/dependencies, Knowledge compatibility, and M6/M7/M9 contracts remain unchanged. No automatic usage counting/UI, backup scheduler/output/retention, generated-tag provider/retrieval behavior, or M15 implementation exists. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
