# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-P.1 through M14-P.5 are approved checkpoints; M14-P.5 is synchronized at `d94181746cff07632fba1cdb9c6d874b569b4f21`, keeps M14-P.1 authoritative, and closes speculative performance work before M14-O. M14-P.5.1 corrects repository continuity, and M14-O — Generated Text Snippet Tags & Retrieval is the active implementation milestone but is not yet implemented. Actual AI Workspace behavior remains M15; permissions, trigger delivery, usage semantics, image quality, Dexie v6, and Backup v7 remain unchanged.

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

## Git Metadata Layout

This working tree may remain in a synchronized Google Drive directory, but Git metadata is stored in a separate local non-synchronized directory. The project-root `.git` is therefore a pointer file, not a directory. Use `git rev-parse --absolute-git-dir` to discover the actual Git directory; do not rewrite the pointer or apply recursive `.git` cleanup instructions. GitHub remains the authoritative remote history and normal clone/recovery source.

## Next Step

Implement active M14-O — Generated Text Snippet Tags & Retrieval according to Decision 53 while preserving Decisions 56 and 57. The final M14-P gate—including measured and real-Chrome Text performance regression verification—follows M14-O, then M15 AI Workspace. No additional broad performance milestone sits before M14-O. M14-P overall is not complete. F3 Save as Snippet and all actual AI behavior remain M15; canonical activation remains `;trigger + Space`. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
