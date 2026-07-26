# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

The platform architecture is approved and frozen. Milestone 8 — Ollama Provider is complete, and Milestone 9 — Output Workspace is current. Users can manage locally persisted Knowledge and Snippet entries through the shared options-page Library surface; the headless Retrieval Engine provides deterministic local lexical retrieval, the headless Prompt Builder composes prepared support inputs into a typed provider-independent `PromptAssembly`, and the replaceable `OllamaProvider` performs local-only, non-streaming generation through the project-owned `GenerationProvider` boundary. M8 remains independent of Chrome runtime placement and added no generation workflow, Output Workspace, Settings, persistence, localhost permission, or CORS integration.

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

The Principal Engineer should review the Milestone 8 closeout and authorize the uncommitted M8 implementation checkpoint and GitHub synchronization when satisfied. Milestone 9 — Output Workspace is the next roadmap milestone and requires its own approved architecture and implementation scope before work begins.
