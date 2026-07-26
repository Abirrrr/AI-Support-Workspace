# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

The platform architecture is approved and frozen through Milestone 9 architecture checkpoint `d0e01d7`, and Milestone 9 — Output Workspace is current. Users can manage locally persisted Knowledge and Snippet entries through the shared options-page Library surface; the headless Retrieval Engine, Prompt Builder, and replaceable generation boundary are implemented. Manual product review has amended the M9 Workspace surface to a global Chrome Side Panel companion beside the active support website. The focused `OutputWorkflow`, transient manual inputs, automatic retrieval, temporary model field, editable plain-text output, Copy, localhost Ollama access, and no-persistence or page-integration boundaries remain unchanged. Existing uncommitted M9 implementation predates the Side Panel amendment and requires a focused surface migration before implementation review.

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

The Principal Engineer should review the Milestone 9 Side Panel architecture amendment. After approval, the next implementation task should migrate the existing uncommitted standalone Workspace surface, popup opening behavior, manifest contract, responsive layout, and related tests to the global WXT Side Panel while preserving the frozen workflow and provider behavior.
