# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-N.3 is complete at `d410ecb`, and approved M14-P.1 is synchronized at `7bc5005`. M14-P.2 is the active focused daily-use UX gate promoted ahead of M14-O: safe links are blue and underlined only inside the Text Snippet editor, while explicit Edit scrolls the existing authoring form and focuses Text content or Image Title without timers, polling, automatic save, or file-picker activation. Delivery/performance, safety, protocol, automatic/manual paste, Dexie v6, and Backup v7 remain unchanged.

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

M14-P.2 requires Principal real-Chrome validation of saved/reopened safe-link presentation and explicit Text/Image Edit scroll/focus. After successful review/checkpoint, sequencing is M14-O Generated Text Snippet Tags & Retrieval → M14-P final completion gate → M15. M14-P overall is not complete. F3 Save as Snippet remains M15, and canonical activation remains `;trigger + Space`. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
