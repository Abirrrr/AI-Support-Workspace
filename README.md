# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9–14 are complete. M14-O — Generated Text Snippet Tags & Retrieval is approved and checkpointed at `6e89388`, and M14-P — Final Snippet Completion Gate is **COMPLETE / PRINCIPAL-APPROVED** after the M14-P.6 automated audit and the Principal-accepted 14-item real-Chrome/manual matrix both passed with no blocker. Text performance and Image quality/safety are accepted. M15 — AI Workspace is the next milestone, but its functional implementation has not started.

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

The next Principal action is to define and activate the first M15 implementation subtask. M15 owns Merchant Context behavior, Context image attachments, Guidance / Gist behavior, provider-independent model selection, Generate/provider execution, editable Generated Output lifecycle and Copy, and F3 Save Generated Output as Snippet. The existing Side Panel presentation is present, but none of those functional behaviors is active under M15 yet. Dexie remains v6, Backup remains v7, and canonical activation remains `;trigger + Space`. See [the roadmap](docs/ROADMAP.md), [the decision record](docs/DECISIONS.md), and [the project state](docs/PROJECT_STATE.md).
