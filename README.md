# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-J validates Text, list, Image, Shadow-DOM, and no-refresh lifecycle behavior in Crisp and Intercom. M14-K is Principal-approved, real-browser validated, complete, and closed at implementation checkpoint `e34cd76` (`feat: add automatic snippet paste delivery`). Decision 45's optional focus-safe Windows automatic paste passes Text and Image delivery in both destinations, while clipboard-only/manual `Ctrl+V` remains permanently supported.

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

Decisions 46–49 lock the future handoff without changing runtime behavior: Text Snippets become the sole active user-managed AI reference library; Image Snippets remain delivery-only; Knowledge retires from the future active workflow/UI but its current domain/data/backups remain intact pending separate migration approval; optional Guidance / Gist, compact Context/attachments/model/output UI, periodic canonical automatic backup, generated Text Snippet tags, and best-effort usage statistics are future-approved. Current Dexie v5, Backup v6, permissions, dependencies, and M6/M7/M9 implementation remain unchanged. The class-C Image/native opportunity and production native packaging remain deferred. The next planned engineering gate is Post-M14 Snippet Hardening—periodic canonical automatic backup, generated Text Snippet retrieval tags, and best-effort `usageCount`/`lastUsedAt`—with its task ID intentionally unassigned and implementation not started. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
