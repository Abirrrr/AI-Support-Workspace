# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-P.1 through M14-P.4 are approved checkpoints; M14-P.4/M14-P.4.1/M14-P.4.2 is synchronized at `52befe0` with the responsive Workspace presentation, normal-tab Options application, direct toolbar-to-Side-Panel flow, management UI, authoritative Library Copy, deletion safety, and retained-Image preview repair. M14-P.5 is the active documentation-only performance closure: M14-P.1 remains authoritative and no second speculative optimization milestone is planned before M14-O. Actual AI behavior remains M15; permissions, trigger delivery, usage semantics, image quality, Dexie v6, and Backup v7 remain unchanged.

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

Review and checkpoint the M14-P.5 documentation-only performance closure. M14-O — Generated Text Snippet Tags & Retrieval is the next implementation milestone, followed by the final M14-P gate—including measured and real-Chrome Text performance regression verification—and M15 AI Workspace. No additional broad performance milestone sits before M14-O. M14-P overall is not complete. F3 Save as Snippet and all actual AI behavior remain M15; canonical activation remains `;trigger + Space`. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
