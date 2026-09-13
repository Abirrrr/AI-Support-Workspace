# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 and approved M14 supplemental work are complete. M14-P is **COMPLETE / PRINCIPAL-APPROVED**; M14-T bounded rendering and M14-U restore attribution are complete and Principal-approved; M14-U.1 is checkpointed and pushed at `e9d0f97`. M15-A — AI Workspace Architecture & Contract Lockdown is architecture/documentation complete and awaiting Principal review. M15 runtime implementation has not started.

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

The next Principal action is to review and authorize the M15-A documentation checkpoint. Decision 58 and [the AI Workspace architecture](docs/AI_WORKSPACE_ARCHITECTURE.md) lock the versioned implementation contract; the existing Side Panel presentation is present, but no M15 runtime behavior is active. After the checkpoint, a separately defined implementation task may begin. Dexie remains v6, Backup remains v7, and canonical activation remains `;trigger + Space`. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
