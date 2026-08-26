# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-N.1 and M14-N.2 remain historical automatic-backup feasibility/implementation checkpoints. M14-N.3 records the Principal/Product simplification: the current product uses Manual Backup v7 Export, local successful-export tracking, and a 30-day advisory reminder; production automatic filesystem scheduling, folder management, retention, and `alarms` are retired. Dexie remains v6, Backup remains v7, and historical automatic state/files remain dormant and untouched. M14-O is next after review and checkpoint. Clipboard-only/manual `Ctrl+V` remains permanently supported.

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

Decision 55 makes Manual Backup v7 plus local `lastSuccessfulBackupAt` and a 30-day advisory reminder authoritative. The former M14-N.3 real-Chrome automatic-backup validation is cancelled; M14-N.1/N.2 remain historical checkpoints. M14-O Generated Text Snippet Tags & Retrieval is next. Before M14-P closes, daily-use link presentation, deterministic Edit focus/navigation, the complete Snippet subsystem, and real-world delivery performance must be reviewed and stabilized. F3 Save as Snippet remains M15, and the canonical Snippet trigger prefix remains `;`. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
