# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace and 10 — Keyboard Shortcut are complete. The latest existing checkpoint is `8cfc38b` (`docs: record repeated side panel focus limitation`); the completed M10 implementation, tests, and closeout documentation remain uncommitted pending Principal approval and the authorized implementation checkpoint. The browser-scoped `capture-selection-to-workspace` command captures explicit main-frame selection, immediately opens the global Workspace Side Panel without awaiting capture, delivers a typed transient result through a delivery-ID ready/acknowledgement handshake, replaces Merchant Context, requests Guidance DOM focus and a collapsed end caret, and leaves Generate manual. Opening a closed panel provides usable Guidance keyboard focus. When the panel is already visible and the webpage owns keyboard focus, Chrome may keep keyboard routing on the webpage despite the successful internal focus request, so the user may need to click Guidance. Milestone 11 — Settings is the current roadmap milestone; its architecture and implementation have not begun.

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

Obtain Principal approval for the completed M10 implementation and closeout diff, then create and push the authorized M10 implementation checkpoint and confirm local/remote synchronization. Only after that checkpoint may Milestone 11 — Settings architecture and implementation work begin.
