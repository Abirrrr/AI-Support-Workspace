# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

The platform architecture is approved and frozen. Milestone 7 — Prompt Builder is complete and synchronized at checkpoint `a71dfed`, and Milestone 8 — Ollama Provider is current. Users can manage locally persisted Knowledge and Snippet entries through the shared options-page Library surface; the headless Retrieval Engine provides deterministic local lexical retrieval, and the headless Prompt Builder composes prepared support inputs into a typed provider-independent `PromptAssembly`. The implementation-ready M8 architecture defines a narrow project-owned generation contract and a local-only, non-streaming Ollama adapter, but no provider implementation or extension runtime integration exists yet.

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

The Principal Engineer should review the Milestone 8 architecture definition and authorize its documentation checkpoint and GitHub synchronization. After that checkpoint is synchronized, the exact Milestone 8 — Ollama Provider implementation task should be prepared and approved under the frozen provider contract and existing roadmap.
