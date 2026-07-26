# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

The platform architecture is approved and frozen through Milestone 9 Side Panel architecture amendment checkpoint `e587398`. Milestone 9 — Output Workspace is implemented, reviewed, automatically validated, manually validated in Chrome, and documented; its implementation checkpoint remains uncommitted. The native WXT global Side Panel provides transient manual Context, Guidance, model input, automatic local retrieval, provider-independent generation through Ollama, editable plain-text output, and Copy beside the active support website. Knowledge and Snippet management remain in the options-page Library surface. Milestone 10 — Keyboard Shortcut is current.

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

Review and authorize the complete uncommitted Milestone 9 implementation checkpoint, push and synchronize it, then define Milestone 10 — Keyboard Shortcut architecture before implementation.
