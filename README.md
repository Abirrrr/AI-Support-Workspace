# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-J validates Text, list, Image, Shadow-DOM, and no-refresh lifecycle behavior in Crisp and Intercom. M14-K is Principal-approved, real-browser validated, complete, and closed. M14-L/L.1 is checkpointed at `5450cff`. M14-M.0 is **PASS / REAL-CHROME VALIDATED**; M14-M.1 is the next planned implementation gate but is not yet authorized or started. Clipboard-only/manual `Ctrl+V` remains permanently supported.

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

Decisions 46–49 lock the future AI handoff. Principal-approved Decisions 50–53 and preserved Decision 54 define Snippet Hardening and primary navigation. M14-M.0 real-Chrome evidence proves the File System Access selected-folder model, including restart persistence, independent service-worker reuse, exact owned-file lifecycle, and unavailable-location safety; different-folder distinction remains a non-blocking M14-N production-adapter verification before retention may rely on it. Current Dexie v5, Backup v6, popup, production permissions/dependencies/runtime behavior, Knowledge compatibility, and M6/M7/M9 contracts remain unchanged. No automatic-backup product behavior exists, and M14-M.1, usage statistics, automatic scheduling, generated tags, and M15 have not started. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
