# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-P.1 is approved at `7bc5005`, and M14-P.2 is approved at `64b5dd8`. M14-P.3 is the active documentation-only checkpoint: it records the approved toolbar-to-Side-Panel and Settings path, UI-only Knowledge hiding, Snippet Library hierarchy/actions/delete confirmation, Image Edit preview repair, and the strict M14-P.4/M14-O/final-M14-P/M15 sequence. Runtime, delivery, trigger behavior, image quality, Dexie v6, and Backup v7 remain unchanged.

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

After M14-P.3 review/checkpoint, the next implementation is M14-P.4 — Navigation & Snippet Library UI Completion. Then come M14-O Generated Text Snippet Tags & Retrieval, the final M14-P completion gate, and M15 AI Workspace. M14-P overall is not complete. F3 Save as Snippet and all actual AI Workspace behavior remain M15; canonical activation remains `;trigger + Space`. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
