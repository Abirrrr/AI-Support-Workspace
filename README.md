# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, 11 — Settings, and 12 — Import / Export are complete. The latest committed and pushed checkpoint is `043daca` (`docs: define snippet trigger expansion architecture`). Milestone 13 — Snippet Trigger Expansion v1 is current. M13-A.1 is complete and Principal Engineer approved; M13-B and M13-B.1 remain intact as uncommitted implementation work. M13-B.2 — All-Sites Scope and Isolated-World Expansion Correction is active, making expansion available on normal HTTP/HTTPS websites through a realm-safe content-script boundary. Principal Engineer source review and real Chrome validation remain pending, so M13 is not complete. M14 is Rich Snippet Templates, M15 is Multimodal Screenshot Context, and M16 is OpenAI Provider Expansion.

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

Complete M13-B.2 source review and automated validation, then perform product-owner real Chrome validation with the rebuilt and reloaded extension. Do not mark M13 complete or create a checkpoint before those gates pass.
