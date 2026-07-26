# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

The platform architecture is approved and frozen. Milestone 8 — Ollama Provider is complete and synchronized at checkpoint `2de8dcb`, and Milestone 9 — Output Workspace is current. Users can manage locally persisted Knowledge and Snippet entries through the shared options-page Library surface; the headless Retrieval Engine, Prompt Builder, and replaceable generation boundary are implemented. The implementation-ready M9 architecture connects them through a focused `OutputWorkflow` on a dedicated foreground extension Workspace page with transient manual inputs, automatic retrieval, a temporary model field, editable plain-text output, Copy, minimal localhost host access, and no persistence or browser-page integration.

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

The Principal Engineer should review the Milestone 9 architecture definition and authorize its documentation checkpoint and GitHub synchronization. After synchronization, the exact M9 implementation task should be approved under the frozen `OutputWorkflow`, Workspace, runtime, permission, UI, privacy, and validation contracts.
