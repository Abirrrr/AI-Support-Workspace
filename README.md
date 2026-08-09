# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, 11 — Settings, 12 — Import / Export, and 13 — Snippet Trigger Expansion v1 are complete. M14 — Rich Snippet Templates is current under Decision 36. M14-B implements canonical plain-or-rich Snippet content, deterministic plain projection, Dexie version 4, Backup Format v3 with v1/v2 import compatibility, and M13 trigger compatibility. M14-C implements explicit Plain-to-Rich conversion and structured authoring in the existing Snippet Library. Rich browser rendering remains pending. M15 remains Multimodal Screenshot Context and M16 remains OpenAI Provider Expansion.

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

After M14-C approval, create M14-D — Rich Snippet Browser Rendering. The M14 data, backup, and authoring foundations are implemented; browser expansion still uses deterministic plain projection.
