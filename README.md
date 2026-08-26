# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-N.3 is complete at `d410ecb`: the current product uses Manual Backup v7 Export, local successful-export tracking, and a 30-day advisory reminder; production automatic filesystem scheduling, folder management, retention, and `alarms` are retired. M14-P.1 is the active focused performance gate promoted ahead of M14-O. It re-measures current Text/Image delivery and optimizes only evidence-backed native PNG request serialization without changing safety, protocol, automatic paste, or manual `Ctrl+V` fallback. Dexie remains v6 and Backup remains v7.

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

M14-P.1 now requires Principal real-Chrome validation of Text, PNG, and JPEG/WebP responsiveness in the actual daily-use workflow. After this focused gate, sequencing is M14-O Generated Text Snippet Tags & Retrieval → F1/F2 daily-use UX cleanup → M14-P final completion gate → M15. M14-P overall is not complete. F3 Save as Snippet remains M15, and the canonical Snippet trigger prefix remains `;`. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
