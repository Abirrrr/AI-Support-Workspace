# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–13 and M14-J are complete. M14-J validates Text, list, Image, Shadow-DOM, and no-refresh lifecycle behavior in Crisp and Intercom. M14-K.3 is Principal-approved: Decision 45's optional focus-safe Windows automatic paste passes Text and Image delivery in both destinations. M14-K.4 is the active documentation-only product-decision/AI-handoff task. M14-K implementation is validated and approved, but its checkpoint still requires final Principal review/Git authorization and M14-K is not closed.

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

Decisions 46–49 lock the future handoff without changing runtime behavior: Text Snippets become the sole active user-managed AI reference library; Image Snippets remain delivery-only; Knowledge retires from the future active workflow/UI but its current domain/data/backups remain intact pending separate migration approval; optional Guidance / Gist, compact Context/attachments/model/output UI, periodic canonical automatic backup, generated Text Snippet tags, and best-effort usage statistics are future-approved. Current Dexie v5, Backup v6, permissions, dependencies, M6/M7/M9 implementation, and the complete dirty M14-K source/test tree remain unchanged. The class-C Image/native opportunity and production native packaging remain deferred. Exact next is final Principal review of M14-K.4 and authorization of the combined checkpoint/closeout; do not stage, commit, push, or mark M14-K closed before approval. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
