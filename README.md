# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace, 10 — Keyboard Shortcut, and 11 — Settings are complete. The latest committed and pushed checkpoint is `d40e031` (`feat: add default Ollama model settings`). Milestone 12 — Import / Export is current, with M12-A.1 — Task Identification and Future Capability Roadmap Alignment active and awaiting Principal review. M12-B — Import / Export Architecture Readiness Review is next and has not started; Import / Export architecture and implementation remain undefined. The roadmap assigns Provider Expansion / OpenAI to M13, Multimodal Context Attachments to M14, and Rich Snippet Templates & Trigger Expansion to M15 without defining their detailed architecture.

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

Review M12-A.1 and authorize its documentation checkpoint. Afterward, begin the unstarted M12-B architecture-readiness review; do not implement Import / Export before its architecture is approved.
