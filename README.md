# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-P.1 through M14-P.5 are approved checkpoints. Active M14-O — Generated Text Snippet Tags & Retrieval is implemented with automated validation passing and awaits Principal review. It adds headless Text-only versioned generated metadata, a provider-neutral generation port with no production adapter, strict bounded parsing, explicit max-20/concurrency-one backfill, and local 5/3/1/1 lexical retrieval. Actual AI Workspace behavior remains M15; UI, permissions, trigger delivery, usage semantics, image quality, Dexie v6, and Backup v7 remain unchanged.

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

Principal review and checkpoint M14-O if accepted. The final M14-P gate—including measured and real-Chrome Text performance regression verification—then follows, before M15 AI Workspace. M14-P overall is not complete. There is no generated-tag UI or production tag generator; F3 Save as Snippet and all functional AI Workspace behavior remain M15. Canonical activation remains `;trigger + Space`. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
