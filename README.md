# AI Support Workspace

This repository is the foundation for a long-lived, local-first Chrome extension project focused on AI-assisted support workflows.

## Current Scope

Milestones 9 — Output Workspace and 10 — Keyboard Shortcut are complete. The M10 implementation checkpoint is `6093361` (`feat: add selected-text capture shortcut`), and the later repository-continuity correction is committed at `37ad72f` (`docs: synchronize project state after M10`); local `master` is synchronized with `origin/master`. The browser-scoped `capture-selection-to-workspace` command captures explicit main-frame selection, immediately opens the global Workspace Side Panel without awaiting capture, delivers a typed transient result through a delivery-ID ready/acknowledgement handshake, replaces Merchant Context, requests Guidance DOM focus and a collapsed end caret, and leaves Generate manual. Opening a closed panel provides usable Guidance keyboard focus. When the panel is already visible and the webpage owns keyboard focus, Chrome may keep keyboard routing on the webpage despite the successful internal focus request, so the user may need to click Guidance. Milestone 11 — Settings is current and architecture-defined but not implemented. It adds one local saved default Ollama model, a typed Settings boundary, and the required Dexie version 2 migration; all other settings remain deferred.

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

Prepare a separate Principal Engineer implementation specification for the approved Milestone 11 — Settings architecture. Do not mark M11 complete or advance to M12 before implementation, review, documentation synchronization, and validation are complete.
