# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, 11 — Settings, and 12 — Import / Export are complete. Milestone 12 closed with Principal Engineer approval, frozen dedicated Backup Format v1 DTOs and explicit mappings, successful automated and risk-based real Chrome validation, and final committed and pushed implementation checkpoint `d304f90` (`feat: add import and export backup workflow`). Milestone 13 — Provider Expansion / OpenAI is current. M13-A — Provider Expansion / OpenAI Architecture Readiness Review is active but has not started, and no M13 implementation is authorized. M14 remains Multimodal Context Attachments, and M15 remains Rich Snippet Templates & Trigger Expansion.

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
- .github/workflows/: CI and workflow configuration

## Documentation

The documentation in the docs directory is the only authoritative source of truth for product direction, architecture, workflow, and project state.

## Next Step

Perform the read-only M13-A — Provider Expansion / OpenAI Architecture Readiness Review. Do not begin M13 implementation until architecture readiness has been reviewed and implementation is explicitly authorized.
